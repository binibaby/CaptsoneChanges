# How to Switch Expo/EAS Account

## Option 1: Logout and Login with Different Account

### Step 1: Logout from Current Account

```bash
eas logout
```

This will disconnect you from your current Expo account.

### Step 2: Login with Different Account

```bash
eas login
```

You'll be prompted to:
- Enter email for the new account
- Enter password
- Or create a new account if needed

---

## Option 2: Login Directly (if already logged out)

If you're already logged out, just run:

```bash
eas login
```

Then enter the credentials for the account you want to use.

---

## Option 3: Check Current Account

To see which account you're currently using:

```bash
eas whoami
```

This shows your current logged-in account.

---

## After Switching Accounts

Once you've switched accounts:

1. **Verify Account:**
   ```bash
   eas whoami
   ```

2. **Check Build Status:**
   - Go to https://expo.dev
   - Login with the new account
   - Check your projects

3. **Start New Build:**
   ```bash
   npx eas build -p android --profile preview
   ```

---

## Important Notes

- **Project Ownership:** Make sure the project is associated with the account you want to use
- **Build Queue:** Each account has its own build queue (1 concurrent build on free tier)
- **Project Access:** You need access to the project on the new account

---

## Troubleshooting

### If build fails with "project not found":
- The project might be tied to a different account
- You may need to update the `projectId` in `app.json`
- Or create a new project on the new account

### If you need to transfer project:
- You can share the project between accounts in Expo dashboard
- Or just use the existing account (recommended)

---

## Quick Command Reference

```bash
# Check current account
eas whoami

# Logout
eas logout

# Login with different account
eas login

# Build with new account
npx eas build -p android --profile preview
```

