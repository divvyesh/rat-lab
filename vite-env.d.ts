/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENAI_API_KEY: string
  readonly VITE_FIREBASE_API_KEY: string
  readonly VITE_FIREBASE_AUTH_DOMAIN: string
  readonly VITE_FIREBASE_PROJECT_ID: string
  readonly VITE_FIREBASE_STORAGE_BUCKET: string
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string
  readonly VITE_FIREBASE_APP_ID: string
  readonly VITE_FIREBASE_MEASUREMENT_ID: string
  readonly VITE_MODEL_PERSONA: string
  readonly VITE_MODEL_SURVEY: string
  readonly VITE_MODEL_ANALYSIS: string
  readonly VITE_MODEL_COPILOT: string
  readonly VITE_MODEL_VISION: string
  readonly VITE_MODEL_TTS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

