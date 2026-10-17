// Admin Operations Edge Function
//
// Bridges Firebase Auth with Supabase for admin-only operations, using the
// service role once the caller is verified.
//
// SECURITY FIX (see the note in ../_shared/firebaseAuth.ts)
// ---------------------------------------------------------
// This function used to verify the caller with:
//
//   const payload = JSON.parse(atob(token.split('.')[1]))
//   if (payload.exp && payload.exp < Date.now() / 1000) return null
//   return payload
//
// That decoded the JWT. It never checked the signature, so the `uid` it
// returned was whatever the caller put there. Anyone could hand this function a
// hand-written token naming an admin's uid and reach the service-role paths
// below — creating admins, creating aliases, deleting users.
//
// Token verification now lives in `../_shared/firebaseAuth.ts` and performs a
// real RS256 signature check against Google's published certificates, along
// with issuer, audience and expiry. The role check against the Supabase `users`
// table is kept as well: a valid token proves WHO the caller is, not that they
// may do this.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  verifyFirebaseIdToken,
  bearerFrom,
  StaffDeniedError,
} from '../_shared/firebaseAuth.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const FIREBASE_PROJECT_ID = Deno.env.get('FIREBASE_PROJECT_ID') ?? 'sternmed-new'

interface RequestBody {
  operation: 'createAlias' | 'createAdmin' | 'toggleSiteStatus' | 'deleteUser'
  data: any
  /**
   * The caller's Firebase ID token.
   *
   * The Authorization header is preferred; this body field is kept because
   * existing callers send it. A token that arrives in the body of an
   * unauthenticated POST is still fully verified, so this is a transport
   * preference rather than a weaker path — but the header is where a real
   * proxy or platform would look, so new callers should use it.
   */
  firebaseToken?: string
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  })

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS })
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  let body: RequestBody
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid request body' }, 400)
  }
  const { operation, data } = body

  // ---- Authenticate ----
  const idToken = bearerFrom(req.headers.get('Authorization')) || (body.firebaseToken ?? '').trim()
  if (!idToken) {
    return json({ error: 'Missing authorization token' }, 401)
  }

  let uid: string
  try {
    ;({ uid } = await verifyFirebaseIdToken(idToken, FIREBASE_PROJECT_ID))
  } catch (err) {
    console.error('Token verification failed:', err)
    // One message for every failure: saying "forged" vs "expired" tells an
    // attacker which they achieved.
    return json({ error: 'Invalid or expired session. Please sign in again.' }, 401)
  }

  // ---- Authorize: this function is admin-only, so staff is not enough ----
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('firebase_uid', uid)
    .maybeSingle()

  if (userError) {
    console.error('Caller lookup failed:', userError)
    return json({ error: 'Could not verify your access' }, 500)
  }
  if (!user || user.role !== 'admin') {
    return json({ error: 'Unauthorized: Admin access required' }, 403)
  }

  // ---- Dispatch ----
  try {
    let result

    switch (operation) {
      case 'createAlias':
        result = await createEmailAlias(supabase, data)
        break

      case 'createAdmin':
        result = await createAdminUser(supabase, data, uid)
        break

      case 'toggleSiteStatus':
        result = await toggleSiteStatus(supabase, data.mode)
        break

      case 'deleteUser':
        result = await deleteUserRecord(supabase, data.id)
        break

      default:
        return json({ error: 'Invalid operation' }, 400)
    }

    return json({ success: true, data: result }, 200)
  } catch (error: any) {
    console.error('Error in admin-operations:', error)
    return json({ error: error?.message || 'Internal server error' }, 500)
  }
})

async function createEmailAlias(supabase: any, data: { email: string; name: string; recipientEmail: string }) {
  // Create email alias
  const { data: alias, error: aliasError } = await supabase
    .from('email_aliases')
    .insert({
      alias_email: data.email,
      display_name: data.name,
      is_active: true,
    })
    .select()
    .single()

  if (aliasError) throw aliasError

  // Create user with pending Firebase UID
  const { data: newUser, error: userError } = await supabase
    .from('users')
    .insert({
      firebase_uid: `pending_${alias.id}`,
      email: alias.alias_email,
      role: 'email_user',
      email_alias_id: alias.id,
    })
    .select()
    .single()

  if (userError) throw userError

  return { alias, user: newUser }
}

async function createAdminUser(supabase: any, data: { email: string; password: string; name: string; role: string }, adminUid: string) {
  // This would need Firebase Admin SDK to create the Firebase user
  // For now, just create the Supabase user record
  // The Firebase user creation should happen on the frontend first

  const { data: newUser, error } = await supabase
    .from('users')
    .insert({
      firebase_uid: `pending_admin_${Date.now()}`, // Will be updated when Firebase user is created
      email: data.email,
      name: data.name,
      role: data.role || 'staff',
    })
    .select()
    .single()

  if (error) throw error

  return newUser
}

async function toggleSiteStatus(supabase: any, mode: string) {
  const isActive = mode === 'live'

  const { data: existing, error: readError } = await supabase
    .from('site_settings')
    .select('*')
    .eq('key', 'site_status')
    .maybeSingle()

  if (readError) throw readError

  if (existing) {
    const { error } = await supabase
      .from('site_settings')
      .update({ value: isActive ? 'live' : 'maintenance' })
      .eq('key', 'site_status')
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('site_settings')
      .insert({ key: 'site_status', value: isActive ? 'live' : 'maintenance' })
    if (error) throw error
  }

  return { status: isActive ? 'live' : 'maintenance' }
}

async function deleteUserRecord(supabase: any, id: string) {
  const { error } = await supabase.from('users').delete().eq('id', id)
  if (error) throw error
  return { id, deleted: true }
}