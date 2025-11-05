# Complete Deployment Guide: Laravel Backend on Render & Expo React Native Distribution

This guide provides step-by-step instructions for deploying your Laravel backend to Render using Docker, connecting your Expo React Native frontend to the deployed backend, and distributing your mobile app for testing on both Android and iOS devices.

## Part 1: Deploying Laravel Backend to Render

### Step 1: Create Dockerfile

A Dockerfile has been created in the `pet-sitting-app` directory that installs PHP 8.2 with Apache, enables mod_rewrite, installs Composer, copies Laravel files, sets proper permissions for storage and bootstrap/cache folders, and starts Apache on port 80. The Dockerfile is ready to use and includes all necessary configurations for Laravel deployment.

### Step 2: Prepare Your Laravel Application

Before deploying, ensure your Laravel application is ready. Make sure your `.env` file is properly configured (though Render will use environment variables set in the dashboard). The Dockerfile will automatically install Composer dependencies and optimize the autoloader during the build process.

### Step 3: Push Code to GitHub

If you haven't already, initialize a Git repository and push your code to GitHub. Navigate to your project root directory and run the following commands:

```bash
cd /Users/jassy/Downloads/CapstoneApp
git init
git add .
git commit -m "Initial commit for Render deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your actual GitHub username and repository name. If you already have a repository, just ensure your latest code is pushed to the main branch.

### Step 4: Configure Render Dashboard

1. **Sign up/Login to Render**: Go to https://render.com and sign up or log in to your account.

2. **Create New Web Service**: Click on "New +" in the Render dashboard and select "Web Service".

3. **Connect Repository**: Connect your GitHub account if you haven't already, then select the repository containing your Laravel application.

4. **Configure Service Settings**:
   - **Name**: Enter a name for your service (e.g., "pet-sitting-backend")
   - **Environment**: Select "Docker"
   - **Region**: Select "Oregon (US West)"
   - **Branch**: Select "main" (or your default branch)
   - **Root Directory**: Enter `pet-sitting-app` (since your Laravel app is in this subdirectory)
   - **Dockerfile Path**: Leave as `Dockerfile` (or specify the full path if needed)
   - **Docker Context**: Set to `pet-sitting-app` (the directory containing your Dockerfile)

5. **Set Environment Variables**: Add the following environment variables in the Render dashboard:
   - `APP_KEY`: Generate a new application key using `php artisan key:generate` locally, or Render will generate one automatically
   - `APP_ENV`: Set to `production`
   - `APP_DEBUG`: Set to `false`
   - `APP_URL`: Set to your Render URL (e.g., `https://myapp.onrender.com` - Render will provide this after deployment)
   - `DB_CONNECTION`: Set to your database type (e.g., `mysql` or `pgsql`)
   - `DB_HOST`: Your database host (Render provides managed PostgreSQL, or use your own database)
   - `DB_PORT`: Database port (default: `5432` for PostgreSQL, `3306` for MySQL)
   - `DB_DATABASE`: Your database name
   - `DB_USERNAME`: Your database username
   - `DB_PASSWORD`: Your database password
   - `LOG_CHANNEL`: Set to `stack`
   - `LOG_LEVEL`: Set to `error`

6. **Additional Environment Variables**: If your Laravel app uses external services (SMS, payments, etc.), add those API keys and configuration values as environment variables as well.

7. **Deploy**: Click "Create Web Service" to start the deployment. Render will automatically build your Docker image and deploy your application. The first deployment may take 5-10 minutes.

8. **Access Your Application**: Once deployed, Render will provide you with a public URL like `https://myapp.onrender.com`. Your Laravel API will be accessible at `https://myapp.onrender.com/api`.

9. **Run Database Migrations**: After the first deployment, you may need to run database migrations. You can do this by:
    - Using Render's Shell feature: Click on your service → Shell → Run `php artisan migrate --force`
    - Or adding a startup command in Render: In the "Advanced" section, add a "Start Command" like `php artisan migrate --force && /usr/local/bin/start.sh`

### Step 5: Verify Deployment

Test your deployed backend by visiting the health check endpoint:
- `https://myapp.onrender.com/api/health`

You should receive a JSON response indicating the server is running. If you encounter any issues, check the Render logs in the dashboard.

## Part 2: Connecting Expo React Native Frontend to Deployed Backend

### Step 1: Update API Configuration

The frontend configuration file (`src/constants/config.ts`) has been updated to use the Render URL for production. **Important**: Replace `https://myapp.onrender.com` with your actual Render URL in two places within the file:

1. In the `getNetworkIP()` function (line 8)
2. In the `API_BASE_URL` constant (line 61)

The current configuration ensures that:
- In development mode (`__DEV__`), the app uses your local network IP (`http://192.168.100.215:8000`)
- In production builds, the app uses your Render backend URL (e.g., `https://myapp.onrender.com`)

After you receive your Render URL from the deployment, update both occurrences of `https://myapp.onrender.com` in `src/constants/config.ts` with your actual Render URL.

### Step 2: Update CORS Configuration (Optional)

If you encounter CORS issues, ensure your Laravel backend's CORS configuration (`pet-sitting-app/config/cors.php`) allows your mobile app origins. The current configuration allows all origins (`'*'`), which should work, but you can restrict it to specific origins for security.

### Step 3: Test the Connection

Build and test your app locally first to ensure it connects to the Render backend. You can test this by temporarily setting `__DEV__` to `false` or by modifying the configuration to always use the Render URL during testing.

## Part 3: Building and Distributing Your Expo App

### Step 1: Install EAS CLI

EAS (Expo Application Services) is the official tool for building and distributing Expo apps. Install it globally:

```bash
npm install -g eas-cli
```

### Step 2: Login to EAS

Authenticate with your Expo account:

```bash
eas login
```

If you don't have an Expo account, you'll be prompted to create one at https://expo.dev.

### Step 3: Configure EAS Build

Initialize EAS in your project:

```bash
cd /Users/jassy/Downloads/CapstoneApp
eas build:configure
```

This will create an `eas.json` file in your project root. You can customize the build profiles if needed, but the default configuration should work for most cases.

### Step 4: Build Android APK

Build a preview APK that can be installed directly on Android devices:

```bash
npx eas build -p android --profile preview
```

This command will:
- Upload your project to Expo's servers
- Build an APK file in the cloud
- Provide you with a download link once complete

The build process typically takes 10-20 minutes. You'll receive a notification when it's complete, and you can track progress at https://expo.dev.

### Step 5: Download and Share APK

1. **Download APK**: Once the build is complete, EAS will provide you with a download link. You can also find it in your Expo dashboard at https://expo.dev under your project's builds section.

2. **Upload to Google Drive**: 
   - Upload the APK file to your Google Drive
   - Right-click on the file and select "Get link" or "Share"
   - Change the sharing settings to "Anyone with the link can view"
   - Copy the sharing link

3. **Generate Download Link**: Convert the Google Drive link to a direct download link. You can use a service like:
   - https://www.labnol.org/embed/google/drive/ (to get direct download link)
   - Or modify the link: Replace `https://drive.google.com/file/d/FILE_ID/view?usp=sharing` with `https://drive.google.com/uc?export=download&id=FILE_ID`

4. **Create QR Code**: Use any QR code generator (e.g., https://www.qr-code-generator.com/ or https://qr-code-generator.com/) to create a QR code that links to your direct download URL. Testers can scan this QR code with their phone's camera to download the APK directly.

5. **Install on Android**: Testers need to:
   - Enable "Install from Unknown Sources" in their Android device settings
   - Scan the QR code or open the download link
   - Download and install the APK file
   - The app will install and can be opened without Expo Go

### Step 6: iOS Distribution Options

Since Apple doesn't allow direct installation of apps without TestFlight or an Apple Developer account, you have two options:

**Option A: Expo Go (Easiest for Testing)**

Publish your app to Expo's update service so iOS testers can use Expo Go:

```bash
npx expo publish
```

This will:
- Publish your app to Expo's CDN
- Generate a QR code that iOS users can scan with Expo Go
- Allow testers to open your app in the Expo Go app without needing TestFlight

To use this:
1. Testers install Expo Go from the App Store
2. Scan the QR code provided by `expo publish`
3. The app opens in Expo Go

**Option B: TestFlight (For Production Testing)**

If you have an Apple Developer account ($99/year):
1. Build an iOS app with: `npx eas build -p ios --profile preview`
2. Submit to TestFlight: `npx eas submit -p ios`
3. Invite testers through TestFlight

## Part 4: Summary for Testers

### For Android Testers:

1. **Enable Unknown Sources**: Go to Settings > Security > Enable "Install unknown apps" or "Unknown sources"
2. **Download APK**: Scan the QR code provided or open the download link
3. **Install**: Tap the downloaded APK file and follow installation prompts
4. **Open App**: Launch the app from your app drawer - no Expo Go needed
5. **Network**: Works on any network (WiFi or mobile data) - no need to be on the same network

### For iOS Testers:

**Using Expo Go (Recommended for Quick Testing):**
1. **Install Expo Go**: Download Expo Go from the App Store
2. **Scan QR Code**: Open Expo Go and scan the QR code provided
3. **Open App**: The app will load in Expo Go
4. **Network**: Works on any network - no need to be on the same network

**Using TestFlight (If Available):**
1. **Install TestFlight**: Download TestFlight from the App Store
2. **Accept Invitation**: Accept the TestFlight invitation email
3. **Install App**: Open TestFlight and install the app
4. **Open App**: Launch the app from your home screen

## Important Notes

- **Backend URL**: Ensure your frontend is configured to use the Render URL (`https://myapp.onrender.com`) in production builds
- **Environment Variables**: Keep your Render environment variables secure and never commit them to Git
- **Database**: Make sure your Render database is properly configured and migrations are run (you may need to SSH into the container or use Render's console to run `php artisan migrate`)
- **Storage**: For file uploads, consider using cloud storage (AWS S3, Cloudinary, etc.) as Render's filesystem is ephemeral
- **SSL/HTTPS**: Render automatically provides HTTPS for your application, so your API URLs should use `https://`
- **QR Code**: For the best experience, print the QR code or display it on a screen large enough for easy scanning
- **Testing**: Test the APK on a physical device before distributing to ensure everything works correctly

## Troubleshooting

- **Build Fails**: Check the EAS build logs in your Expo dashboard for specific error messages
- **APK Won't Install**: Ensure testers have enabled "Install from Unknown Sources" in Android settings
- **Backend Connection Issues**: Verify the Render URL is correct and the backend is running (check Render logs)
- **CORS Errors**: Ensure your Laravel CORS configuration allows requests from your mobile app
- **Database Connection**: Verify database credentials in Render environment variables match your actual database

This deployment setup allows your mobile app to be tested by anyone, anywhere, without requiring them to be on the same network or have Expo Go installed (for Android users).

