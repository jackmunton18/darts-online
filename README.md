# Darts Game Platform

A modern, real-time darts scoring and game management application built with Nuxt 3, Firebase, and Tailwind CSS.

## ✨ Features

- **🎯 Live Game Sessions**: Create and join game sessions with unique codes
- **⚡ Real-time Scoring**: Track scores across devices with Firebase Firestore
- **📊 Game Analytics**: View detailed statistics and performance metrics
- **🎲 Checkout Suggestions**: Get intelligent suggestions for checkout paths
- **📚 Game History**: Review previous games and analyze your progress
- **👤 User Profiles**: Unique usernames, user management, and account settings
- **📱 Responsive Design**: Works seamlessly on desktop and mobile devices

## 🚀 Recent Updates (v2.0)

- **Nuxt 3 Migration**: Complete refactor from Nuxt 2 to Nuxt 3 with modern patterns
- **Firestore Users Collection**: Dedicated user management with unique usernames
- **Enhanced Analytics**: Fixed fastest checkout calculations and improved statistics
- **Server API Routes**: Modern Nuxt 3 server API endpoints for all operations
- **Netlify SSR Ready**: Configured for production deployment with SSR support
- **Firebase Admin Integration**: Secure server-side Firebase operations

## 🛠️ Tech Stack

- **Frontend**: Nuxt 3, Vue 3, TypeScript, Tailwind CSS
- **Backend**: Nitro server, Firebase Admin SDK
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Deployment**: Netlify (SSR)
- **Styling**: Tailwind CSS, SCSS

## 📦 Setup

Install dependencies:

```bash
npm install
```

### Environment Configuration

Copy the environment template:
```bash
cp .env.production.example .env
```

Update `.env` with your Firebase configuration:

```env
# Firebase Client (Public)
NUXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NUXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NUXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin (Server-side)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your_project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your_client_id
```

## 🏃‍♂️ Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run generate` - Generate static files
- `./scripts/test-production.sh` - Run production readiness tests

## 🚀 Production Deployment

### Netlify Deployment

The project is configured for Netlify SSR deployment:

1. **Build Configuration**:
   - Build command: `npm run build`
   - Publish directory: `.output/public`
   - Node version: `18`

2. **Environment Variables**: Add all Firebase variables to Netlify dashboard

3. **Deployment**: See `NETLIFY_DEPLOYMENT.md` for detailed instructions

### Test Production Build

Run the production test script:

```bash
./scripts/test-production.sh
```

This script verifies:
- ✅ Build completes successfully
- ✅ Output structure is correct
- ✅ All API routes are built
- ✅ Environment configuration is ready
- ✅ Firebase integration is configured

## 📁 Project Structure

```
├── components/          # Vue components
│   ├── ui/             # Reusable UI components
│   └── game/           # Game-specific components
├── composables/        # Vue composables
├── pages/              # Nuxt pages (file-based routing)
├── server/             # Server API routes
│   ├── api/            # API endpoints
│   └── plugins/        # Server plugins
├── stores/             # Pinia stores
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## 🔥 Firebase Configuration

### Firestore Collections

- **users**: User profiles with unique usernames
- **games**: Game sessions and scoring data
- **throws**: Individual throw records

### Security Rules

The project includes Firestore security rules in `firestore.rules` that:
- Allow authenticated users to manage their own data
- Restrict game access to participants
- Enable server-side admin operations

## 🎮 Game Flow

1. **User Registration**: Create account with unique username
2. **Game Creation**: Host creates a game session
3. **Game Joining**: Players join using a game code
4. **Real-time Scoring**: Track throws and scores across all devices
5. **Analytics**: View detailed game statistics and performance metrics

## 🧪 Development Notes

### API Routes

Server API routes are located in `server/api/`:
- `/api/users/*` - User management (create, update, profile)
- `/api/games/*` - Game operations (create, join, scoring)
- `/api/auth` - Authentication helpers

### State Management

The application uses Pinia stores:
- `authStore` - Authentication state
- `userStore` - User profile management
- `gameStore` - Game session state
- `notificationStore` - Toast notifications

### Firebase Integration

- **Client**: Firebase SDK for authentication and real-time updates
- **Server**: Firebase Admin SDK for secure server operations
- **Auto-initialization**: Firebase Admin initializes automatically on server startup

## 📋 Production Checklist

Before deploying to production:

- [ ] Firebase project configured
- [ ] Environment variables set in Netlify
- [ ] Firestore security rules deployed
- [ ] Service account permissions verified
- [ ] Production build tests pass
- [ ] All API endpoints accessible
- [ ] User registration/login tested
- [ ] Game functionality verified
- [ ] Analytics working correctly

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is private and proprietary.

---

**Version 2.0** - Refactored for Nuxt 3 with modern architecture and Netlify SSR deployment.

# Set up your Firebase configuration
# Create a .env file with the following variables:
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
FIREBASE_APP_ID=your-app-id

# Start the development server
npm run dev
```

## Deployment

```bash
# Build for production
npm run build

# Deploy to Netlify
# Method 1: Using Netlify CLI
npm install -g netlify-cli
netlify login
netlify deploy --prod

# Method 2: Connect your GitHub repository to Netlify
# and enable automatic deployments when you push to your repository

# Firebase CLI is still needed for managing Firestore rules and indexes
npm install -g firebase-tools
firebase login
firebase deploy --only firestore
```

## Game Session Flow

1. **Create a Game**:
   - Set game type (501, 301, etc.)
   - Configure legs and sets to win
   - Share the generated game code with friends

2. **Join a Game**:
   - Enter the game code to join as a player
   - Or join as a spectator to watch without playing

3. **Gameplay**:
   - Score is tracked in real-time for all players
   - Current player is highlighted
   - Checkout suggestions appear when in range
   - Turn history is recorded for analysis

4. **Game Completion**:
   - Winner is determined based on legs/sets won
   - Statistics are saved for future analysis
   - Players can view detailed game history

## Analytics

The analytics section provides insights into your darts performance:

- Average score per turn
- Checkout percentage
- High scores and high checkouts
- Performance trends over time
- Detailed game history

## Firebase Structure

The application uses the following Firestore collections:

- `dartsGames`: Stores game sessions and their configuration
- `dartsGames/{gameId}/turns`: Sub-collection for each turn in a game
- `userStats`: Player statistics and historical data

## License

MIT




Polaroid Library - Image uploader and gallery
Itinerary 
Mini games
    - Word search
    - Band quiz
