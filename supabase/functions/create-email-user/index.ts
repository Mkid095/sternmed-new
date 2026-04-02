import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface RequestBody {
  email: string
  password: string
  displayName: string
  aliasId: string
}

// Use Firebase REST API to create user
async function createFirebaseUser(
  email: string,
  password: string,
  displayName: string,
  apiKey: string
): Promise<{ localId: string }> {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/projects/sternmed-new/accounts:signUp?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        displayName,
        returnSecureToken: true,
      }),
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error?.message || 'Failed to create Firebase user')
  }

  return { localId: data.localId }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    })
  }

  // Add CORS headers to all responses
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, content-type',
  };

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const body = await req.json()
    const email: string = body.email
    const password: string = body.password
    const displayName: string = body.displayName
    const aliasId: string = body.aliasId

    // Validate input
    if (!email || !password || !displayName || !aliasId) {
      const errorResponse = JSON.stringify({ error: 'Missing required fields' })
      return new Response(errorResponse, {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    // Get Firebase API key from environment
    const apiKey = Deno.env.get('FIREBASE_API_KEY')
    if (!apiKey) {
      const errorResponse = JSON.stringify({ error: 'FIREBASE_API_KEY not configured' })
      return new Response(errorResponse, {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    // 1. Create Firebase user
    const { localId: firebaseUid } = await createFirebaseUser(
      email,
      password,
      displayName,
      apiKey
    )

    // 2. Create user record in Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        firebase_uid: firebaseUid,
        email: email,
        name: displayName,
        role: 'email_user',
        email_alias_id: aliasId,
      })
      .select()
      .single()

    if (userError) {
      console.error('Supabase error:', userError)
      // Clean up Firebase user if Supabase insert fails
      await fetch(
        `https://identitytoolkit.googleapis.com/v1/projects/sternmed-new/accounts:delete?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ localId: firebaseUid }),
        }
      )
      throw userError
    }

    const responseData = JSON.stringify({
      success: true,
      data: {
        email,
        password,
        name: displayName,
        userId: newUser.id,
        firebaseUid,
      },
    })

    return new Response(responseData, {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (error: any) {
    console.error('Error in create-email-user:', error)
    const errorResponse = JSON.stringify({
      error: error.message || 'Internal server error',
    })
    return new Response(errorResponse, {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
