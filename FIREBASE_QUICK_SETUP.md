# 🔥 Firebase Quick Setup - Step by Step

## ⚠️ Current Issue
Your `.env.local` file has **placeholder values** (like "your-firebase-api-key-here"). These need to be replaced with **actual Firebase configuration values**.

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Create/Select Firebase Project

1. **Go to Firebase Console:**
   - Open: https://console.firebase.google.com/
   - Sign in with your Google account

2. **Create New Project (or select existing):**
   - Click **"Add project"** (or select existing)
   - Enter project name: `rat-lab` (or any name)
   - Click **Continue**
   - Disable Google Analytics (optional)
   - Click **Create project**
   - Wait for project creation (30 seconds)

### Step 2: Register Web App

1. **In Firebase Console:**
   - Click the **Web icon** (`</>`) or **"Add app"** → **Web**
   - App nickname: `Rat Lab`
   - **Don't check** "Also set up Firebase Hosting"
   - Click **Register app**

2. **Copy Configuration:**
   - You'll see a config object like this:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789012",
     appId: "1:123456789012:web:abcdef123456"
   };
   ```
   - **Copy these values** (you'll need them in Step 3)

### Step 3: Enable Authentication

1. **Go to Authentication:**
   - In Firebase Console, click **Authentication** (left sidebar)
   - Click **Get started** (if first time)
   - Click **Sign-in method** tab

2. **Enable Google Provider:**
   - Click **Google**
   - Toggle **Enable**
   - Enter support email (your email)
   - Click **Save**

3. **Add Authorized Domain:**
   - Still in Authentication → **Settings** tab
   - Scroll to **Authorized domains**
   - Click **Add domain**
   - Enter: `localhost`
   - Click **Add**

### Step 4: Enable Firestore

1. **Go to Firestore Database:**
   - Click **Firestore Database** (left sidebar)
   - Click **Create database**
   - Select **Start in production mode**
   - Choose location (closest to you)
   - Click **Enable**

### Step 5: Update .env.local

1. **Open `.env.local` file** in your project root

2. **Replace placeholder values** with your actual Firebase config:

   ```bash
   # Replace these with YOUR actual values from Step 2:
   VITE_FIREBASE_API_KEY=AIzaSy...your-actual-key-from-firebase
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
   VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
   
   # Keep this as false:
   VITE_DEMO_MODE=false
   ```

3. **Save the file**

### Step 6: Restart Server

```bash
# Stop the current server (Ctrl+C in terminal)
# Then restart:
npm run dev
```

### Step 7: Test

1. Open http://localhost:3000/
2. Click **"Continue with Google"**
3. Should work! ✅

---

## 🔍 Verification

After adding config, check browser console (F12):
- ✅ Should see: `✅ Firebase initialized successfully`
- ✅ Should see: `✅ Firebase Auth initialized`
- ✅ Should see: `✅ Firestore initialized`

If you see errors, they'll tell you exactly what's wrong.

---

## ❌ Common Issues

### "Firebase Auth is not initialized"
- **Cause:** Placeholder values still in `.env.local`
- **Fix:** Replace ALL placeholder values with real Firebase config

### "Unauthorized domain"
- **Cause:** `localhost` not added to authorized domains
- **Fix:** Firebase Console → Authentication → Settings → Add `localhost`

### "Invalid API key"
- **Cause:** Wrong API key copied
- **Fix:** Double-check API key from Firebase Console

### "Project not found"
- **Cause:** Wrong project ID
- **Fix:** Verify project ID matches Firebase Console

---

## 📸 Visual Guide

**Where to find config:**
```
Firebase Console
  → Your Project
    → ⚙️ Project Settings
      → General tab
        → Scroll to "Your apps"
          → Web app (</>)
            → Config object (copy values)
```

**Where to enable Auth:**
```
Firebase Console
  → Authentication
    → Sign-in method
      → Google → Enable
    → Settings
      → Authorized domains → Add "localhost"
```

---

## 🆘 Still Having Issues?

1. **Check `.env.local`:**
   - Open file
   - Verify NO placeholder values remain
   - All 6 Firebase variables should have real values

2. **Check Browser Console:**
   - Press F12
   - Look for Firebase errors
   - Copy error message

3. **Verify Firebase Project:**
   - Go to Firebase Console
   - Confirm project exists
   - Confirm Authentication is enabled
   - Confirm Firestore is created

4. **Restart Everything:**
   ```bash
   # Stop server
   # Clear browser cache (Cmd+Shift+R)
   # Restart server
   npm run dev
   ```

---

## ✅ Success Checklist

- [ ] Firebase project created
- [ ] Web app registered
- [ ] Config values copied
- [ ] `.env.local` updated with real values
- [ ] Google authentication enabled
- [ ] `localhost` added to authorized domains
- [ ] Firestore database created
- [ ] Server restarted
- [ ] Browser console shows "Firebase initialized successfully"
- [ ] Google sign-in works

---

**Need help?** Check `FIREBASE_SETUP_GUIDE.md` for more details.

