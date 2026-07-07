# RAT LAB - Behavioral Inference Engine

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

A production-ready research sandbox for simulating behavioral agents, running surveys, and performing statistical analysis using Google Gemini API and Firebase.

## Features

- **AI-Powered Persona Generation**: Create realistic behavioral agents grounded in market research
- **Survey Simulation Engine**: Run isolated simulations with AI personas
- **Statistical Analysis**: Advanced GTM analysis with hypothesis testing and regression
- **Research Copilot**: AI assistant for study design and analysis
- **Asset Analysis**: Image analysis for conversion triggers and psychological hooks
- **Cloud Sync**: Firebase-powered data persistence and user authentication

## Prerequisites

- Node.js (v18 or higher)
- Google Gemini API key ([Get one here](https://aistudio.google.com/apikey))
- Firebase project ([Create one here](https://console.firebase.google.com/))

## Setup Instructions

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd rat-lab
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory (copy from `.env.example` if available):

```bash
# Google Gemini API Configuration
# Get your API key from: https://aistudio.google.com/apikey
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Firebase Configuration
# Get these values from Firebase Console > Project Settings > General > Your apps
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Model Configuration (Optional - defaults provided)
# Available models: gemini-1.5-pro, gemini-1.5-flash, gemini-2.0-flash-exp
VITE_MODEL_PERSONA=gemini-1.5-pro
VITE_MODEL_SURVEY=gemini-1.5-pro
VITE_MODEL_ANALYSIS=gemini-1.5-pro
VITE_MODEL_COPILOT=gemini-1.5-pro
VITE_MODEL_VISION=gemini-1.5-flash
VITE_MODEL_TTS=gemini-2.0-flash-exp
```

### 3. Firebase Setup

1. **Create a Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Add project" and follow the setup wizard
   - Enable **Authentication** and **Firestore Database**

2. **Configure Authentication**:
   - In Firebase Console, go to **Authentication** > **Sign-in method**
   - Enable **Google** sign-in provider
   - Enable **Email/Password** sign-in provider
   - Add your domain to authorized domains (for production)

3. **Set up Firestore**:
   - Go to **Firestore Database** > **Create database**
   - Start in **production mode** (or test mode for development)
   - Set up security rules (see below)

4. **Get Firebase Config**:
   - Go to **Project Settings** > **General**
   - Scroll to "Your apps" section
   - Click the web icon (`</>`) to add a web app
   - Copy the config values to your `.env.local` file

5. **Firestore Security Rules** (for development):
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

### 4. Run the Application

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Model Configuration

You can customize which Gemini models are used for different features via environment variables:

- `VITE_MODEL_PERSONA`: Model for persona generation (default: `gemini-1.5-pro`)
- `VITE_MODEL_SURVEY`: Model for survey simulations (default: `gemini-1.5-pro`)
- `VITE_MODEL_ANALYSIS`: Model for statistical analysis (default: `gemini-1.5-pro`)
- `VITE_MODEL_COPILOT`: Model for copilot chat (default: `gemini-1.5-pro`)
- `VITE_MODEL_VISION`: Model for image analysis (default: `gemini-1.5-flash`)
- `VITE_MODEL_TTS`: Model for text-to-speech (default: `gemini-2.0-flash-exp`)

Available models:
- `gemini-1.5-pro`: Best for complex reasoning tasks
- `gemini-1.5-flash`: Faster, cost-effective for simpler tasks
- `gemini-2.0-flash-exp`: Experimental models with latest features

## Deployment

### Environment Variables

When deploying, ensure all environment variables are set in your hosting platform:

- **Vercel**: Add variables in Project Settings > Environment Variables
- **Netlify**: Add variables in Site Settings > Environment Variables
- **Other platforms**: Follow their documentation for environment variable configuration

### Firebase Domain Authorization

For production deployment:
1. Go to Firebase Console > Authentication > Settings
2. Add your production domain to "Authorized domains"
3. This allows Firebase auth to work on your deployed site

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Architecture

- **Frontend**: React + TypeScript + Vite
- **AI API**: Direct REST calls to Google Gemini API (no SDK dependency)
- **Backend**: Firebase (Authentication + Firestore)
- **State Management**: React hooks with auto-save to Firestore

## Troubleshooting

### "Missing required Firebase environment variables" error

Ensure all `VITE_FIREBASE_*` variables are set in your `.env.local` file. Check that variable names match exactly (case-sensitive).

### "VITE_GEMINI_API_KEY is not set" error

Add your Gemini API key to `.env.local` as `VITE_GEMINI_API_KEY=your_key_here`

### Firebase Authentication not working

1. Verify your Firebase config values are correct
2. Check that your domain is authorized in Firebase Console
3. Ensure Authentication is enabled in Firebase Console
4. Check browser console for specific error messages

### API Rate Limiting

If you encounter rate limit errors:
- Reduce the number of personas per segment
- Use faster models (`gemini-1.5-flash`) for less critical operations
- Implement request queuing/throttling if needed

## License

[Your License Here]

## Support

For issues and questions, please open an issue on GitHub.
