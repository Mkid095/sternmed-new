# Supabase Edge Functions

This directory contains Edge Functions for server-side operations.

## Create Email User

Creates a Firebase user and Supabase user record without signing out the admin.

### Environment Variables Required

Set these in your Supabase project's Edge Function secrets:

```bash
# In Supabase Dashboard → Edge Functions → create-email-user → Settings
FIREBASE_API_KEY=AIzaSyBHep_bVVn18b8DZniNK5x4XBh_LREjw5k
```

### Deploying

```bash
# Using Supabase CLI
supabase functions deploy create-email-user

# Or use the dashboard
# Supabase Dashboard → Edge Functions → Deploy
```

### API Endpoint

```
POST https://ckndtgbhzcfepxafrmrw.supabase.co/functions/v1/create-email-user
Authorization: Bearer {supabase_anon_key}
Content-Type: application/json

{
  "email": "user@sternmedafrika.com",
  "password": "temporaryPassword123",
  "displayName": "John Doe",
  "aliasId": "uuid-of-alias"
}
```

### Response

```json
{
  "success": true,
  "data": {
    "email": "user@sternmedafrika.com",
    "password": "temporaryPassword123",
    "name": "John Doe",
    "userId": "supabase-user-id",
    "firebaseUid": "firebase-user-id"
  }
}
```

### Error Handling

- `400` - Missing required fields or invalid input
- `500` - Internal server error (check Edge Function logs)
