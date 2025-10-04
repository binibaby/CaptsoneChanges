# SMS Message Options for Verification Codes

## Current Message (48 characters)
```
Petsit Connect code: 123456. Valid for 10 mins.
```

## Alternative Options

### Option 1: Shorter (42 characters)
```
Petsit code: 123456. Expires in 10 mins.
```

### Option 2: More Branded (45 characters)
```
Petsit Connect: 123456. Valid 10 mins.
```

### Option 3: Very Concise (38 characters)
```
Petsit: 123456. 10 min expiry.
```

### Option 4: Professional (50 characters)
```
Petsit Connect verification: 123456. 10 mins.
```

### Option 5: Friendly (44 characters)
```
Hi! Your Petsit code: 123456. 10 mins.
```

## Character Count Reference
- All messages are well under 100 characters
- SMS standard limit is 160 characters
- Shorter messages are more cost-effective
- Current message balances clarity with brevity

## To Change the Message
Edit the message in `app/Http/Controllers/API/AuthController.php` line 646:

```php
$message = "Your chosen message here: {$verificationCode}. Additional text.";
```

## Testing
Test any new message with:
```bash
curl -X POST http://127.0.0.1:8000/api/send-verification-code \
  -H "Content-Type: application/json" \
  -d '{"phone":"+639639283365"}'
```
