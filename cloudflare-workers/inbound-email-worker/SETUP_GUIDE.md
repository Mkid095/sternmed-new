# Email System Setup Guide

This guide walks you through setting up Cloudflare Email Routing for sternmedafrika.com.

**IMPORTANT:** As of 2025, Cloudflare Email Routing configuration is done through the **Dashboard UI**, NOT through wrangler.toml. The `[[email_rules]]` configuration in wrangler.toml is deprecated.

## Prerequisites

✅ Cloudflare account with sternmedafrika.com domain added
✅ Supabase project with email system tables created
✅ Wrangler CLI installed and authenticated (sternmedafrika1@gmail.com)

---

## Step 1: Deploy the Worker (First!)

**Deploy BEFORE configuring Email Routing.** The worker must exist before you can link it.

```bash
cd cloudflare-workers/inbound-email-worker

# Deploy the worker
npx wrangler deploy
```

After deployment, you'll see output like:
```
✨ Success! Uploaded <worker-name>
Published inbound-email-worker (X.X sec)
  https://inbound-email-worker.sternmedafrika1.workers.dev
```

---

## Step 2: Set Worker Environment Secrets

Run these commands to configure the worker with Supabase credentials:

```bash
cd cloudflare-workers/inbound-email-worker

# Supabase Configuration
npx wrangler secret put SUPABASE_URL
# Enter: https://ckndtgbhzcfepxafrmrw.supabase.co

npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
# Get from: Supabase Dashboard → Project Settings → API
# This is the SERVICE_ROLE key (not anon key)

npx wrangler secret put SUPABASE_STORAGE_URL
# Enter: https://ckndtgbhzcfepxafrmrw.supabase.co/storage/v1

# Email Configuration
npx wrangler secret put ALLOWED_DOMAINS
# Enter: sternmedafrika.com

npx wrangler secret put MAX_ATTACHMENT_SIZE
# Enter: 10485760  (10MB in bytes)

npx wrangler secret put MAX_EMAIL_SIZE
# Enter: 26214400  (25MB in bytes)

npx wrangler secret put WORKER_TIMEOUT
# Enter: 25000  (25 seconds in ms)
```

**Verify secrets are set:**
```bash
npx wrangler secret list
```

---

## Step 3: Enable Email Routing in Cloudflare Dashboard

1. **Go to Cloudflare Dashboard**
   - Visit https://dash.cloudflare.com
   - Select **sternmedafrika.com** domain

2. **Navigate to Email Routing**
   - Go to **Mail** → **Email Routing**
   - Click **"Get started"** or **"Enable Email Routing"**

3. **Add DNS Records (if prompted)**
   - Cloudflare will automatically add MX records:
     ```
     Type: MX  Priority: 10  Content: mx1.cloudflare.net
     Type: MX  Priority: 20  Content: mx2.cloudflare.net
     Type: MX  Priority: 30  Content: mx3.cloudflare.net
     ```
   - Click **"Add records"** or **"Auto-add records"**

4. **Verify Email Routing is Enabled**
   - Status should show: **"Email Routing is enabled"**
   - You'll see **"Routing rules"** and **"Destination addresses"** tabs

---

## Step 4: Create Email Routing Rule (NEW Way)

**The NEW way uses the Dashboard UI, NOT wrangler.toml.**

1. **Go to Routing Rules Tab**
   - In **Mail** → **Email Routing** → **Routing rules**
   - Click **"Create rule"** or **"Add custom address"**

2. **Configure the Routing Rule**
   - **Rule name**: Sternmed Email Worker
   - **Match**: Select **"Custom address"**
   - **Address**: `*@sternmedafrika.com` (catch-all for all emails)
   - **Action**: Select **"Send to Worker"** or **"Worker"**
   - **Worker**: Select `inbound-email-worker` from dropdown

3. **Save the Rule**
   - Click **"Save"** or **"Create"**
   - Verify the rule appears in the list with **Status: Active**

**Note:** If you don't see your worker in the dropdown:
- Go back to Step 1 and ensure the worker deployed successfully
- Check the worker name matches: `inbound-email-worker`
- Wait 1-2 minutes for Cloudflare to sync worker availability

---

## Step 5: Configure SPF/DKIM Records (Recommended)

Go to **DNS** → **Records** and add:

```
Type: TXT   Name: @         Content: "v=spf1 include:_spf.mx.cloudflare.net ~all"   TTL: Auto
```

For DKIM (optional but recommended for deliverability):
1. Go to **Mail** → **Email Routing** → **Settings**
2. Follow the DKIM setup wizard
3. Add the generated CNAME records to DNS

---

## Step 6: Test the Setup

1. **Send a test email** to `test@sternmedafrika.com` from any external email

2. **Monitor worker logs in real-time**:
   ```bash
   cd cloudflare-workers/inbound-email-worker
   npx wrangler tail
   ```
   You should see logs like:
   ```
   Email processed successfully
   ```

3. **Check Supabase**
   - Go to Supabase Dashboard → Table Editor
   - Open `email_inbound_unassigned` table
   - The test email should appear here (since no alias exists yet)

---

## Step 7: Create First Email Alias

1. Go to your app: **http://localhost:5173/admin/email-aliases**
2. Click **"Create Your First Alias"**
3. Fill in:
   - **Alias Email**: `kennedy` (will become kennedy@sternmedafrika.com)
   - **Display Name**: Kennedy Omondi
   - **Recipient Email**: kennedy.personal@gmail.com
4. Click **"Create Alias"**
5. The system will create a Firebase user and send credentials

**Test again:** Send an email to `kennedy@sternmedafrika.com` and verify it appears in the email platform inbox.

---

## Architecture Overview

```
Incoming Email
       ↓
Cloudflare Email Routing (sternmedafrika.com)
       ↓
Rule: *@sternmedafrika.com → Worker
       ↓
inbound-email-worker (Process email)
       ↓
┌──────────────────┬─────────────────────────┐
│   Alias Found    │   Alias Not Found       │
│                  │                         │
└────────┬─────────┴──────────┬──────────────┘
         │                    │
         ↓                    ↓
email_inbound       email_inbound_unassigned
(For assigned)      (For unassigned)
         │                    │
         └────────┬───────────┘
                  ↓
          Supabase (with RLS)
                  ↓
          Email Platform UI
```

---

## Troubleshooting

### Email not arriving?

**Check Cloudflare Email Logs:**
1. Go to **Mail** → **Email Routing** → **Logs**
2. Look for the email - it shows delivery status

**Check Worker Logs:**
```bash
npx wrangler tail --format pretty
```

**Verify MX Records:**
1. Go to **DNS** → **Records**
2. Ensure these exist:
   - `mx1.cloudflare.net` (Priority 10)
   - `mx2.cloudflare.net` (Priority 20)
   - `mx3.cloudflare.net` (Priority 30)

### Worker errors?

**Check secrets:**
```bash
npx wrangler secret list
```
All 7 secrets should be listed.

**Verify Supabase credentials:**
- Ensure SERVICE_ROLE key is used (not anon key)
- Check Supabase project URL is correct

**Check RLS policies:**
- Ensure `email_inbound` and `email_inbound_unassigned` have RLS enabled
- The worker uses service role key, which bypasses RLS

### Worker not appearing in Email Routing dropdown?

1. Verify worker deployed successfully:
   ```bash
   npx wrangler deployments list
   ```

2. Check worker name in `wrangler.toml`:
   ```toml
   name = "inbound-email-worker"
   ```

3. Wait 1-2 minutes for Cloudflare to sync

4. Try refreshing the Email Routing page

### "Domain not configured for Email Routing" error?

1. Go to **Mail** → **Email Routing**
2. Click **"Get started"** if not enabled
3. Verify MX records exist in DNS

### Authentication issues?

- Ensure Firebase user was created with `email_user` role
- Check user has `email_alias_id` set in Supabase
- Verify auth store includes emailAliasId
- Check the email user login flow

---

## Quick Reference

| Item | Value |
|------|-------|
| **Email Domain** | @sternmedafrika.com |
| **Cloudflare Account** | sternmedafrika1@gmail.com |
| **Supabase Project** | sternmed-new (ckndtgbhzcfepxafrmrw) |
| **Worker Name** | inbound-email-worker |
| **Worker URL** | https://inbound-email-worker.sternmedafrika1.workers.dev |
| **Configuration Method** | Dashboard UI (NOT wrangler.toml) |

---

## Next Steps

1. **Create more email aliases** for team members
2. **Create email templates** for common communications
3. **Set up Resend** for outbound email delivery
4. **Configure DKIM** for better email deliverability
5. **Monitor email logs** in Supabase for debugging

---

## Security Notes

- **Never expose SERVICE_ROLE_KEY** - it's only in worker secrets
- **Worker has server-side access** to Supabase via service role
- **RLS protects user data** - email users see only their alias emails
- **SPF/DKIM validation** happens in worker for inbound emails
- **Rate limiting** prevents abuse via email_alias_limits table

---

## Worker Code Reference

The worker implements the **email handler** (not fetch):

```typescript
export default {
  async email(message: ForwardableEmailMessage, env: Env): Promise<void> {
    // Process incoming email
    // Store in Supabase
  },
};
```

This is the correct interface for Cloudflare Email Routing Workers.
