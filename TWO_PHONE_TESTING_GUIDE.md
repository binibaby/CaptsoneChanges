# Two-Phone Real-Time Location Testing Guide

## 🎯 Testing Setup

You'll need **2 phones** with the app installed to test the real-time location detection and sitter popup functionality.

### Phone 1: Pet Sitter
- Register as a **Pet Sitter**
- Complete phone verification
- Go to Pet Sitter Dashboard
- Enable location sharing

### Phone 2: Pet Owner  
- Register as a **Pet Owner**
- Complete phone verification
- Go to Find Sitter Map
- Look for nearby sitters

## 📱 Step-by-Step Testing Process

### 1. **Setup Pet Sitter (Phone 1)**
1. **Install and start the app**
2. **Register as Pet Sitter**:
   - Select "Pet Sitter" role
   - Complete registration form
   - Complete phone verification
3. **Go to Pet Sitter Dashboard**
4. **Enable Location Sharing**:
   - You'll see a "Location Sharing" card
   - Tap "Start Sharing Location"
   - Grant location permissions
   - Status should show "Sharing location - Pet owners can find you!"

### 2. **Setup Pet Owner (Phone 2)**
1. **Install and start the app**
2. **Register as Pet Owner**:
   - Select "Pet Owner" role
   - Complete registration form
   - Complete phone verification
3. **Go to Pet Owner Dashboard**
4. **Navigate to Find Sitter Map**:
   - Tap "Find Sitter Map" button

### 3. **Test Location Detection**
1. **Ensure both phones are in the same location** (within 2km radius)
2. **On Pet Owner phone**:
   - Open Find Sitter Map
   - You should see an orange paw marker on the map
   - The marker represents the pet sitter's location
3. **Tap the marker** to open the sitter profile popup
4. **Verify popup shows**:
   - Sitter's name and location
   - Specialties, experience, breeds
   - Hourly rate
   - Follow/Message buttons

### 4. **Test Real-Time Updates**
1. **Move the Pet Sitter phone** to a different location
2. **On Pet Owner phone**:
   - The marker should update in real-time
   - New location should be reflected
3. **Test online/offline status**:
   - Pet Sitter: Stop sharing location
   - Pet Owner: Marker should turn gray or disappear

## 🔍 What to Look For

### ✅ **Success Indicators**
- **Orange paw markers** appear on the map
- **Real-time location updates** when sitter moves
- **Profile popup** opens when tapping markers
- **Online/offline status** indicators
- **Distance calculation** shows correct proximity
- **Sitter information** displays correctly

### ❌ **Common Issues**
- **No markers visible**: Check location permissions
- **Markers not updating**: Ensure both phones have internet
- **Popup not opening**: Check console logs for errors
- **Wrong location**: Verify GPS accuracy

## 🛠️ Troubleshooting

### Location Not Detected
1. **Check permissions**: Both phones need location access
2. **Check internet**: Both phones need internet connection
3. **Check distance**: Must be within 2km radius
4. **Check logs**: Look for console error messages

### Real-Time Updates Not Working
1. **Restart location sharing** on sitter phone
2. **Refresh map** on owner phone
3. **Check network connectivity**
4. **Verify both phones are on same network**

### Profile Popup Issues
1. **Check sitter data** is properly loaded
2. **Verify popup component** is imported correctly
3. **Check for JavaScript errors** in console

## 📊 Expected Results

When working correctly, you should see:
- **Pet Sitter**: Green status indicator showing "Sharing location"
- **Pet Owner**: Orange paw marker on map at sitter's location
- **Real-time updates**: Marker moves when sitter moves
- **Profile popup**: Detailed sitter information with all requested fields
- **Distance calculation**: Shows how far sitter is from owner

## 🎉 Success!

If everything works, you've successfully tested:
- ✅ Real-time location sharing
- ✅ Location-based sitter detection
- ✅ Interactive map markers
- ✅ Detailed sitter profile popups
- ✅ Live location updates

The system is now ready for production use!
