# Firebase Connection Diagnostic Guide

## Issue: No Changes After Sign-In / No Data in Firebase Dashboard

### Step 1: Check Browser Console

1. **Open the app:** http://localhost:3000
2. **Open Developer Console:** Press F12 (or Cmd+Option+I on Mac)
3. **Click "Continue with Google"**
4. **Watch for these logs:**

#### Expected Logs (Success):
```
🔐 Starting Google sign-in...
Firebase Auth status: { initialized: true, currentUser: 'none', projectId: 'ba780ads' }
✅ Google sign-in successful { uid: '...', email: '...' }
✅ Mapped to app user { id: '...', name: '...' }
🔐 handleLogin called { id: '...', name: '...' }
🔄 Hydrating user { id: '...', name: '...' }
📥 Loading user data from Firestore { userId: '...' }
ℹ️ No user data found in Firestore, returning empty state
💾 Creating initial user document in Firestore
💾 Saving user data to Firestore { userId: '...' }
✅ User data saved successfully to Firestore
✅ Hydration complete, user ready
```

#### Error Logs to Watch For:

**Firestore Permission Error:**
```
❌ Cloud save failed
Error details: { code: 'permission-denied', message: '...' }
```
**→ Solution:** Update Firestore security rules (see Step 2)

**Firebase Not Initialized:**
```
❌ Firebase auth or db not initialized
```
**→ Solution:** Check .env.local file has correct Firebase config

**Authentication Error:**
```
❌ Google sign-in error
Error details: { code: 'auth/...', message: '...' }
```
**→ Solution:** Check Firebase Authentication is enabled in Firebase Console

---

### Step 2: Check Firestore Security Rules

**Most Common Issue:** Firestore rules are blocking read/write access.

1. **Go to Firebase Console:** https://console.firebase.google.com
2. **Select Project:** ba780ads
3. **Navigate to:** Firestore Database → Rules
4. **Check Current Rules:**

#### Required Rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

5. **If rules are different, update them and click "Publish"**

#### Test Mode (Development Only):
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

---

### Step 3: Verify Firebase Configuration

1. **Check .env.local file exists** in project root
2. **Verify all Firebase variables are set:**
   - VITE_FIREBASE_API_KEY
   - VITE_FIREBASE_AUTH_DOMAIN
   - VITE_FIREBASE_PROJECT_ID
   - VITE_FIREBASE_STORAGE_BUCKET
   - VITE_FIREBASE_MESSAGING_SENDER_ID
   - VITE_FIREBASE_APP_ID
   - VITE_FIREBASE_MEASUREMENT_ID

3. **Restart dev server** after changing .env.local:
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

---

### Step 4: Check Firebase Console

1. **Go to Firebase Console:** https://console.firebase.google.com
2. **Select Project:** ba780ads
3. **Check Authentication:**
   - Go to: Authentication → Users
   - You should see your Google account after sign-in
   - If not, authentication isn't working

4. **Check Firestore:**
   - Go to: Firestore Database → Data
   - Look for collection: `users`
   - Look for document with your user ID
   - If collection doesn't exist, Firestore rules might be blocking writes

---

### Step 5: Test Firestore Connection

After sign-in, check console for:

**If you see:**
```
✅ User data saved successfully to Firestore
```
**→ Firestore is working!** Check Firebase Console → Firestore → Data

**If you see:**
```
❌ Cloud save failed
Error details: { code: 'permission-denied' }
```
**→ Update Firestore rules (Step 2)**

**If you see:**
```
❌ Cloud save failed
Error details: { code: 'unauthenticated' }
```
**→ Authentication isn't working, check Firebase Auth setup**

---

### Step 6: Verify Authentication is Enabled

1. **Firebase Console:** https://console.firebase.google.com
2. **Select Project:** ba780ads
3. **Go to:** Authentication → Sign-in method
4. **Verify:**
   - ✅ Google sign-in is enabled
   - ✅ Authorized domains includes `localhost`
   - ✅ Email/Password is enabled (if using email login)

---

## Quick Fix Checklist

- [ ] Firestore rules allow authenticated users to read/write their own data
- [ ] Firebase Authentication → Google sign-in is enabled
- [ ] Authorized domains includes `localhost`
- [ ] .env.local has all Firebase config values
- [ ] Dev server restarted after .env.local changes
- [ ] Browser console shows no permission errors
- [ ] User appears in Firebase Console → Authentication → Users

---

## Still Not Working?

1. **Check browser console** for specific error codes
2. **Check Firebase Console** → Firestore → Rules for permission errors
3. **Verify** user appears in Authentication → Users
4. **Try** creating a test document manually in Firestore Console

---

**Last Updated:** December 2025

