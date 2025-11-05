# Step-by-Step: Build Android APK & Create QR Code for Testers

Since your backend is now on Render (https://pet-sitting-backend.onrender.com), testers can use the app from **any network** - WiFi, mobile data, anywhere in the world!

---

## Step 1: Install EAS CLI

Open your terminal and run:

```bash
npm install -g eas-cli
```

Wait for installation to complete.

---

## Step 2: Login to Expo

```bash
eas login
```

- If you don't have an Expo account, you'll be prompted to create one at https://expo.dev
- Enter your email and password when prompted

---

## Step 3: Configure EAS Build

Navigate to your project and configure EAS:

```bash
cd /Users/jassy/Downloads/CapstoneApp
eas build:configure
```

This will:
- Create an `eas.json` file in your project
- Ask you a few questions (just press Enter for defaults)
- Set up build profiles

---

## Step 4: Build Android APK

Build the APK for Android:

```bash
npx eas build -p android --profile preview
```

**What happens:**
- Your project will be uploaded to Expo's servers
- Build will take **10-20 minutes**
- You'll see progress in the terminal
- You'll get a download link when complete

**Important:** 
- You can close the terminal - the build continues on Expo's servers
- Check progress at: https://expo.dev → Your project → Builds

---

## Step 5: Download the APK

Once build completes:

1. **Get the download link:**
   - Check your terminal for the download link
   - OR go to https://expo.dev → Your project → Builds
   - Click on the completed Android build
   - Click "Download" button

2. **Download the APK file:**
   - The file will be named something like: `CapstoneApp-1.0.0-preview.apk`
   - Save it to your computer (Downloads folder is fine)

---

## Step 6: Upload APK to Google Drive

1. **Go to Google Drive:**
   - Visit https://drive.google.com
   - Sign in with your Google account

2. **Upload the APK:**
   - Click "New" button (top left)
   - Select "File upload"
   - Choose your downloaded APK file
   - Wait for upload to complete

3. **Make it Public:**
   - Right-click on the uploaded APK file
   - Click "Share" or "Get link"
   - Change sharing settings to: **"Anyone with the link can view"**
   - Click "Copy link"
   - You'll get a link like: `https://drive.google.com/file/d/1ABC123xyz456/view?usp=sharing`

---

## Step 7: Convert Google Drive Link to Direct Download

Google Drive links don't work directly for downloads. Convert it:

**From this:**
```
https://drive.google.com/file/d/1ABC123xyz456/view?usp=sharing
```

**To this:**
```
https://drive.google.com/uc?export=download&id=1ABC123xyz456
```

**How to find the File ID:**
- The File ID is the part between `/d/` and `/view`
- Example: `1ABC123xyz456` is the File ID

**Quick conversion:**
1. Copy your Google Drive link
2. Find the File ID (between `/d/` and `/view`)
3. Create: `https://drive.google.com/uc?export=download&id=FILE_ID`
4. Replace `FILE_ID` with your actual File ID

---

## Step 8: Generate QR Code

Now create a QR code that links to your download:

### Option 1: QR Code Generator (Recommended)

1. Go to: **https://www.qr-code-generator.com/**
2. Select **"URL"** tab
3. Paste your **direct download link** (the converted one from Step 7)
4. Click **"Generate QR Code"**
5. Click **"Download"** to save the QR code image (PNG format)

### Option 2: Quick API Method

Use this URL (replace `YOUR_DOWNLOAD_LINK` with your direct download link):

```
https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=YOUR_DOWNLOAD_LINK
```

**Example:**
```
https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://drive.google.com/uc?export=download&id=1ABC123xyz456
```

Just open this URL in your browser and right-click → Save image!

---

## Step 9: Share with Testers

### For Android Testers:

1. **Send them the QR code** (via email, WhatsApp, etc.)
2. **Instructions for testers:**
   - Enable "Install from Unknown Sources" in Android Settings
   - Settings → Security → Enable "Unknown sources" or "Install unknown apps"
   - Scan the QR code with phone camera
   - Download and install the APK
   - Open the app - it will connect to your Render backend automatically!

### Instructions to Include:

Create a simple text file with these instructions:

```
📱 How to Install the App:

1. Enable "Install from Unknown Sources":
   - Go to Settings → Security
   - Enable "Install unknown apps" or "Unknown sources"
   
2. Scan the QR Code:
   - Open your phone's camera app
   - Point at the QR code
   - Tap the notification to open the download link

3. Install:
   - Tap the downloaded APK file
   - Tap "Install"
   - Wait for installation to complete

4. Open the App:
   - The app will automatically connect to the backend
   - Works on WiFi or mobile data
   - No Expo Go needed!

5. Test the App:
   - Try registering a new account
   - Test all features
   - Report any issues
```

---

## Complete Example Workflow

**1. Build APK:**
```bash
npx eas build -p android --profile preview
```

**2. Download APK** from Expo dashboard

**3. Upload to Google Drive** → Get sharing link

**4. Convert link:**
```
Original: https://drive.google.com/file/d/1ABC123xyz456/view?usp=sharing
Direct:   https://drive.google.com/uc?export=download&id=1ABC123xyz456
```

**5. Generate QR code:**
- Visit: https://www.qr-code-generator.com/
- Paste direct download link
- Download QR code image

**6. Share QR code + instructions with testers**

---

## Testing Checklist

Before sharing with testers:

- [ ] Test the QR code yourself (scan with your phone)
- [ ] Verify APK downloads correctly
- [ ] Install APK on a test device
- [ ] Verify app connects to Render backend
- [ ] Test registration/login flow
- [ ] Test key features

---

## Troubleshooting

### Build Fails
- Check EAS build logs: https://expo.dev → Builds
- Look for specific error messages
- Common issues: Missing environment variables, build configuration

### QR Code Doesn't Work
- Verify the download link works in a browser
- Make sure Google Drive file is set to "Anyone with link can view"
- Try generating QR code again

### Testers Can't Install
- Ensure "Install from Unknown Sources" is enabled
- Check Android version compatibility
- Verify APK file isn't corrupted

### App Doesn't Connect to Backend
- Verify backend is running: https://pet-sitting-backend.onrender.com/api/health
- Check frontend config.ts has correct Render URL
- Ensure testers have internet connection (WiFi or mobile data)

---

## Important Notes

✅ **Backend is Public**: Your Render backend is accessible from anywhere, so testers can use the app on any network

✅ **No Network Restrictions**: Testers don't need to be on the same WiFi - works on mobile data too

✅ **No Expo Go Needed**: The APK is a standalone app - installs directly on Android

✅ **Automatic Updates**: If you rebuild and share a new APK, testers need to download and install the new version

---

## Your Backend URL (Already Configured)

Your frontend is already configured to use:
- **Production**: `https://pet-sitting-backend.onrender.com`
- **Development**: `http://192.168.100.215:8000`

The built APK will automatically use the Render URL, so testers can access it from anywhere!

---

## Quick Reference

- **EAS Build Dashboard**: https://expo.dev
- **QR Code Generator**: https://www.qr-code-generator.com/
- **Google Drive**: https://drive.google.com
- **Your Backend**: https://pet-sitting-backend.onrender.com

Good luck! 🚀

