# Next Steps: Create New Project on Your Account

## ✅ What I Just Did

I removed the old `projectId` from `app.json` so you can create a new project on your account.

---

## Step 1: Login to Your Account

Run this command:

```bash
eas login
```

Enter credentials for the account you want to use (e.g., `jassyqt`).

---

## Step 2: Create New Project

After logging in, run:

```bash
eas build:configure
```

This will:
- Create a new project on your account
- Generate a new `projectId`
- Add it to your `app.json`

Just press Enter to accept defaults when prompted.

---

## Step 3: Build Your APK

Once the project is created:

```bash
npx eas build -p android --profile preview
```

This will build using your account!

---

## Quick Commands Summary

```bash
# 1. Login
eas login

# 2. Configure (creates new project)
eas build:configure

# 3. Build
npx eas build -p android --profile preview
```

---

## Notes

- ✅ Old project ID removed
- ✅ Ready to create new project
- ✅ Will work with your account
- ✅ No permissions issues

