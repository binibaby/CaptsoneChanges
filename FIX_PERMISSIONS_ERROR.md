# Fix: "You don't have the required permissions" Error

## Problem
You're logged in as **`jassyqt`** but the project was created with account **`juz3hh`**.

The project ID `4c892605-084b-4c60-9cc2-7fb3ebd1bad1` belongs to `juz3hh`, so you need to login with that account.

---

## Solution: Login with Original Account

### Step 1: Logout Current Account
```bash
eas logout
```

### Step 2: Login with `juz3hh` Account
```bash
eas login
```
Then enter credentials for **`juz3hh`** account.

### Step 3: Verify Account
```bash
eas whoami
```
Should show: `juz3hh`

### Step 4: Build Again
```bash
npx eas build -p android --profile preview
```

---

## Alternative: Use Current Account (jassyqt)

If you want to use `jassyqt` account instead, you need to:

### Option A: Create New Project on jassyqt Account
1. Remove or comment out the `projectId` in `app.json`:
   ```json
   "eas": {
     // "projectId": "4c892605-084b-4c60-9cc2-7fb3ebd1bad1"
   }
   ```
2. Run `eas build:configure` to create a new project
3. This will create a new project ID for `jassyqt` account

### Option B: Share Project (if you have access to juz3hh account)
1. Login as `juz3hh` at https://expo.dev
2. Go to project settings
3. Share project with `jassyqt` account
4. Then `jassyqt` can build

---

## Recommended Solution

**Login back to `juz3hh`** (easiest):
- The project already exists
- No need to reconfigure
- Just login and build

