# APK Installation Verification Checklist

## ✅ Pre-Sharing Checklist

Before sharing with testers, verify everything works:

### 1. Verify Google Drive File is Public

- [ ] File is set to "Anyone with the link can view"
- [ ] Test the direct download link in incognito/private browser window
- [ ] Link should download automatically without asking to sign in

### 2. Test Direct Download Link

Test this URL in a browser (incognito mode):
```
https://drive.google.com/uc?export=download&id=1UX5aJJoN_crC7YVai5jVGWs4oB2XKkEr
```

**Expected Result:**
- ✅ File downloads automatically
- ✅ No sign-in required
- ✅ APK file is complete (check file size)

**If it fails:**
- ❌ Make sure file is set to "Anyone with link can view"
- ❌ Check file size is reasonable (should be several MB)

### 3. Test QR Code

- [ ] Generate QR code from direct download link
- [ ] Scan QR code with your phone camera
- [ ] Verify it opens the download link
- [ ] Test download on your Android device

### 4. Test Installation on Your Device First

**Before sharing, install it yourself:**

1. **Enable "Install from Unknown Sources":**
   - Settings → Security → Enable "Unknown sources"
   - OR Settings → Apps → Special access → Install unknown apps
   - Select your browser and enable it

2. **Download the APK:**
   - Scan QR code or open direct link
   - Download the APK file

3. **Install:**
   - Open Downloads folder
   - Tap the APK file
   - Tap "Install"
   - Wait for installation

4. **Test the App:**
   - Open the app
   - Verify it connects to backend: `https://pet-sitting-backend.onrender.com`
   - Test registration/login
   - Test key features

---

## 📱 Complete Installation Instructions for Testers

Share this with your testers:

```
📱 HOW TO INSTALL PET SITTING APP

STEP 1: ENABLE INSTALLATION FROM UNKNOWN SOURCES

Android 8.0+ (Oreo and newer):
1. Go to Settings
2. Tap "Apps" or "Applications"
3. Tap "Special access" or three dots → "Special access"
4. Tap "Install unknown apps"
5. Select your browser (Chrome, Firefox, etc.)
6. Toggle ON "Allow from this source"

Android 7.0 and older:
1. Go to Settings
2. Tap "Security"
3. Enable "Unknown sources" or "Install unknown apps"

STEP 2: DOWNLOAD THE APP

Option A - Scan QR Code:
1. Open your phone's Camera app
2. Point at the QR code
3. Tap the notification that appears
4. Tap "Download" when prompted

Option B - Use Direct Link:
1. Open this link in your browser:
   https://drive.google.com/uc?export=download&id=1UX5aJJoN_crC7YVai5jVGWs4oB2XKkEr
2. Tap "Download" when prompted
3. Wait for download to complete

STEP 3: INSTALL THE APP

1. Open your Downloads folder:
   - Open Files app
   - OR open Downloads from notification panel
   - OR open browser downloads (Chrome: chrome://downloads/)

2. Find the APK file:
   - Name: application-fbe2f968-633d-4e70-b56c-e4008a7bfca4.apk
   - OR look for file ending in .apk

3. Tap the APK file

4. If you see a warning:
   - Tap "Settings" → Enable "Install unknown apps"
   - Go back and tap the APK file again

5. Tap "Install"
   - Wait for installation (usually 10-30 seconds)

6. Tap "Open" when installation completes

STEP 4: TEST THE APP

1. Open the app from your home screen
2. The app will automatically connect to the backend
3. Try registering a new account
4. Test all features
5. Report any issues

✅ TROUBLESHOOTING:

If download doesn't start:
- Make sure you're using the direct download link
- Try a different browser
- Check your internet connection

If installation is blocked:
- Make sure "Install from Unknown Sources" is enabled
- Try enabling it for your file manager app too
- Some phones require enabling it per app (browser, file manager)

If app won't open:
- Check if installation completed successfully
- Try uninstalling and reinstalling
- Restart your phone

If app doesn't connect to backend:
- Check internet connection (WiFi or mobile data)
- Verify backend is running: https://pet-sitting-backend.onrender.com/api/health
- Try again after a few minutes

✅ IMPORTANT NOTES:

- NO Expo Go needed - this is a standalone app
- Works on ANY network - WiFi or mobile data
- Works from ANYWHERE - no same network required
- Backend is public and accessible worldwide
```

---

## 🔍 Troubleshooting Common Issues

### Issue 1: "Install blocked" or "Installation prevented"

**Solution:**
- Enable "Install from Unknown Sources" (see Step 1 above)
- Some phones require enabling it for the specific app (browser or file manager)
- Try enabling it for both your browser AND file manager

### Issue 2: "App not installed" or "Package appears to be corrupted"

**Solution:**
- Re-download the APK file (might be corrupted)
- Check file size matches the original
- Try downloading on a different network
- Clear browser cache and try again

### Issue 3: "Download failed" or "Can't download"

**Solution:**
- Verify Google Drive file is set to "Anyone with link can view"
- Check internet connection
- Try the direct download link in a different browser
- Make sure you're using the direct download link (not the view link)

### Issue 4: QR code doesn't work

**Solution:**
- Make sure QR code is clear and not too small
- Try different QR code scanner apps
- Use the direct download link as backup
- Generate a new QR code with higher resolution

### Issue 5: App installs but won't open

**Solution:**
- Check if installation actually completed
- Try uninstalling and reinstalling
- Restart your phone
- Check phone storage space

### Issue 6: App doesn't connect to backend

**Solution:**
- Verify backend is running: https://pet-sitting-backend.onrender.com/api/health
- Check internet connection
- Try on WiFi and mobile data
- Wait a few minutes and try again (free tier may need to wake up)

---

## ✅ Final Verification Steps

Before sharing with testers:

1. **Test download yourself:**
   - [ ] Open direct link in incognito browser
   - [ ] Download works without sign-in
   - [ ] File downloads completely

2. **Test installation yourself:**
   - [ ] Enable "Install from Unknown Sources"
   - [ ] Download APK on your Android device
   - [ ] Install successfully
   - [ ] App opens and runs

3. **Test app functionality:**
   - [ ] App connects to backend
   - [ ] Can register/login
   - [ ] Key features work

4. **Test QR code:**
   - [ ] QR code scans correctly
   - [ ] Opens download link
   - [ ] Download works from QR code

---

## 📋 Sharing Checklist

When sharing with testers, include:

- [ ] QR code image (high resolution, clear)
- [ ] Direct download link: `https://drive.google.com/uc?export=download&id=1UX5aJJoN_crC7YVai5jVGWs4oB2XKkEr`
- [ ] Complete installation instructions (above)
- [ ] Troubleshooting guide (above)
- [ ] Backend status: `https://pet-sitting-backend.onrender.com/api/health`

---

## 🎯 Quick Test Commands

Test your backend is accessible:
```bash
curl https://pet-sitting-backend.onrender.com/api/health
```

Should return:
```json
{"status":"ok","message":"Server is running","timestamp":"..."}
```

---

## ✅ Your APK Details

- **File Name**: `application-fbe2f968-633d-4e70-b56c-e4008a7bfca4.apk`
- **Direct Download**: `https://drive.google.com/uc?export=download&id=1UX5aJJoN_crC7YVai5jVGWs4oB2XKkEr`
- **Backend URL**: `https://pet-sitting-backend.onrender.com`
- **Works On**: Any Android device, any network, anywhere!

---

## 🚀 Ready to Share!

If all checks pass:
- ✅ QR code generated
- ✅ Direct link tested
- ✅ Installation tested on your device
- ✅ App works correctly

Then you're ready to share with testers! 🎉

Good luck! 🚀

