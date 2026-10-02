import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ---------------------------------------------------------------------------
// Firebase Admin Auth via REST API (Deno-compatible)
// Uses a service account to get an OAuth2 access token, then calls
// Firebase Auth REST API to delete the user.
// ---------------------------------------------------------------------------

interface ServiceAccount {
  project_id: string;
  client_email: string;
  private_key: string;
}

interface GoogleOAuthToken {
  access_token: string;
  expires_in: number;
}

/**
 * Build a signed JWT for Google OAuth2 service account auth.
 * Implements RS256 JWT signing without any Node.js crypto dependencies.
 */
async function getGoogleAccessToken(
  serviceAccount: ServiceAccount
): Promise<GoogleOAuthToken> {
  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 3600;

  const header = base64urlEncode(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64urlEncode(
    JSON.stringify({
      iss: serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: expiry,
    })
  );
  const signingInput = `${header}.${payload}`;

  // Import the RSA private key
  const pemKey = serviceAccount.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\n/g, '');

  const binaryKey = Uint8Array.from(atob(pemKey), (c) => c.charCodeAt(0));
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    new TextEncoder().encode(signingInput)
  );
  const sig = base64urlEncode(
    String.fromCharCode(...new Uint8Array(signature))
  );

  const jwt = `${signingInput}.${sig}`;

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  const data = await tokenResponse.json() as GoogleOAuthToken | { error: string; error_description: string };
  if (!tokenResponse.ok) {
    throw new Error(`OAuth2 token error: ${(data as { error_description: string }).error_description || (data as { error: string }).error}`);
  }
  return data as GoogleOAuthToken;
}

/** Encode a string to base64url (URL-safe base64, no padding) */
function base64urlEncode(str: string): string {
  return btoa(str).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

/**
 * Delete a Firebase user using the Firebase Auth REST API.
 * Requires a valid Google OAuth2 access token from a service account.
 */
async function deleteFirebaseUser(
  uid: string,
  accessToken: string,
  projectId: string
): Promise<void> {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/projects/${projectId}/accounts:delete?key=${Deno.env.get('FIREBASE_API_KEY')}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ localId: uid }),
    }
  );

  if (!response.ok) {
    const data = await response.json() as { error?: { message?: string } };
    const msg = data?.error?.message || `HTTP ${response.status}`;
    throw new Error(`Firebase delete failed: ${msg}`);
  }
}

/**
 * Get the service account credentials from the GOOGLE_APPLICATION_CREDENTIALS
 * secret. In Supabase Edge Functions, this env var holds the raw JSON string
 * of the service account key (not a file path).
 */
function getServiceAccount(): ServiceAccount {
  const credsJson = Deno.env.get('GOOGLE_APPLICATION_CREDENTIALS');
  if (!credsJson) {
    throw new Error(
      'GOOGLE_APPLICATION_CREDENTIALS secret is not set. ' +
      'Add the full service account JSON as a secret in Supabase Edge Function settings.'
    );
  }
  try {
    const creds = JSON.parse(credsJson) as ServiceAccount;
    if (!creds.project_id || !creds.client_email || !creds.private_key) {
      throw new Error('Service account JSON is missing required fields');
    }
    return creds;
  } catch (err) {
    throw new Error(`Failed to parse GOOGLE_APPLICATION_CREDENTIALS: ${err.message}`);
  }
}

// ---------------------------------------------------------------------------
// Main request handler
// ---------------------------------------------------------------------------

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    });
  }

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, content-type',
  };

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

    // Find the user associated with this alias
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, firebase_uid, email')
      .eq('email_alias_id', aliasId)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      throw userError;
    }

    if (!user) {
      // No user associated — still need to clean up related records before deleting alias
      await Promise.all([
        supabase.from('email_inbound').delete().eq('alias_id', aliasId),
        supabase.from('email_outbound').delete().eq('alias_id', aliasId),
        supabase.from('emails').delete().eq('alias_id', aliasId),
        supabase.from('email_alias_limits').delete().eq('alias_id', aliasId),
        supabase.from('email_inbound_unassigned').delete().eq('assigned_alias_id', aliasId),
      ]);
      await supabase.from('email_aliases').delete().eq('id', aliasId);
      return new Response(JSON.stringify({ success: true, message: 'Alias deleted (no associated user)' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // -------------------------------------------------------------------
    // Delete Firebase user via REST API using service account
    // -------------------------------------------------------------------
    const serviceAccount = getServiceAccount();
    const { access_token } = await getGoogleAccessToken(serviceAccount);

    try {
      await deleteFirebaseUser(user.firebase_uid, access_token, serviceAccount.project_id);
    } catch (firebaseError: any) {
      // USER_NOT_FOUND — Firebase user already gone, which is fine
      if (firebaseError.message.includes('USER_NOT_FOUND') || firebaseError.message.includes('user-not-found')) {
        console.warn(`Firebase user ${user.firebase_uid} already deleted, continuing...`);
      } else {
        // Real error — abort so Supabase records stay intact for retry
        throw firebaseError;
      }
    }

    // -------------------------------------------------------------------
    // Clean up Supabase records (required due to NO ACTION FK constraints)
    // -------------------------------------------------------------------
    await Promise.all([
      supabase.from('email_inbound').delete().eq('alias_id', aliasId),
      supabase.from('email_outbound').delete().eq('alias_id', aliasId),
      supabase.from('emails').delete().eq('alias_id', aliasId),
      supabase.from('email_alias_limits').delete().eq('alias_id', aliasId),
      supabase.from('email_inbound_unassigned').delete().eq('assigned_alias_id', aliasId),
    ]);

    // Delete associated user record
    await supabase.from('users').delete().eq('id', user.id);

    // Delete alias
    await supabase.from('email_aliases').delete().eq('id', aliasId);

    return new Response(JSON.stringify({ success: true, message: 'Alias and user deleted' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error: any) {
    console.error('Error in delete-email-user:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});
