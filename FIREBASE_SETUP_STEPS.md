# Firebase Setup - Step by Step Guide

## ⚠️ Important: You Need FIRESTORE Rules, Not Storage Rules

The image shows **Storage Rules**, but you need **Firestore Database Rules** for the app to work.

---

## Step 1: Navigate to Firestore Database Rules

1. **Go to Firebase Console:** https://console.firebase.google.com
2. **Select your project:** ba780ads
3. **In the left sidebar, click:** "Firestore Database" (NOT "Storage")
4. **Click the "Rules" tab** at the top

You should see a code editor with Firestore rules (not Storage rules).

---

## Step 2: Input These Firestore Rules

**Copy and paste this into the Firestore Rules editor:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## Step 3: Publish the Rules

1. **Click the "Publish" button** at the top of the rules editor
2. **Wait for confirmation** that rules are published
3. **Rules are now active!**

---

## Step 4: Test the App

1. **Go back to your app:** http://localhost:3000
2. **Open browser console** (F12)
3. **Click "Continue with Google"**
4. **Watch console logs** - you should see:
   - `✅ User data saved successfully to Firestore`
   - No `permission-denied` errors

5. **Check Firebase Console:**
   - Go to: Firestore Database → Data
   - You should see a `users` collection
   - Click on it to see your user document

---

## Visual Guide

### Correct Location:
```
Firebase Console
├── Project: ba780ads
├── Build (left sidebar)
│   ├── Firestore Database ← CLICK THIS
│   │   ├── Data tab
│   │   └── Rules tab ← CLICK THIS (NOT Storage Rules)
│   └── Storage ← DON'T USE THIS
```

### What You Should See:
- Title: "Firestore Database"
- Tabs: "Data", "Rules", "Indexes", "Usage"
- Rules editor with `service cloud.firestore { ... }`

### What You're Currently Seeing (Wrong):
- Title: "Storage"
- Tabs: "Files", "Rules", "Usage", "Extensions"
- Rules editor with `service firebase.storage { ... }`

---

## Quick Checklist

- [ ] Navigated to **Firestore Database** (not Storage)
- [ ] Clicked **Rules** tab
- [ ] Pasted Firestore rules (not Storage rules)
- [ ] Clicked **Publish**
- [ ] Tested sign-in in app
- [ ] Checked console for success logs
- [ ] Verified data appears in Firestore Database → Data

---

## Still Having Issues?

If you can't find Firestore Database:
1. Make sure Firestore is enabled in your project
2. Go to: Firebase Console → Project Overview → Build → Firestore Database
3. If you see "Get Started", click it to enable Firestore

---

**Last Updated:** December 2025

