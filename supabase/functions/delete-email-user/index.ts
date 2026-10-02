import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  // Handle CORS
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

    // Get Supabase service role key
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
      // No user associated, but we still need to delete related records
      // due to NO ACTION FK constraints on email tables
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

    // Delete Firebase user
    const firebaseApiKey = Deno.env.get('FIREBASE_API_KEY');
    if (!firebaseApiKey) {
      throw new Error('FIREBASE_API_KEY not configured');
    }

    const firebaseResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/projects/sternmed-new/accounts:delete?key=${firebaseApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ localId: user.firebase_uid }),
      }
    );

    const firebaseResult = await firebaseResponse.json();
    if (!firebaseResponse.ok) {
      console.error('Firebase deletion error:', firebaseResult);
      // Continue to delete Supabase records even if Firebase delete fails? Might be okay if user already deleted.
    }

    // Delete all related records that block the alias FK
    // These tables have NO ACTION constraints on alias_id, so we must delete first
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
