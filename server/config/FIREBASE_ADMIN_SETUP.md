# Firebase Admin Setup

To enable server-side Firebase Admin functionality (required for the active games API), you need to configure Firebase service account credentials.

## Option 1: Service Account Key File (Recommended for Development)

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`darts-torneo`)
3. Go to Project Settings → Service Accounts
4. Click "Generate new private key"
5. Download the JSON file
6. Save it as `server/config/firebase-service-account.json`

## Option 2: Environment Variable

1. Download the service account key as above
2. Set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable to point to the file:
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/service-account-key.json"
   ```

## What works without Firebase Admin

- Game creation (client-side)
- Game joining via game code (client-side)
- Real-time game updates (client-side)
- Local game session persistence
- All game functionality within a session

## What requires Firebase Admin

- Server-side active games API (`/api/games/active`)
- Server-side game joining API (`/api/games/join`) 
- Cross-user game discovery

For development, you can still test all game functionality by creating games and joining them via game codes. The active games panel will show games from local storage.
