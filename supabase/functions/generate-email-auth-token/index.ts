import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

// Custom JWT implementation for Firebase custom tokens
interface FirebaseCustomTokenPayload {
  uid: string;
  email?: string;
  email_verified?: boolean;
  claims?: {
    admin?: boolean;
    aliasId?: string;
  };
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  // Add padding if needed
  const padding = str.length % 4;
  const padded = padding ? str + '='.repeat(4 - padding) : str;
  return Buffer.from(padded, 'base64').toString('utf-8');
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}

function jsonReplacer(_: string, value: any): any {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
}

async function createFirebaseCustomToken(
  uid: string,
  email?: string,
  serviceAccountJson: string
): Promise<string> {
  const serviceAccount = JSON.parse(serviceAccountJson);

  const header = {
    alg: 'RS256',
    kid: serviceAccount.private_key_id,
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const payload: FirebaseCustomTokenPayload = {
    uid,
    email,
    email_verified: true,
    claims: {
      aliasId: uid, // We'll map this later
    },
  };

  const iat = now;
  const exp = now + 3600; // 1 hour
  const aud = 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit';
  const iss = `firebase-adminsdk-${serviceAccount.client_email.split('@')[0]}@${serviceAccount.client_email.split('@')[1]}`;
  const sub = serviceAccount.client_email;

  const segments = [
    base64UrlEncode(JSON.stringify(header)),
    base64UrlEncode(
      JSON.stringify(
        {
          ...payload,
          iat,
          exp,
          aud,
          iss,
          sub,
        },
        jsonReplacer
      )
    ),
  ];

  const signingInput = segments.join('.') + '.';

  // Sign with service account private key
  const { verify } = await import('https://deno.land/x/ultra_crypto@v0.10.0/mod.ts');
  const privateKey = serviceAccount.private_key.replace(/\\n/g, '\n');

  // Note: Deno's crypto API differs; this is complex. Let's use a simpler approach.
  throw new Error('Direct JWT signing is complex. Use Firebase Admin SDK.');

  // For now, we'll call a Cloudflare Worker that has Firebase Admin, or use a Node.js service.
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { aliasId } = body;

    if (!aliasId) {
      return new Response(JSON.stringify({ error: 'aliasId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, firebase_uid, email')
      .eq('email_alias_id', aliasId)
      .single();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'User not found for this alias' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (!user.firebase_uid) {
      return new Response(JSON.stringify({ error: 'User has no Firebase account linked' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Instead of creating custom token here, we'll ask the user to use Firebase Admin SDK on a Node server.
    // For now, return instructions.
    return new Response(
      JSON.stringify({
        error: 'Not implemented',
        message:
          'SSO requires a separate Node.js service with firebase-admin SDK. Deploy generate-email-auth-token as a Node Cloudflare Worker instead.',
      }),
      {
        status: 501,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error('Error in generate-email-auth-token:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});
