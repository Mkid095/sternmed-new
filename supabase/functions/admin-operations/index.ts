// Admin Operations Edge Function
// This function bridges Firebase Auth with Supabase for admin operations
// It verifies Firebase tokens and performs operations using service role privileges

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Firebase Admin SDK setup
// You'll need to set up Firebase Admin SDK credentials
const firebaseProjectId = 'sternmed-new'

interface RequestBody {
  operation: 'createAlias' | 'createAdmin' | 'toggleSiteStatus' | 'deleteUser'
  data: any
  firebaseToken: string
}

serve(async (req) => {
  try {
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

    const { operation, data, firebaseToken }: RequestBody = await req.json()

    // Verify Firebase token
    const decodedToken = await verifyFirebaseToken(firebaseToken)
    if (!decodedToken) {
      return new Response(
        JSON.stringify({ error: 'Invalid Firebase token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Get user from Supabase to verify admin role
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('firebase_uid', decodedToken.uid)
      .single()

    if (userError || !user || user.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Admin access required' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Perform operation based on request
    let result

    switch (operation) {
      case 'createAlias':
        result = await createEmailAlias(supabase, data)
        break

      case 'createAdmin':
        result = await createAdminUser(supabase, data, decodedToken.uid)
        break

      case 'toggleSiteStatus':
        result = await toggleSiteStatus(supabase, data.mode)
        break

      case 'deleteUser':
        result = await deleteUserRecord(supabase, data.id)
        break

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid operation' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Error in admin-operations:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

// Verify Firebase token (simplified - you should use Firebase Admin SDK)
async function verifyFirebaseToken(token: string) {
  try {
    // This is a simplified version
    // In production, use Firebase Admin SDK to properly verify the token
    const payload = JSON.parse(atob(token.split('.')[1]))

    // Check if token is expired
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return null
    }

    return payload
  } catch {
    return null
  }
}

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

async function toggleSiteStatus(supabase: any, mode: boolean) {
  const { data, error } = await supabase
    .from('site_settings')
    .upsert({
      key: 'development_mode',
      value: mode ? 'true' : 'false',
      description: 'Show under development page instead of main site',
    }, { onConflict: 'key' })
    .select()
    .single()

  if (error) throw error
  return data
}

async function deleteUserRecord(supabase: any, userId: string) {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId)

  if (error) throw error
  return { success: true }
}
