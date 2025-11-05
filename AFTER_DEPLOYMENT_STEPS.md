# After Render Deployment - Next Steps

## Your Render Service Details:
- **Service Name**: pet-sitting-backend
- **URL**: https://pet-sitting-backend.onrender.com
- **Status**: Currently Building ⏳

---

## Step 1: Wait for Build to Complete ⏳

The build typically takes **5-10 minutes**. You'll see:
- "Building" → "Live" when complete
- Watch the logs to see progress

---

## Step 2: After Build Completes - Update APP_URL

Once your service is "Live", update the `APP_URL` environment variable:

1. Go to your Render service dashboard
2. Click on **"Environment"** tab
3. Find `APP_URL` variable
4. Update it to: `https://pet-sitting-backend.onrender.com`
5. Click **"Save Changes"**
6. Render will automatically redeploy (this is quick)

**OR** if you haven't added APP_URL yet:
1. Click **"Add Environment Variable"**
2. Variable Name: `APP_URL`
3. Variable Value: `https://pet-sitting-backend.onrender.com`
4. Click **"Save Changes"**

---

## Step 3: Run Database Migrations

After the build is complete, you need to run migrations:

1. In Render dashboard, go to your service
2. Click on **"Shell"** tab (or look for "Shell" button)
3. Once the shell opens, run:
   ```bash
   php artisan migrate --force
   ```
4. Wait for migrations to complete
5. You should see "Migration completed successfully"

**Note**: If "Shell" is not available on free tier, you can:
- Upgrade to a paid plan (has Shell access)
- OR use Render's "Manual Deploy" feature with a custom command

---

## Step 4: Update Frontend Configuration

Update your React Native app to use the Render URL:

1. Open: `src/constants/config.ts`
2. Find line 8: `return 'https://myapp.onrender.com';`
3. Replace with: `return 'https://pet-sitting-backend.onrender.com';`
4. Find line 61: `'https://myapp.onrender.com'`
5. Replace with: `'https://pet-sitting-backend.onrender.com'`
6. Save the file

---

## Step 5: Test Your Deployment

Test if your backend is working:

1. **Health Check**: Visit https://pet-sitting-backend.onrender.com/api/health
   - Should return: `{"status":"ok","message":"Server is running","timestamp":"..."}`

2. **Test Endpoint**: Visit https://pet-sitting-backend.onrender.com/api/test
   - Should return: `{"message":"API is working!","timestamp":"..."}`

3. **Check Logs**: In Render dashboard → "Logs" tab
   - Look for any errors
   - Should see Apache starting successfully

---

## Step 6: Update Webhook URLs (If Using)

If you're using Xendit, Veriff, or other services with webhooks:

1. **Xendit Webhook**: 
   - URL: `https://pet-sitting-backend.onrender.com/api/webhooks/xendit/payment`
   - Update in Xendit dashboard

2. **Veriff Webhook**:
   - URL: `https://pet-sitting-backend.onrender.com/api/verification/veriff-webhook`
   - Update in Veriff dashboard

---

## Troubleshooting

### Build Fails
- Check the "Logs" tab in Render
- Look for error messages
- Common issues:
  - Missing environment variables
  - Database connection failed
  - Dockerfile errors

### Database Connection Errors
- Verify all database environment variables are correct
- Check that database is in the same region (Oregon)
- Ensure database is not paused

### Service Not Responding
- Free tier services spin down after 15 minutes of inactivity
- First request after spin-down takes ~50 seconds
- This is normal for free tier
- Upgrade to paid plan for always-on service

### API Not Working
- Check CORS configuration in `config/cors.php`
- Verify `APP_URL` is set correctly
- Check logs for specific error messages

---

## Next Steps After Deployment

1. ✅ Update APP_URL environment variable
2. ✅ Run database migrations
3. ✅ Update frontend config.ts
4. ✅ Test API endpoints
5. ✅ Update webhook URLs (if needed)
6. ✅ Build and distribute your mobile app (see DEPLOYMENT_GUIDE.md)

---

## Your Render URL:
**https://pet-sitting-backend.onrender.com**

**API Base URL**: `https://pet-sitting-backend.onrender.com/api`

---

## Quick Reference

- **Service Dashboard**: https://dashboard.render.com
- **Health Check**: https://pet-sitting-backend.onrender.com/api/health
- **Test Endpoint**: https://pet-sitting-backend.onrender.com/api/test
- **Logs**: Render Dashboard → Your Service → Logs tab

