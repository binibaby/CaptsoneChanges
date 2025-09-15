# PetSitter Connect - Full-Stack Pet Sitting Platform

A comprehensive mobile application and web platform that connects pet owners with trusted pet sitters in their area, featuring real-time messaging, secure payments, ID verification, and location-based services.

## 🚀 Features

### Core Features (Implemented)
- **Dual User Roles**: Pet Owners & Pet Sitters with specialized dashboards ✅
- **Pet Profile Management**: Comprehensive pet profiles with photos and preferences ✅
- **Advanced Booking System**: Real-time booking with calendar integration ✅
- **Phone Verification**: SMS verification system with simulation mode ✅
- **ID Verification**: Document verification with simulation mode ✅
- **Location-based Search**: Interactive maps to find nearby sitters ✅
- **Real-time Notifications**: Push notifications for bookings and updates ✅
- **Background Location Tracking**: Enhanced service delivery ✅
- **RESTful API**: Complete backend API with Laravel Sanctum authentication ✅

### Development Features (Simulation Mode)
- **Phone Verification Simulation**: Development-friendly SMS verification
- **ID Verification Simulation**: Document verification for testing
- **Payment Simulation**: Mock payment processing for development
- **Admin Dashboard**: Complete backend management system

### Advanced Features
- **Phone Verification**: SMS-based authentication with multiple providers
- **Document Verification**: Front/back ID and selfie verification
- **Admin Dashboard**: Complete backend management system
- **Automated Payments**: 20% platform fee with automatic processing
- **Multi-language Support**: Ready for internationalization
- **Offline Capability**: Core features work without internet

## 🛠 Tech Stack

### Frontend (React Native/Expo)
- **Framework**: React Native with Expo SDK 54
- **Language**: TypeScript
- **Navigation**: Expo Router with typed routes
- **State Management**: React Context API
- **Maps**: React Native Maps with location services
- **Authentication**: Custom API-based authentication
- **Storage**: AsyncStorage for local data
- **Notifications**: Expo Notifications
- **UI Components**: Custom components with React Native Vector Icons

### Backend (Laravel)
- **Framework**: Laravel 12 with PHP 8.2+
- **Authentication**: Laravel Sanctum (JWT tokens) ✅
- **Database**: MySQL/PostgreSQL with Eloquent ORM ✅
- **API**: RESTful API with comprehensive endpoints ✅
- **SMS**: Twilio, MessageBird, and Vonage integration (Simulation Mode) 🎭
- **ID Verification**: Document verification system (Simulation Mode) 🎭
- **File Storage**: Laravel Storage with cloud support ✅
- **Queue System**: Laravel Queues for background processing ✅
- **Testing**: PHPUnit with comprehensive test coverage ✅

### Third-Party Integrations
- **Google Maps**: Location services and mapping ✅
- **Expo**: Development platform and deployment ✅
- **Laravel Sanctum**: JWT authentication ✅
- **SMS Services**: Twilio/MessageBird/Vonage (Simulation Mode) 🎭
- **ID Verification**: Document verification (Simulation Mode) 🎭
- **Payment Processing**: Mock payment system (Simulation Mode) 🎭

## 📱 Project Structure

```
CapstoneApp/
├── app/                          # Expo Router screens
│   ├── _layout.tsx              # Root layout with navigation
│   ├── auth.tsx                 # Authentication flow
│   ├── pet-owner-dashboard.tsx  # Pet owner main screen
│   ├── pet-sitter-dashboard.tsx # Pet sitter main screen
│   └── ...                      # Other app screens
├── src/
│   ├── components/              # Reusable UI components
│   ├── screens/                 # Screen components
│   │   ├── auth/               # Authentication screens
│   │   ├── app/                # Main app screens
│   │   └── onboarding/         # Onboarding flow
│   ├── services/               # API and external services
│   ├── contexts/               # React Context providers
│   ├── constants/              # App constants and theme
│   ├── hooks/                  # Custom React hooks
│   └── utils/                  # Utility functions
├── pet-sitting-app/            # Laravel backend
│   ├── app/
│   │   ├── Http/Controllers/   # API controllers
│   │   ├── Models/             # Eloquent models
│   │   └── Services/           # Business logic services
│   ├── database/               # Migrations and seeders
│   ├── routes/                 # API routes
│   └── tests/                  # Backend tests
└── assets/                     # Images and static assets
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- PHP 8.2+ and Composer
- MySQL/PostgreSQL database
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

### Frontend Setup (React Native/Expo)

1. **Clone the repository**
   ```bash
   git clone https://github.com/binibaby/CaptsoneChanges.git
   cd CaptsoneChanges
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment configuration**
   Create a `.env` file in the root directory:
   ```env
   EXPO_PUBLIC_API_BASE_URL=http://localhost:8000/api
   EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Run on specific platforms**
   ```bash
   npm run ios      # iOS Simulator
   npm run android  # Android Emulator
   npm run web      # Web browser
   ```

### Backend Setup (Laravel)

1. **Navigate to backend directory**
   ```bash
   cd pet-sitting-app
   ```

2. **Install PHP dependencies**
   ```bash
   composer install
   ```

3. **Environment configuration**
   Copy `.env.example` to `.env` and configure:
   ```env
   APP_NAME="PetSitter Connect"
   APP_ENV=local
   APP_KEY=base64:your_app_key
   APP_DEBUG=true
   APP_URL=http://localhost:8000
   
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=petsitter_db
   DB_USERNAME=your_username
   DB_PASSWORD=your_password
   
   # SMS Services (Optional - uses simulation mode if not configured)
   TWILIO_SID=your_twilio_sid
   TWILIO_TOKEN=your_twilio_token
   MESSAGEBIRD_API_KEY=your_messagebird_key
   VONAGE_API_KEY=your_vonage_key
   VONAGE_API_SECRET=your_vonage_secret
   ```

4. **Generate application key**
   ```bash
   php artisan key:generate
   ```

5. **Run database migrations**
   ```bash
   php artisan migrate
   ```

6. **Seed the database**
   ```bash
   php artisan db:seed
   ```

7. **Start the development server**
   ```bash
   php artisan serve
   ```

8. **Start queue worker (for background jobs)**
   ```bash
   php artisan queue:work
   ```

## 🔧 Development Scripts

### Frontend Scripts
```bash
npm start              # Start Expo development server
npm run android        # Run on Android
npm run ios           # Run on iOS
npm run web           # Run on web
npm run lint          # Run ESLint
npm run reset-project # Reset project configuration
```

### Backend Scripts
```bash
php artisan serve                    # Start Laravel server
php artisan queue:work              # Start queue worker
php artisan migrate                 # Run migrations
php artisan db:seed                 # Seed database
php artisan test                    # Run tests
composer run dev                    # Start all services (server, queue, logs, vite)
```

## 📚 API Documentation

### Working API Endpoints ✅

#### Authentication & User Management
- `POST /api/register` - User registration ✅
- `POST /api/login` - User login ✅
- `POST /api/logout` - User logout ✅
- `GET /api/user` - Get current user profile ✅
- `POST /api/profile/update` - Update user profile ✅
- `POST /api/profile/upload-image` - Upload profile image ✅

#### Phone Verification (Simulation Mode)
- `POST /api/send-verification-code` - Send phone verification code ✅
- `POST /api/verify-phone-code` - Verify phone code ✅
- `POST /api/resend-verification-code` - Resend verification code ✅

#### ID Verification (Simulation Mode)
- `POST /api/verification/submit` - Submit ID verification ✅
- `POST /api/verification/submit-simple` - Simple verification submission ✅
- `GET /api/verification/status` - Check verification status ✅
- `POST /api/verification/skip` - Skip verification (development) ✅

#### Pet Management
- `GET /api/pets` - Get user pets ✅
- `POST /api/pets` - Add pet profile ✅
- `GET /api/pets/{id}` - Get specific pet ✅
- `PUT /api/pets/{id}` - Update pet profile ✅
- `DELETE /api/pets/{id}` - Remove pet ✅

#### Booking System
- `GET /api/bookings` - Get user bookings ✅
- `POST /api/bookings` - Create new booking ✅
- `GET /api/bookings/{id}` - Get specific booking ✅
- `PUT /api/bookings/{id}` - Update booking ✅
- `DELETE /api/bookings/{id}` - Cancel booking ✅

#### Notifications
- `GET /api/notifications` - Get user notifications ✅
- `GET /api/notifications/unread-count` - Get unread count ✅
- `PUT /api/notifications/{id}/read` - Mark notification as read ✅
- `PUT /api/notifications/mark-all-read` - Mark all as read ✅

#### Location & Sitters
- `POST /api/location/update` - Update user location ✅
- `POST /api/location/status` - Set online status ✅
- `POST /api/location/nearby-sitters` - Find nearby sitters ✅
- `GET /api/sitters/{id}/availability` - Get sitter availability ✅
- `POST /api/sitters/availability` - Save sitter availability ✅

#### Support System
- `GET /api/support/tickets` - Get support tickets ✅
- `POST /api/support/tickets` - Create support ticket ✅
- `GET /api/support/tickets/{id}` - Get specific ticket ✅
- `POST /api/support/tickets/{id}/messages` - Send message ✅

#### Payment & Wallet (Simulation Mode)
- `GET /api/payments` - Get user payments ✅
- `POST /api/payments` - Process payment (simulation) ✅
- `GET /api/payments/{id}` - Get payment details ✅
- `GET /api/wallet/balance` - Get wallet balance ✅
- `GET /api/wallet/transactions` - Get transaction history ✅
- `POST /api/wallet/add-funds` - Add funds to wallet (simulation) ✅
- `POST /api/wallet/withdraw` - Withdraw from wallet (simulation) ✅

#### Test Endpoint
- `GET /api/test` - API connectivity test ✅

## 🔐 Security Features

- **Phone Verification**: SMS verification with simulation mode for development
- **ID Verification**: Document verification with simulation mode for testing
- **JWT Authentication**: Secure token-based authentication with Laravel Sanctum
- **Data Validation**: Comprehensive input sanitization and validation
- **CORS Protection**: Proper cross-origin resource sharing configuration
- **Rate Limiting**: API rate limiting for security
- **Secure File Upload**: Image upload with validation and storage

## 🎭 Simulation Mode Features

### Phone Verification Simulation
- **Development-Friendly**: No real SMS costs during development
- **Comprehensive Logging**: Detailed logs with emojis and timestamps
- **Code Generation**: Automatic 4-digit verification codes
- **Cache Management**: Codes stored in Laravel cache with expiration
- **Debug Information**: Easy-to-find verification codes in logs

### ID Verification Simulation
- **Document Upload**: File upload with validation
- **Philippine ID Support**: 10+ Philippine government ID types
- **Pattern Validation**: ID number format validation
- **Simulation Results**: 90% success rate for testing
- **Status Tracking**: Real-time verification status updates

### Payment Simulation
- **Mock Transactions**: No real money transactions
- **Platform Fee Calculation**: Automatic 20% fee calculation
- **Multiple Methods**: Stripe, GCash, Maya simulation
- **Transaction Logging**: Complete payment audit trail

## 🧪 Testing

### Frontend Testing
```bash
npm run lint          # Code quality check
npm run test          # Run tests (when configured)
```

### Backend Testing
```bash
php artisan test                    # Run all tests
php artisan test --filter=AuthTest # Run specific test
composer run test                   # Run tests with coverage
```

### Simulation Testing
```bash
# Test phone verification simulation
php test_phone_verification_simulation.php

# Test ID verification simulation
php test_id_verification_simulation.php

# Test complete system simulation
php test_complete_system.php
```

## 📱 Platform Support

- **iOS**: 13.0+ (iPhone and iPad)
- **Android**: API level 21+ (Android 5.0+)
- **Web**: Modern browsers with PWA support

## 🚀 Deployment

### Frontend Deployment
1. **Build for production**
   ```bash
   expo build:android  # Android APK
   expo build:ios      # iOS IPA
   ```

2. **Deploy to app stores**
   - Follow Expo's deployment guide
   - Configure app store credentials
   - Submit for review

### Backend Deployment
1. **Production environment setup**
   ```bash
   composer install --optimize-autoloader --no-dev
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   ```

2. **Deploy to server**
   - Configure web server (Apache/Nginx)
   - Set up SSL certificates
   - Configure database
   - Set up queue workers

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation in the `/docs` folder
- Review the API integration guide

## 🎯 Roadmap

- [ ] Push notifications for real-time updates
- [ ] Video calling for pet sitters and owners
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Social media integration
- [ ] Advanced search filters
- [ ] Pet health tracking
- [ ] Insurance integration

---

**Built with ❤️ for pet lovers everywhere**