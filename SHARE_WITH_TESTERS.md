# How to Share APK with Testers

## Step 1: Download the APK ✅

You've already seen the build page. Now:

1. **Click "Install" or download the APK file**
2. **Save it to your computer** (Downloads folder is fine)
3. The file will be named something like: `CapstoneApp-1.0.0-preview.apk`

---

## Step 2: Upload to Google Drive

### Why Google Drive?
- ✅ Better control over sharing
- ✅ Can generate custom QR code
- ✅ Permanent download link
- ✅ Works on any network (testers don't need Expo account)

### Steps:

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

## Step 3: Convert Google Drive Link to Direct Download

Google Drive links don't work directly for downloads. You need to convert them:

### Your Google Drive link:
```
https://drive.google.com/file/d/FILE_ID/view?usp=sharing
```

### Convert to direct download:
```
https://drive.google.com/uc?export=download&id=FILE_ID
```

**How to find FILE_ID:**
- The FILE_ID is the part between `/d/` and `/view`
- Example: If your link is `https://drive.google.com/file/d/1ABC123xyz456/view?usp=sharing`
- The FILE_ID is: `1ABC123xyz456`
- Direct download link: `https://drive.google.com/uc?export=download&id=1ABC123xyz456`

---

## Step 4: Generate QR Code

### Method 1: QR Code Generator Website (Recommended)

1. **Go to:** https://www.qr-code-generator.com/
2. **Select:** "URL" tab
3. **Paste:** Your direct download link (from Step 3)
4. **Click:** "Generate QR Code"
5. **Download:** Click "Download" to save the QR code image (PNG)

### Method 2: Quick API Method

Use this URL (replace `YOUR_LINK` with your direct download link):

```
https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=YOUR_DIRECT_DOWNLOAD_LINK
```

**Example:**
```
https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://drive.google.com/uc?export=download&id=1ABC123xyz456
```

Just open this URL in your browser and right-click → Save image!

### Method 3: QR Code Monkey

1. **Go to:** https://www.qrcode-monkey.com/
2. **Paste** your direct download link
3. **Customize** (optional): Add colors, logo, etc.
4. **Download** the QR code

---

## Step 5: Share with Testers

### What to Send Testers:

1. **QR Code Image** (so they can scan it)
2. **Direct Download Link** (as backup)
3. **Installation Instructions** (below)

### Installation Instructions for Testers:

Copy and send this to your testers:

```
📱 How to Install Pet Sitting App:

1. ENABLE "INSTALL FROM UNKNOWN SOURCES":
   - Go to Settings → Security (or Apps → Special access)
   - Enable "Install unknown apps" or "Unknown sources"
   - Select your browser/file manager and enable it

2. DOWNLOAD THE APP:
   Option A: Scan the QR code with your phone camera
   Option B: Open this link: [YOUR_DIRECT_DOWNLOAD_LINK]
   - Click "Download" when prompted
   - Wait for download to complete

3. INSTALL:
   - Open your Downloads folder
   - Tap the APK file (ends with .apk)
   - Tap "Install"
   - Wait for installation

4. OPEN THE APP:
   - Tap the app icon on your home screen
   - The app connects to the backend automatically
   - Works on WiFi or mobile data!

5. TEST:
   - Try registering a new account
   - Test all features
   - Report any issues

✅ NO EXPO GO NEEDED - Standalone app!
✅ WORKS ON ANY NETWORK - WiFi or mobile data
✅ CONNECTS TO BACKEND AUTOMATICALLY
```

---

## Quick Summary

1. ✅ **Download APK** from Expo (you're here)
2. ✅ **Upload to Google Drive** → Make public
3. ✅ **Convert to direct download link**
4. ✅ **Generate QR code** from the direct link
5. ✅ **Share QR code + instructions** with testers

---

## Alternative: Use Expo Link Directly

If you want to skip Google Drive, you can share the Expo link directly:

```
https://expo.dev/accounts/juz3hh/projects/CapstoneApp/builds/fbe2f968-633d-4e70-b56c-e4008a7bfca4
```

Testers can:
- Scan the QR code from terminal
- Or open the link and download

**Note:** This requires testers to have an Expo account or be comfortable with the Expo interface.

---

## Test First!

Before sharing with testers:

1. **Download the APK yourself**
2. **Install on your Android device**
3. **Test the app:**
   - Verify it connects to Render backend
   - Test registration/login
   - Test key features
4. **Then share with testers**

---

## Your Backend Info

Your app automatically connects to:
- **Backend URL**: `https://pet-sitting-backend.onrender.com`
- **Works on any network** (WiFi or mobile data)
- **No network restrictions** - testers can be anywhere!

Good luck! 🚀

