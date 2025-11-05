# Render Dashboard Setup - Exact Values to Fill In

## Basic Service Configuration

### Name
```
pet-sitting-backend
```
*(Or any name you prefer for your service)*

### Project
```
Leave empty or create a new project
```
*(Optional - you can skip this for now)*

### Language
```
Docker
```
*(Select "Docker" from the dropdown)*

### Branch
```
main
```
*(Select "main" - this should already be selected)*

### Region
```
Oregon (US West)
```
*(Select "Oregon (US West)" - you already have 1 service there)*

### Root Directory
```
pet-sitting-app
```
*(This is the subdirectory where your Laravel app and Dockerfile are located)*

### Instance Type
```
Free
```
*(Start with Free for testing, you can upgrade later if needed)*

---

## Environment Variables

Click "Add Environment Variable" for each of these:

### Required Laravel Variables

**APP_KEY**
```
(Leave empty - Render will generate this automatically, OR generate one locally with: php artisan key:generate)
```
*Note: If you want to generate it yourself, run `php artisan key:generate` locally and copy the key*

**APP_ENV**
```
production
```

**APP_DEBUG**
```
false
```

**APP_URL**
```
(Leave empty for now - Render will provide your URL after deployment, then update this)
```
*After deployment, you'll get a URL like `https://pet-sitting-backend.onrender.com` - come back and update this variable*

**APP_NAME**
```
PetsitConnect
```
*(Or your app name)*

### Database Variables

**If using Render's Managed PostgreSQL (Recommended):**
1. First, create a PostgreSQL database in Render (New → PostgreSQL)
2. Then use these values from your database's "Connections" tab:

**DB_CONNECTION**
```
pgsql
```

**DB_HOST**
```
(dns_hostname from Render database)
```
*Example: `dpg-xxxxx-a.oregon-postgres.render.com`*

**DB_PORT**
```
5432
```

**DB_DATABASE**
```
(database_name from Render database)
```
*Example: `petsitconnect_xxxx`*

**DB_USERNAME**
```
(database_user from Render database)
```
*Example: `petsitconnect_user`*

**DB_PASSWORD**
```
(database_password from Render database)
```
*Copy the password from Render database dashboard*

**If using your own database (MySQL/PostgreSQL):**
Fill in the values according to your database provider.

### Logging Variables

**LOG_CHANNEL**
```
stack
```

**LOG_LEVEL**
```
error
```

### Session & Cache Variables

**SESSION_DRIVER**
```
file
```

**CACHE_DRIVER**
```
file
```

**QUEUE_CONNECTION**
```
sync
```

### CORS Configuration (if needed)

**CORS_ALLOWED_ORIGINS**
```
*
```
*(This allows all origins - you can restrict later for security)*

---

## Service-Specific API Keys

### Semaphore SMS (if you're using SMS)

**SEMAPHORE_API_KEY**
```
(your_semaphore_api_key)
```
*Your actual Semaphore API key from semaphore.co*

**SEMAPHORE_BASE_URL**
```
https://api.semaphore.co/api/v4
```

**SEMAPHORE_SENDER_NAME**
```
PetsitConnect
```

**SEMAPHORE_ENABLED**
```
true
```

**SMS_SIMULATION_MODE**
```
false
```

### Xendit Payment Integration (if you're using payments)

**XENDIT_SECRET_KEY**
```
(your_xendit_secret_key)
```
*Your Xendit secret key from xendit.co*

**XENDIT_WEBHOOK_TOKEN**
```
(your_webhook_token)
```
*Your Xendit webhook verification token*

### Veriff ID Verification (if you're using ID verification)

**VERIFF_API_KEY**
```
(your_veriff_api_key)
```
*Your Veriff API key*

**VERIFF_API_SECRET**
```
(your_veriff_api_secret)
```
*Your Veriff API secret*

### Stripe (if you're using Stripe)

**STRIPE_KEY**
```
(your_stripe_publishable_key)
```

**STRIPE_SECRET**
```
(your_stripe_secret_key)
```

**STRIPE_WEBHOOK_SECRET**
```
(your_stripe_webhook_secret)
```

---

## Quick Setup Checklist

1. ✅ **Name**: `pet-sitting-backend`
2. ✅ **Language**: `Docker`
3. ✅ **Branch**: `main`
4. ✅ **Region**: `Oregon (US West)`
5. ✅ **Root Directory**: `pet-sitting-app`
6. ✅ **Instance Type**: `Free` (for testing)
7. ✅ **Environment Variables**: Add all required variables above
8. ✅ **Click "Create Web Service"**

---

## After Deployment

Once your service is deployed:

1. **Get your Render URL** (e.g., `https://pet-sitting-backend.onrender.com`)
2. **Update APP_URL** environment variable with your actual Render URL
3. **Update your frontend** `src/constants/config.ts` with the Render URL
4. **Run migrations** using Render Shell: `php artisan migrate --force`
5. **Test the API**: Visit `https://your-app.onrender.com/api/health`

---

## Important Notes

- **Free tier limitations**: Free instances spin down after 15 minutes of inactivity. First request after spin-down takes longer.
- **Database**: Create a PostgreSQL database in Render first, then use its connection details
- **Storage**: Render's filesystem is ephemeral. For file uploads, consider using cloud storage (AWS S3, Cloudinary, etc.)
- **Webhooks**: Update webhook URLs in your payment/verification services to point to your Render URL
- **Environment Variables**: Never commit sensitive keys to Git. Always use environment variables in Render.

---

## Example Webhook URLs (Update in your service dashboards)

After deployment, update these webhook URLs in your service dashboards:

- **Xendit Webhook**: `https://your-app.onrender.com/api/webhooks/xendit/payment`
- **Veriff Webhook**: `https://your-app.onrender.com/api/verification/veriff-webhook`

