# Firebase Service Account Configuration

This directory can hold a `firebase-service-account.json` file for Firebase Admin SDK authentication.

## Setup Instructions

1. Go to Firebase Console > Project Settings > Service Accounts
2. Click "Generate new private key"
3. Rename the downloaded file to `firebase-service-account.json`
4. Place it in this directory

## Security Notice

Keep this file secure and never commit it to version control.
Add it to your `.gitignore` file if not already there.
