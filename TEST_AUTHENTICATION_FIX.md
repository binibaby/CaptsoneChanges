# 🧪 Authentication Fix Test Guide

## ✅ What Was Fixed

The authentication issue where verification submission was failing with "Unauthenticated" errors has been fixed. The changes include:

1. **Better Header Handling**: Properly converts and preserves Authorization headers
2. **500 Error Detection**: Detects 500 errors with "Unauthenticated" messages and treats them as auth errors
3. **Token Refresh**: Automatically refreshes tokens when authentication fails
4. **Better Error Handling**: Improved logging and error detection

## 🧪 How to Test WITHOUT Creating a New Account

### Option 1: Use Existing Account (Recommended)

1. **Login with an existing account** in your app or use the login API:
   ```bash
   curl -X POST http://127.0.0.1:8000/api/login \
     -H "Content-Type: application/json" \
     -d '{"email":"your-existing-email@example.com","password":"your-password"}'
   ```

2. **Copy the token** from the response

3. **Test the verification endpoint**:
   ```bash
   curl -X POST http://127.0.0.1:8000/api/verification/submit-simple \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     -d '{
       "document_type": "ph_national_id",
       "document_image": "test_base64",
       "front_image": "test_base64",
       "back_image": "test_base64",
       "selfie_image": "test_base64"
     }'
   ```

4. **Expected Results**:
   - ✅ **200/201**: Authentication is working correctly
   - ✅ **401**: Should trigger token refresh (if token refresh logic is enabled)
   - ✅ **500 with "Unauthenticated"**: Should be detected as auth error and trigger refresh

### Option 2: Use Test Script

1. **Update the test script** (`test_authentication_fix.js`):
   - Set `TEST_EMAIL` to an existing account email
   - Set `TEST_PASSWORD` to the account password
   - Or set `TEST_TOKEN` to a valid token

2. **Run the test**:
   ```bash
   node test_authentication_fix.js
   ```

### Option 3: Create Test Users (No SMS Required)

If you want to create test users without SMS verification:

```bash
cd pet-sitting-app
php artisan db:seed --class=TestUserSeeder
```

This creates:
- **Pet Owner**: `petowner@test.com` / `password123`
- **Pet Sitter**: `petsitter@test.com` / `password123`

Then test with:
```bash
node test_authentication_fix.js
```

## 🔍 What to Check

### 1. **Authentication Headers**
- ✅ Authorization header is sent as `Bearer {token}`
- ✅ Header format is correct
- ✅ Token is included in the request

### 2. **Error Handling**
- ✅ 401 errors trigger token refresh
- ✅ 500 errors with "Unauthenticated" are detected as auth errors
- ✅ Error responses are properly handled

### 3. **Code Changes Verified**
- ✅ `makeApiCall` properly handles headers
- ✅ Headers are preserved through retries
- ✅ Token refresh updates headers correctly

## 📋 Test Checklist

Before creating a new account, verify:

- [ ] Login works with existing account
- [ ] Token is properly received from login
- [ ] Verification endpoint accepts the token
- [ ] 401 errors are properly handled
- [ ] 500 errors with "Unauthenticated" are detected
- [ ] Headers are correctly formatted
- [ ] Token refresh logic works (if applicable)

## 🎯 Expected Behavior After Fix

### Before Fix:
- ❌ 500 error with "Unauthenticated" message
- ❌ Request fails without retry
- ❌ No token refresh attempt

### After Fix:
- ✅ 500 error with "Unauthenticated" is detected
- ✅ Token refresh is attempted
- ✅ Request is retried with new token
- ✅ Better error messages and logging

## 🚀 Quick Test Command

```bash
# 1. Login and get token
TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com","password":"your-password"}' \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

# 2. Test verification endpoint
curl -X POST http://127.0.0.1:8000/api/verification/submit-simple \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"document_type":"ph_national_id","document_image":"test"}'
```

## 📝 Notes

- The test uses minimal base64 image data to avoid large payloads
- The test verifies both valid and invalid tokens
- Error handling is tested with invalid tokens
- Header formatting is tested with different formats

## ✅ If Tests Pass

Once the tests pass, you can safely create a new account. The authentication fix will:
1. Properly send the token in the Authorization header
2. Detect authentication errors correctly
3. Attempt token refresh when needed
4. Provide better error messages

## ❌ If Tests Fail

If tests fail:
1. Check that the backend server is running
2. Verify the API URL is correct
3. Ensure the account exists and credentials are correct
4. Check Laravel logs for detailed error messages
5. Verify Sanctum token authentication is working

