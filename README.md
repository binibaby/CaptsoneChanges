# PetSitter App

A mobile application that connects pet owners with trusted pet sitters in their area, inspired by PetBacker.

## Features

- User Authentication (Pet Owners & Pet Sitters)
- Pet Profiles Management
- Booking System
- Reviews and Ratings
- Real-time Messaging
- Location-based Search
- Secure Payments
- Push Notifications

## Tech Stack

- React Native / Expo
- TypeScript
- Firebase (Authentication, Database, Storage)
- React Navigation
- Expo Location
- React Native Maps
- Stripe (Payments)

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```

## Project Structure

```
src/
├── app/                 # Main application screens
├── components/          # Reusable components
├── constants/          # App constants and theme
├── hooks/              # Custom React hooks
├── services/           # API and third-party services
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## Environment Setup

Create a `.env` file in the root directory with the following variables:

```
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_auth_domain
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
STRIPE_PUBLISHABLE_KEY=your_stripe_key
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request
