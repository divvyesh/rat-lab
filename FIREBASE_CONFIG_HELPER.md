# 🔥 Firebase Configuration Helper

## Step-by-Step: Get Your Firebase Config

### Step 1: Go to Firebase Console
**Open:** https://console.firebase.google.com/

### Step 2: Create or Select Project
- If you don't have a project: Click **"Add project"**
  - Name it: `rat-lab` (or any name)
  - Click Continue → Continue → Create project
  - Wait 30 seconds for creation

- If you have a project: Select it from the list

### Step 3: Register Web App
1. In Firebase Console, click the **Web icon** (`</>`) or **"Add app"** → **Web**
2. App nickname: `Rat Lab`
3. **Don't check** "Also set up Firebase Hosting"
4. Click **Register app**

### Step 4: Copy Config Values
You'll see a code block like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project-12345.firebaseapp.com",
  projectId: "your-project-12345",
  storageBucket: "your-project-12345.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

**Copy these 6 values** - you'll need them!

### Step 5: Enable Authentication
1. Click **Authentication** (left sidebar)
2. Click **Get started** (if first time)
3. Go to **Sign-in method** tab
4. Click **Google**
5. Toggle **Enable**
6. Enter your support email
7. Click **Save**

### Step 6: Add Authorized Domain
1. Still in Authentication → **Settings** tab
2. Scroll to **Authorized domains**
3. Click **Add domain**
4. Enter: `localhost`
5. Click **Add**

### Step 7: Enable Firestore
1. Click **Firestore Database** (left sidebar)
2. Click **Create database**
3. Select **Start in production mode**
4. Choose location (closest to you)
5. Click **Enable**

### Step 8: Update .env.local

Open `.env.local` and replace with YOUR values:

```bash
VITE_FIREBASE_API_KEY=AIzaSy...your-actual-key-from-step-4
VITE_FIREBASE_AUTH_DOMAIN=your-project-12345.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-12345
VITE_FIREBASE_STORAGE_BUCKET=your-project-12345.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
VITE_DEMO_MODE=false
```

### Step 9: Restart Server
```bash
# Stop server (Ctrl+C)
npm run dev
```

### Step 10: Test
1. Open http://localhost:3000/
2. Click "Continue with Google"
3. Should work! ✅

---

## 🆘 Need Help?

**Can't find the config?**
- Firebase Console → ⚙️ → Project Settings → General → Scroll to "Your apps" → Web app

**Getting errors?**
- Check browser console (F12) for specific error
- Verify all 6 values are correct
- Make sure no placeholder text remains
- Verify `localhost` is in authorized domains

**Still not working?**
- Share the error message from browser console
- Verify Firebase project is active
- Check Authentication is enabled

