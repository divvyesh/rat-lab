# Quick Setup Instructions

## ⚠️ IMPORTANT: Add Your API Keys

### Step 1: Add Gemini API Key

1. **Get your Gemini API Key:**
   - Go to: https://aistudio.google.com/apikey
   - Sign in with your Google account
   - Click "Create API Key"
   - Copy the generated key

2. **Add to `.env.local`:**
   - Open the file: `/Users/divyeshsai/Downloads/rat-lab (1)/.env.local`
   - Find the line: `VITE_GEMINI_API_KEY=PLACEHOLDER_API_KEY`
   - Replace `PLACEHOLDER_API_KEY` with your actual API key
   - Example: `VITE_GEMINI_API_KEY=AIzaSyAbCdEf1234567890...`

### Step 2: Add Firebase Configuration

1. **Create Firebase Project:**
   - Go to: https://console.firebase.google.com/
   - Click "Add project"
   - Follow the setup wizard
   - Enable **Authentication** and **Firestore Database**

2. **Get Firebase Config:**
   - In Firebase Console, go to: **Project Settings** > **General**
   - Scroll to "Your apps" section
   - Click the web icon (`</>`) to add a web app
   - Register your app (you can use any app nickname)
   - Copy the config values

3. **Update `.env.local`:**
   Replace these placeholders with your actual Firebase values:
   ```
   VITE_FIREBASE_API_KEY=your_actual_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-actual-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_actual_sender_id
   VITE_FIREBASE_APP_ID=your_actual_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_actual_measurement_id
   ```

4. **Enable Authentication Methods:**
   - In Firebase Console, go to: **Authentication** > **Sign-in method**
   - Enable **Google** sign-in provider
   - Enable **Email/Password** sign-in provider
   - Add your domain to authorized domains (for production)

5. **Set up Firestore:**
   - Go to: **Firestore Database** > **Create database**
   - Choose **Production mode** (or Test mode for development)
   - Set up security rules:
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

### Step 3: Restart the Development Server

After updating `.env.local`:
1. Stop the current server (Ctrl+C in terminal)
2. Run: `npm run dev`
3. Open: http://localhost:3000

---

## File Locations

- **Environment Variables:** `/Users/divyeshsai/Downloads/rat-lab (1)/.env.local`
- **PRD Document:** `/Users/divyeshsai/Downloads/rat-lab (1)/PRD.md`
- **Setup Guide:** `/Users/divyeshsai/Downloads/rat-lab (1)/README.md`

---

## Quick Test Checklist

After adding your API keys, verify:

- [ ] Server starts without errors
- [ ] Login page loads correctly
- [ ] Can sign in with Google or Email
- [ ] Can create a persona segment
- [ ] Can generate personas
- [ ] Can run a survey simulation
- [ ] Can view analysis dashboard

---

## Troubleshooting

### "Missing required Firebase environment variables" error
- Check that all `VITE_FIREBASE_*` variables are set in `.env.local`
- Ensure variable names match exactly (case-sensitive)
- Restart the dev server after changes

### "VITE_GEMINI_API_KEY is not set" error
- Verify the key is in `.env.local` as `VITE_GEMINI_API_KEY=your_key`
- Make sure there are no spaces around the `=` sign
- Restart the dev server

### Firebase Authentication not working
- Verify Firebase config values are correct
- Check that your domain is authorized in Firebase Console
- Ensure Authentication is enabled in Firebase Console

---

## Next Steps

1. ✅ Add your Gemini API key to `.env.local`
2. ✅ Add your Firebase config to `.env.local`
3. ✅ Restart the dev server
4. ✅ Test the application
5. 📖 Read `PRD.md` for future enhancements and roadmap

