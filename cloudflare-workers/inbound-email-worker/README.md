# Inbound Email Worker

Cloudflare Worker for processing inbound emails from Cloudflare Email Routing.

## Environment Variables

Set these as secrets in your Cloudflare Worker:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_STORAGE_URL=https://your-project.supabase.co/storage/v1

# Email Configuration
ALLOWED_DOMAINS=sternmed.com,another-domain.com

# Limits (in bytes)
MAX_ATTACHMENT_SIZE=10485760  # 10MB
MAX_EMAIL_SIZE=26214400       # 25MB

# Timeout (in milliseconds)
WORKER_TIMEOUT=25000           # 25 seconds
```

## Deployment

1. Install Wrangler CLI:
```bash
npm install -g wrangler
```

2. Login to Cloudflare:
```bash
wrangler login
```

3. Deploy the worker:
```bash
wrangler deploy
```

## How It Works

1. **Email Reception**: Cloudflare Email Routing forwards emails to this worker
2. **Domain Validation**: Only processes emails for configured domains
3. **Security Checks**: SPF/DKIM validation, duplicate detection
4. **Threading**: Groups emails into conversations using References/In-Reply-To headers
5. **Storage**: Stores emails in Supabase (assigned or unassigned)

## Email Flow

```
Internet Email
    ↓
Cloudflare Email Routing
    ↓
This Worker
    ↓
┌─────────────┬────────────────────────────┐
│ Alias Found │ Alias Not Found            │
│             │                            │
└──────┬──────┴────────────┬───────────────┘
       │                   │
       ↓                   ↓
email_inbound      email_inbound_unassigned
       │                   │
       └─────────┬─────────┘
                 ↓
         Supabase (with RLS)
                 ↓
         Frontend (user sees only their alias)
```

## Security Features

- **Service Role Authentication**: Uses Supabase service role key for database access
- **Domain Whitelist**: Only processes configured domains
- **SPF/DKIM Validation**: Validates email authentication
- **Duplicate Prevention**: Checks for existing emails by Message-ID
- **Timeout Protection**: Prevents hanging on large emails
- **Size Limits**: Enforces attachment and email size limits
