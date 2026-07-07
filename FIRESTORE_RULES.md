# Firestore Security Rules

## Current Issue
If you're not seeing data in Firebase dashboard after sign-in, it's likely due to Firestore security rules blocking read/write access.

## Required Firestore Rules

Go to Firebase Console → Firestore Database → Rules and set:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow authenticated users to read/write their own user document
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Testing Rules

1. **Go to Firebase Console:** https://console.firebase.google.com
2. **Select your project:** ba780ads
3. **Navigate to:** Firestore Database → Rules
4. **Paste the rules above**
5. **Click "Publish"**

## Alternative: Test Mode (Development Only)

For testing during development, you can use:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

⚠️ **Warning:** This allows any authenticated user to read/write any document. Only use for development!

## Verify Rules Are Active

After updating rules:
1. Check browser console for Firestore permission errors
2. Look for error codes: `permission-denied`, `missing-permissions`
3. Test sign-in again and check console logs

## Common Error Codes

- `permission-denied`: Firestore rules are blocking access
- `unauthenticated`: User is not authenticated
- `not-found`: Document doesn't exist (this is OK for new users)

