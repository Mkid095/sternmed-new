import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  verifyFirebaseIdToken,
  bearerFrom,
  requireStaff,
  StaffDeniedError,
} from '../_shared/firebaseAuth.ts';

/**
 * manage-orders
 *
 * Admin-side reads and writes on the `orders` table.
 *
 * Why this exists
 * ---------------
 * The `orders` RLS policies are keyed to Supabase auth:
 *
 *   using (exists (select 1 from users where users.id = auth.uid() ...))
 *
 * But this application authenticates with FIREBASE, and records the Firebase
 * UID in `users.firebase_uid` — `users.id` is the table's own uuid and never
 * equals `auth.uid()`. Supabase `auth.uid()` is therefore always NULL, so every
 * admin-gated policy silently matches zero rows.
 *
 * The visible symptom was a status change that appeared to work: PostgREST
 * returns `204 No Content` for an UPDATE whose WHERE matched nothing, so the
 * client saw success and nothing was written. The same mismatch also meant an
 * admin could only see orders via the "guest" policy (`user_id is null`), so
 * any order placed by a signed-in customer was invisible in the admin.
 *
 * Both are fixed here, service-side, without loosening RLS: the caller's
 * Firebase ID token is verified, resolved to a Supabase `users` row, and
 * required to be staff before the service-role client touches anything.
 *
 * Authorization
 * -------------
 * A valid Firebase token is only half the check — it proves who the caller is,
 * not that they may read every order. The `users` role lookup is what turns
 * "signed in" into "is staff".
 *
 * No secret to provision: verifying an ID token needs only Google's public
 * signing certificates, so this works as soon as it is deployed. See
 * `../_shared/firebaseAuth.ts`.
 */

const FIREBASE_PROJECT_ID = Deno.env.get('FIREBASE_PROJECT_ID') ?? 'sternmed-new';

/** The only statuses a request may set. Guards against a crafted body. */
const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const;
const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'] as const;

type OrderStatus = (typeof ORDER_STATUSES)[number];
type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

type Supabase = ReturnType<typeof createClient>;

/**
 * Every order, newest first, with its line items.
 *
 * The service-role client is what makes this complete: the anon client could
 * only ever see guest orders.
 */
async function listOrders(supabase: Supabase) {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) throw new Error(error.message);
  return { orders: data ?? [] };
}

/**
 * Set an order's status and, optionally, its payment status.
 *
 * `updated_at` is stamped here because the table has the column and nothing was
 * writing it — every status change so far left the row looking untouched.
 *
 * `.select()` after the update is deliberate. Without it the response is 204
 * with no body, which is the exact failure this function exists to eliminate: a
 * write that silently matched nothing. Here a miss comes back as null and is
 * turned into an error the client can show.
 */
async function updateOrderStatus(
  supabase: Supabase,
  orderId: string,
  status: OrderStatus,
  paymentStatus?: PaymentStatus,
) {
  const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (paymentStatus) patch.payment_status = paymentStatus;

  const { data, error } = await supabase
    .from('orders')
    .update(patch)
    .eq('id', orderId)
    .select()
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error(`Order ${orderId} was not found, so nothing was changed.`);
  return { order: data };
}

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const json = (body: unknown, status: number) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // ---- Authenticate: a real, live, correctly signed Firebase session ----
  const idToken = bearerFrom(req.headers.get('Authorization'));
  if (!idToken) {
    return json({ error: 'Missing authorization token' }, 401);
  }

  let uid: string;
  try {
    ({ uid } = await verifyFirebaseIdToken(idToken, FIREBASE_PROJECT_ID));
  } catch (err) {
    console.error('Token verification failed:', err);
    // One message for every failure on purpose: distinguishing "forged" from
    // "expired" tells an attacker which one they managed.
    return json({ error: 'Invalid or expired session. Please sign in again.' }, 401);
  }

  // ---- Authorize: signed in is not the same as allowed ----
  try {
    await requireStaff(supabase, uid, ['admin', 'staff']);
  } catch (err) {
    if (err instanceof StaffDeniedError) {
      return json({ error: err.message }, 403);
    }
    console.error('Caller lookup failed:', err);
    return json({ error: 'Could not verify your access' }, 500);
  }

  // ---- Dispatch ----
  let body: { operation?: string; orderId?: string; status?: string; paymentStatus?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid request body' }, 400);
  }

  try {
    switch (body.operation) {
      case 'listOrders':
        return json(await listOrders(supabase), 200);

      case 'updateOrderStatus': {
        const { orderId, status, paymentStatus } = body;

        if (!orderId || typeof orderId !== 'string') {
          return json({ error: 'orderId is required' }, 400);
        }
        if (!status || !(ORDER_STATUSES as readonly string[]).includes(status)) {
          return json({ error: `status must be one of: ${ORDER_STATUSES.join(', ')}` }, 400);
        }
        if (
          paymentStatus !== undefined &&
          !(PAYMENT_STATUSES as readonly string[]).includes(paymentStatus)
        ) {
          return json(
            { error: `paymentStatus must be one of: ${PAYMENT_STATUSES.join(', ')}` },
            400,
          );
        }

        return json(
          await updateOrderStatus(
            supabase,
            orderId,
            status as OrderStatus,
            paymentStatus as PaymentStatus | undefined,
          ),
          200,
        );
      }

      default:
        return json({ error: `Unknown operation: ${body.operation}` }, 400);
    }
  } catch (err) {
    console.error('Operation failed:', err);
    return json({ error: err instanceof Error ? err.message : 'Operation failed' }, 500);
  }
});