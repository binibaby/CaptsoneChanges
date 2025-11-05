# How to Generate QR Code for Android APK Download

## Complete Process: From Build to QR Code

### Step 1: Build Your Android APK

First, you need to build the APK using EAS Build:

```bash
# Install EAS CLI (if not already installed)
npm install -g eas-cli

# Login to EAS
eas login

# Configure EAS (if not done already)
eas build:configure

# Build Android APK
npx eas build -p android --profile preview
```

Wait 10-20 minutes for the build to complete. You'll get a download link from EAS.

---

### Step 2: Upload APK to Google Drive

1. **Download the APK** from EAS (you'll get a link in the terminal or at https://expo.dev)
2. **Upload to Google Drive**:
   - Go to https://drive.google.com
   - Click "New" → "File upload"
   - Select your APK file (e.g., `CapstoneApp.apk`)
   - Wait for upload to complete

3. **Make it Publicly Accessible**:
   - Right-click on the uploaded APK file
   - Select "Share" or "Get link"
   - Change sharing to "Anyone with the link can view"
   - Click "Copy link"
   - You'll get a link like: `https://drive.google.com/file/d/1ABC123xyz456/view?usp=sharing`

---

### Step 3: Convert Google Drive Link to Direct Download

Google Drive links don't work directly for downloads. You need to convert them:

#### Method 1: Manual Conversion (Easiest)

Take your Google Drive link:
```
https://drive.google.com/file/d/1ABC123xyz456/view?usp=sharing
```

Extract the FILE_ID (the part between `/d/` and `/view`):
- FILE_ID = `1ABC123xyz456`

Create a direct download link:
```
https://drive.google.com/uc?export=download&id=1ABC123xyz456
```

**Example:**
- Original: `https://drive.google.com/file/d/1ABC123xyz456/view?usp=sharing`
- Direct Download: `https://drive.google.com/uc?export=download&id=1ABC123xyz456`

#### Method 2: Use Online Tool

Visit: https://www.labnol.org/embed/google/drive/
- Paste your Google Drive sharing link
- It will generate a direct download link

#### Method 3: Use Alternative Hosting (Recommended)

Instead of Google Drive, you can use:
- **GitHub Releases**: Upload APK as a release asset
- **Dropbox**: Similar to Google Drive but easier direct links
- **File.io**: Temporary file hosting with direct download
- **WeTransfer**: Free file transfer with direct download links

---

### Step 4: Generate QR Code

Once you have your direct download link, generate a QR code using one of these websites:

#### Option 1: QR Code Generator (Recommended)
**Website**: https://www.qr-code-generator.com/

Steps:
1. Go to https://www.qr-code-generator.com/
2. Select "URL" tab
3. Paste your direct download link
4. Click "Generate QR Code"
5. Click "Download" to save the QR code image
6. You can also customize colors, size, etc.

#### Option 2: QR Code Monkey
**Website**: https://www.qrcode-monkey.com/

Steps:
1. Go to https://www.qrcode-monkey.com/
2. Select "URL" option
3. Paste your download link
4. Customize (optional): Add logo, colors, etc.
5. Click "Create QR Code"
6. Click "Download PNG" or "Download SVG"

#### Option 3: QRCode API (Simple)
**Website**: https://api.qrserver.com/v1/create-qr-code/

Direct URL method:
```
https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=YOUR_DOWNLOAD_LINK_HERE
```

Replace `YOUR_DOWNLOAD_LINK_HERE` with your actual download link.

Example:
```
https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://drive.google.com/uc?export=download&id=1ABC123xyz456
```

Just open this URL in your browser and right-click to save the image!

#### Option 4: QR Code Generator (Simple)
**Website**: https://www.the-qrcode-generator.com/

Steps:
1. Go to https://www.the-qrcode-generator.com/
2. Paste your download link
3. Click "Generate"
4. Click "Download" to save

---

### Step 5: Test Your QR Code

Before sharing with testers:

1. **Test the QR Code**:
   - Use your phone's camera app to scan the QR code
   - Make sure it opens the download link
   - Verify the APK downloads correctly

2. **Test on Different Devices**:
   - Try scanning with Android phones
   - Try scanning with iPhone (to test if it works)
   - Test with different QR code scanner apps

---

### Step 6: Share with Testers

You can share the QR code in several ways:

1. **Print it**: Print on paper or display on screen
2. **Email**: Attach QR code image to email
3. **Website**: Upload QR code to a simple webpage
4. **Social Media**: Share QR code image on social platforms
5. **Document**: Include QR code in a PDF guide

---

## Quick Reference: Direct Download Link Format

### Google Drive:
```
Original: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
Direct:   https://drive.google.com/uc?export=download&id=FILE_ID
```

### GitHub Releases:
```
https://github.com/USERNAME/REPO/releases/download/VERSION/app.apk
```

### Dropbox:
```
Original: https://www.dropbox.com/s/xxxxx/file.apk?dl=0
Direct:   https://www.dropbox.com/s/xxxxx/file.apk?dl=1
```

---

## Best Practices

1. **Use Short URLs**: If your download link is very long, use a URL shortener like:
   - https://bit.ly
   - https://tinyurl.com
   - Then generate QR code from the short URL

2. **Test First**: Always test the QR code yourself before sharing

3. **Provide Instructions**: Along with the QR code, provide:
   - Instructions to enable "Install from Unknown Sources"
   - What to expect when downloading
   - Troubleshooting tips

4. **Multiple Formats**: Generate QR code in both PNG (for digital) and SVG (for printing)

5. **Size Matters**: Make sure QR code is large enough to scan easily (at least 2x2 inches or 5x5 cm)

---

## Example Complete Workflow

1. Build APK: `npx eas build -p android --profile preview`
2. Download APK from EAS
3. Upload to Google Drive → Get sharing link
4. Convert to direct download: `https://drive.google.com/uc?export=download&id=FILE_ID`
5. Generate QR code at: https://www.qr-code-generator.com/
6. Download QR code image
7. Share with testers!

---

## Troubleshooting

**QR code doesn't scan?**
- Make sure QR code is large enough
- Check lighting conditions
- Try different QR scanner apps
- Ensure the download link is correct

**Download link doesn't work?**
- Verify the Google Drive file is set to "Anyone with link can view"
- Try converting the link again
- Consider using alternative hosting (GitHub, Dropbox)

**APK won't install?**
- Testers need to enable "Install from Unknown Sources"
- Check if APK is corrupted (re-download)
- Verify Android version compatibility

---

## Recommended QR Code Generator Websites

1. **https://www.qr-code-generator.com/** ⭐ (Best overall)
2. **https://www.qrcode-monkey.com/** ⭐ (Great customization)
3. **https://www.the-qrcode-generator.com/** (Simple)
4. **https://qr.io/** (Clean interface)
5. **https://www.qr-code-generator.com/qr-code-api/** (For programmatic generation)

---

## Quick Command Line QR Code (Mac/Linux)

If you prefer command line:

```bash
# Install qrencode (Mac: brew install qrencode)
qrencode -o qrcode.png "YOUR_DOWNLOAD_LINK_HERE"
```

This creates a PNG file with your QR code!

