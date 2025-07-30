# Pet Sit Connect - Mobile App & Admin Panel Integration Guide

## 🎯 Overview
This guide explains how to integrate your mobile app with the Laravel admin panel for ID verification, booking notifications, automatic payment processing with 20% platform fee, and real-time dashboard updates.

## 📱 Mobile App API Endpoints

### Base URL
```
http://localhost:8000/api
```

### 🔐 Authentication

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "password_confirmation": "password123",
  "role": "pet_owner", // or "pet_sitter"
  "phone": "+1234567890",
  "address": "123 Main St"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "success": true,
  "message": "Login successful!",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "pet_owner",
    "status": "pending"
  },
  "token": "1|abc123..."
}
```

### 📄 ID Verification

#### Submit ID Verification
```http
POST /api/verification/submit
Authorization: Bearer {token}
Content-Type: multipart/form-data

document_type: "national_id" // national_id, drivers_license, passport, other
document_number: "123456789"
document_image: [FILE] // Image file (max 5MB, jpeg/png/jpg)
```

**✅ What happens:**
1. ID document is uploaded to server
2. Verification record is created in database
3. **Admin gets notified immediately** in the admin panel
4. User can check status anytime

#### Check Verification Status
```http
GET /api/verification/status
Authorization: Bearer {token}
```

### 📅 Booking Management

#### Create Booking (Notifies Admin)
```http
POST /api/bookings
Authorization: Bearer {token}
Content-Type: application/json

{
  "sitter_id": 3,
  "date": "2025-08-15",
  "time": "10:00",
  "pet_name": "Buddy",
  "pet_type": "dog",
  "service_type": "pet_sitting",
  "duration": 8,
  "rate_per_hour": 25,
  "description": "Friendly golden retriever"
}
```

**✅ What happens:**
1. Booking is created in database
2. **Admin gets notified** about new booking
3. Pet sitter gets notification
4. Total amount calculated automatically

### 💳 Payment Processing (20% Auto-Deduction)

#### Process Payment with Stripe
```http
POST /api/payments/stripe
Authorization: Bearer {token}
Content-Type: application/json

{
  "booking_id": 1,
  "amount": 200,
  "payment_method_id": "pm_card_visa"
}
```

#### Process Payment with GCash
```http
POST /api/payments/gcash
Authorization: Bearer {token}
Content-Type: application/json

{
  "booking_id": 1,
  "amount": 200,
  "phone_number": "+639123456789"
}
```

#### Process Payment with Maya
```http
POST /api/payments/maya
Authorization: Bearer {token}
Content-Type: application/json

{
  "booking_id": 1,
  "amount": 200,
  "phone_number": "+639123456789"
}
```

**✅ What happens automatically:**
1. **20% platform fee deducted** (₱40 from ₱200)
2. Sitter receives 80% (₱160)
3. **Admin gets notified** with payment details
4. Pet owner and sitter get notifications
5. **Dashboard updates immediately** with new revenue

Response:
```json
{
  "success": true,
  "message": "Payment processed successfully!",
  "payment": {
    "id": 1,
    "amount": 200,
    "platform_fee": 40,    // 20% automatically calculated
    "sitter_amount": 160,  // 80% for sitter
    "status": "paid",
    "method": "stripe",
    "transaction_id": "TXN_1234567890"
  }
}
```

## 🔔 Automatic Notifications

### For Admins (in Admin Panel)
1. **ID Verification**: "New ID verification submitted by John Doe"
2. **New Booking**: "John Doe booked Jane Sitter for Aug 15 at 10:00 AM"
3. **Payment Success**: "Payment processed: ₱200 from John to Jane. Platform earned: ₱40 (20%)"

### For Users (in Mobile App)
1. **Verification Approved**: "Your ID verification has been approved!"
2. **Booking Confirmed**: "Your booking with Jane has been confirmed"
3. **Payment Success**: "Payment successful! ₱200 paid for booking"

## 🎛️ Admin Panel Features

### 📊 Dashboard Updates
- **Real-time revenue tracking** with 20% platform fees
- **Payment method breakdown** (Stripe, GCash, Maya)
- **Live booking statistics**
- **User verification metrics**

### 🔍 ID Verification Management
- View all submitted IDs with documents
- **Approve/Reject** with one click
- **Automatic user status updates**
- **Notification system** for users

### 💰 Payment Dashboard
- **Automatic 20% fee calculation**
- **Real-time payment tracking**
- **Revenue analytics**
- **Transaction history**

### 📱 Admin Panel URLs
- Dashboard: `http://localhost:8000/admin`
- ID Verifications: `http://localhost:8000/admin/verifications`
- Payments: `http://localhost:8000/admin/payments`
- Bookings: `http://localhost:8000/admin/bookings`
- Notifications: `http://localhost:8000/admin/notifications`

## 🚀 Mobile App Integration Steps

1. **Install HTTP client** (axios, fetch, etc.)
2. **Set base URL**: `http://localhost:8000/api`
3. **Store auth token** after login
4. **Include token** in Authorization header for all requests
5. **Handle responses** and show success/error messages

### Example React Native Integration
```javascript
const API_BASE_URL = 'http://localhost:8000/api';

// Submit ID Verification
const submitIDVerification = async (documentType, documentNumber, imageFile, token) => {
  const formData = new FormData();
  formData.append('document_type', documentType);
  formData.append('document_number', documentNumber);
  formData.append('document_image', {
    uri: imageFile.uri,
    type: 'image/jpeg',
    name: 'id_document.jpg'
  });

  const response = await fetch(`${API_BASE_URL}/verification/submit`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
    body: formData
  });

  return response.json();
};

// Process Payment
const processPayment = async (bookingId, amount, paymentMethod, token) => {
  const response = await fetch(`${API_BASE_URL}/payments/${paymentMethod}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      booking_id: bookingId,
      amount: amount,
      phone_number: '+639123456789' // for GCash/Maya
    })
  });

  return response.json();
};
```

## ✅ Key Features Summary

1. **ID Verification**: Submit from app → Review in admin → Auto-approve/reject
2. **Booking Notifications**: Create booking → Admin gets notified → Tracking in dashboard
3. **Payment Processing**: 20% fee auto-deducted → Admin notified → Dashboard updated
4. **Real-time Updates**: All actions reflect immediately in admin panel
5. **User Notifications**: Status updates sent to mobile app users

## 🔧 Admin Credentials
- **URL**: `http://localhost:8000/admin/login`
- **Email**: `admin@petsitconnect.com`
- **Password**: `admin123`

Your mobile app is now fully integrated with the admin panel! 🎉 
 