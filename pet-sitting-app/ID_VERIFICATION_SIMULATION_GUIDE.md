# 🆔 ID Verification Simulation Guide

## 📋 Overview

This guide explains the ID verification simulation system that replaces the Veriff API for development and testing purposes.

## 🎯 Features

### ✅ **Working Features:**
- **90% Success Rate**: Realistic simulation with 10% failure rate
- **Enhanced Logging**: Detailed logs with emojis for easy monitoring
- **CORS Support**: Web-compatible headers
- **Multiple Document Types**: Support for all Philippine government IDs
- **Verification Scores**: Random scores between 85-100 for successful verifications
- **User Data Processing**: Handles complete user information

### 📊 **Simulation Details:**
- **Success Rate**: 90% (configurable)
- **Verification Scores**: 85-100 for successful verifications
- **Processing Time**: 2-second delay to simulate API calls
- **Document Types**: All Philippine government IDs supported

## 🔧 API Endpoint

### **POST** `/api/verification/submit-simple`

**URL**: `http://192.168.100.145:8000/api/verification/submit-simple`

**Headers**:
```
Content-Type: application/json
Accept: application/json
```

**Request Body**:
```json
{
  "document_type": "ph_national_id",
  "document_number": "1234-5678901-2",
  "document_image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...",
  "first_name": "Test",
  "last_name": "User", 
  "email": "test@example.com",
  "phone": "09639283365",
  "age": "25",
  "gender": "Other",
  "address": "Test Address"
}
```

**Response (Success)**:
```json
{
  "success": true,
  "message": "ID and face verified successfully!",
  "verification": {
    "id": 1753944844,
    "status": "approved",
    "document_type": "ph_national_id",
    "is_philippine_id": true,
    "verification_score": 97,
    "submitted_at": "2025-07-31 06:54:04"
  },
  "user": {
    "first_name": "Test",
    "last_name": "User",
    "email": "test@example.com",
    "phone": "09639283365",
    "age": "25",
    "gender": "Other",
    "address": "Test Address"
  },
  "simulation_mode": true,
  "timestamp": "2025-07-31 06:54:04",
  "veriff_api_key_present": false
}
```

**Response (Failure)**:
```json
{
  "success": false,
  "message": "ID verification failed. Please ensure your document is clear and valid.",
  "error_code": "VERIFF_REJECTED",
  "simulation_mode": true,
  "timestamp": "2025-07-31 06:54:04",
  "document_type": "ph_national_id",
  "is_philippine_id": true
}
```

## 📄 Supported Document Types

### Philippine Government IDs:
- `ph_national_id` - Philippine National ID
- `ph_drivers_license` - Philippine Driver's License
- `sss_id` - SSS ID
- `philhealth_id` - PhilHealth ID
- `tin_id` - TIN ID
- `postal_id` - Postal ID
- `voters_id` - Voter's ID
- `prc_id` - PRC ID
- `umid` - UMID
- `owwa_id` - OWWA ID

## 🔍 Logging

### **Enhanced Log Format:**
```
🔔 VERIFF ID VERIFICATION SIMULATION STARTED
📄 ID VERIFICATION - Received verification request
⏰ Timestamp: 2025-07-31 06:54:02
🌐 Request IP: 192.168.100.145
👤 User Agent: curl/8.7.1
📄 Document Type: ph_national_id
📸 Image provided: Yes
👤 User: Test User
📧 Email: test@example.com
📱 Phone: 09639283365
🎭 VERIFF SIMULATION - Creating session...
✅ VERIFF SIMULATION SUCCESS - Document verified successfully
💾 VERIFICATION RECORD CREATED - ID: 1753944844
📊 Verification Score: 97
🎉 ID VERIFICATION COMPLETED SUCCESSFULLY
```

### **Monitor Logs:**
```bash
# Real-time monitoring
tail -f storage/logs/laravel.log | grep -E "(🔔|📄|✅|❌|🎭|⏰|🌐|👤|📸|🔑|💾|📊|🎉|VERIFICATION)"

# View recent logs
tail -n 50 storage/logs/laravel.log | grep -E "(🔔|📄|✅|❌|🎭|⏰|🌐|👤|📸|🔑|💾|📊|🎉|VERIFICATION)"
```

## 🧪 Testing

### **Test with curl:**
```bash
curl -X POST http://192.168.100.145:8000/api/verification/submit-simple \
  -H "Content-Type: application/json" \
  -d '{
    "document_type": "ph_national_id",
    "document_number": "1234-5678901-2",
    "document_image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
    "first_name": "Test",
    "last_name": "User",
    "email": "test@example.com",
    "phone": "09639283365",
    "age": "25",
    "gender": "Other",
    "address": "Test Address"
  }'
```

## 🔧 Configuration

### **Success Rate Adjustment:**
In `VerificationController.php`, line with `rand(1, 100) <= 90`:
```php
// Change 90 to adjust success rate (1-100)
$veriffSuccess = rand(1, 100) <= 90;
```

### **Processing Delay:**
In `VerificationController.php`, line with `sleep(2)`:
```php
// Change 2 to adjust processing time (seconds)
sleep(2); // Simulate API delay
```

### **Verification Score Range:**
In `VerificationController.php`, line with `rand(85, 100)`:
```php
// Change range to adjust verification scores
'verification_score' => rand(85, 100), // Random score between 85-100
```

## 🚀 Frontend Integration

### **React Native/Expo:**
```typescript
const submitVerification = async () => {
  try {
    const response = await fetch('http://192.168.100.145:8000/api/verification/submit-simple', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        document_type: 'ph_national_id',
        document_image: base64Image,
        first_name: userData.firstName,
        last_name: userData.lastName,
        email: userData.email,
        phone: userData.phone,
        // ... other fields
      }),
    });

    const data = await response.json();
    if (data.success) {
      console.log('Verification successful:', data);
    } else {
      console.log('Verification failed:', data.message);
    }
  } catch (error) {
    console.error('Verification error:', error);
  }
};
```

## 🔍 Troubleshooting

### **Common Issues:**

1. **"Failed to submit verification"**
   - Check if Laravel server is running on port 8000
   - Verify API endpoint URL is correct
   - Check browser console for CORS errors

2. **"Network request failed"**
   - Ensure Laravel server is bound to `0.0.0.0:8000`
   - Check if frontend is using correct IP address
   - Verify network connectivity

3. **"Headers already sent"**
   - Check for whitespace before `<?php` in PHP files
   - Ensure no output before headers

4. **"Validation failed"**
   - Check required fields are present
   - Verify email format is valid
   - Ensure document_image is base64 encoded

### **Debug Commands:**
```bash
# Check if Laravel server is running
lsof -i :8000

# Check Laravel logs
tail -f storage/logs/laravel.log

# Test API directly
curl -X POST http://192.168.100.145:8000/api/verification/submit-simple \
  -H "Content-Type: application/json" \
  -d '{"document_type":"ph_national_id","document_image":"data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=","first_name":"Test","last_name":"User","email":"test@example.com","phone":"09639283365"}'
```

## 📝 Notes

- **Simulation Mode**: This is a development/testing system, not production-ready
- **Veriff Integration**: Real Veriff API integration can be added by uncommenting the HTTP calls
- **Security**: In production, add proper authentication and validation
- **Performance**: Base64 images increase payload size; consider file upload for production

## 🎉 Success Indicators

When working correctly, you should see:
- ✅ API returns `{"success": true}`
- ✅ Enhanced logs with emojis
- ✅ Verification scores between 85-100
- ✅ User data included in response
- ✅ No CORS errors in browser console 