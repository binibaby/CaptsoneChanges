# Notification Format Test

## Changes Made

### Backend (BookingController.php)
- **Daily Booking**: `"You have a new booking from {owner_name} on {date} at {start_time} - {end_time}. Please check your schedule for details."`
- **Weekly Booking**: `"You have a new weekly booking from {owner_name} from {start_date} to {end_date} at {start_time} - {end_time}. Please check your schedule for details."`

### Frontend (notificationService.ts)
- **Daily Booking**: `"You have a new booking from {owner_name} on {date} at {start_time} - {end_time}. Please check your schedule for details."`
- **Weekly Booking**: `"You have a new weekly booking from {owner_name} from {start_date} to {end_date} at {start_time} - {end_time}. Please check your schedule for details."`

## Expected Results

### Before (Old Format)
```
"You have a new booking from John Doe. Please check your schedule for details."
```

### After (New Format)
```
Daily: "You have a new booking from John Doe on October 31, 2025 at 08:00 - 17:00. Please check your schedule for details."

Weekly: "You have a new weekly booking from John Doe from October 31, 2025 to November 6, 2025 at 08:00 - 17:00. Please check your schedule for details."
```

## Test Steps
1. Create a new booking as a pet owner
2. Check the sitter's notification screen
3. Verify the notification shows:
   - ✅ Owner's name (not "My Pet")
   - ✅ Specific date
   - ✅ Time range
   - ✅ Clear, descriptive message

## Files Modified
- `pet-sitting-app/app/Http/Controllers/API/BookingController.php`
- `src/services/notificationService.ts`
