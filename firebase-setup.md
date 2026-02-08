# Firebase Setup Guide for Brass Space Interior Solution

## Prerequisites
- Firebase CLI installed: `npm install -g firebase-tools`
- Firebase account with `brass-libs` project created
- Authentication already enabled ✅

## Required Firebase Services

### 1. Firestore Database
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your `brass-libs` project
3. Navigate to **Firestore Database**
4. Click **Create database**
5. Choose **Start in production mode**
6. Select your preferred location (closest to your users)

### 2. Storage
1. In Firebase Console → `brass-libs` project
2. Navigate to **Storage**
3. Click **Get started**
4. Choose **Start in production mode**
5. Select same location as Firestore

### 3. Hosting (Optional - for deployment)
1. In Firebase Console → `brass-libs` project
2. Navigate to **Hosting**
3. Click **Get started**
4. Follow the setup wizard

## Deploy Security Rules

After enabling the services, deploy your security rules:

```bash
# Login to Firebase CLI
firebase login

# Initialize Firebase in your project (if not done)
firebase init

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Storage rules
firebase deploy --only storage:rules

# Deploy everything (optional)
firebase deploy
```

## Initialize Firebase in Your Project

```bash
# In your project directory
firebase init

# Select:
# - Firestore: Configure security rules and indexes files
# - Storage: Configure security rules file
# - Hosting: Configure files for Firebase Hosting (optional)

# Choose existing project: brass-libs
```

## Test Your Setup

1. **Test Authentication**: Try logging in with your app
2. **Test Firestore**: Check if user data is being saved
3. **Test Storage**: Try uploading an image (admin/staff only)

## Environment Variables

Make sure your `.env` file has:
```
VITE_FIREBASE_API_KEY=AIzaSyDJDgPtpP4ZO5_ZulUDQFmr99DWltywmn4
VITE_FIREBASE_AUTH_DOMAIN=brass-libs.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=brass-libs
VITE_FIREBASE_STORAGE_BUCKET=brass-libs.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=492704979776
VITE_FIREBASE_APP_ID=1:492704979776:web:5ac844ae6bfa8d564eb8a5
```

## Troubleshooting

### Common Issues:
1. **Permission Denied**: Make sure security rules are deployed
2. **CORS Issues**: Run `apply-cors.bat` after setting up Storage
3. **Authentication Issues**: Check if user roles are properly set

### Useful Commands:
```bash
# Check Firebase projects
firebase projects:list

# Check current project
firebase use

# Switch project
firebase use brass-libs

# Deploy specific service
firebase deploy --only firestore
firebase deploy --only storage
firebase deploy --only hosting
```

## Next Steps

1. Enable required Firebase services ✅
2. Deploy security rules ✅
3. Test authentication ✅
4. Upload some sample images (admin account)
5. Test the complete workflow

Your Firebase configuration is now updated to use the new `brass-libs` project!