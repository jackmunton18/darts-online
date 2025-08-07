# Firebase Configuration

## ⚠️ Security Notice

This directory previously contained `firebase-service-account.json` which has been removed for security reasons.

## Setup Instructions

Instead of using a service account file, all Firebase credentials are now managed through environment variables.

### Development Setup

1. Copy `.env.local.example` to `.env.local` in the project root
2. Fill in your actual Firebase credentials in `.env.local`
3. Add `.env.local` to your `.gitignore` (it should already be there)

### Production Setup (Netlify)

Add these environment variables to your Netlify dashboard:

```bash
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key_here\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your_client_id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
```

### Getting Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings > Service Accounts
4. Click "Generate new private key"
5. Copy the values from the downloaded JSON file to your environment variables

### Important Security Notes

- ✅ Environment variables are secure
- ❌ Never commit service account JSON files to git
- ❌ Never expose private keys in your code
- ✅ Use `.env.local` for development (not committed)
- ✅ Use Netlify environment variables for production
