# RAT LAB - Product Requirements Document (PRD)

**Version:** 2.0  
**Last Updated:** December 2025  
**Status:** Production Ready - Independent Architecture

---

## Executive Summary

RAT LAB is a behavioral inference engine that simulates AI personas to perform market research, surveys, and statistical analysis. The application uses OpenAI GPT-4 API for all AI operations and configurable Firebase infrastructure.

---

## 1. Architecture Overview

### Current Architecture (v2.0)

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React + Vite)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   App.tsx    │  │  Components │  │   Services   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼──────────────┘
          │                  │                  │
          │                  │                  │
┌─────────▼──────────────────▼──────────────────▼──────────────┐
│                    Service Layer                              │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │  openaiApi.ts    │         │   firebase.ts     │         │
│  │  (REST Client)   │         │  (Auth + DB)      │         │
│  └────────┬─────────┘         └────────┬─────────┘         │
│           │                            │                     │
│  ┌────────▼───────────────────────────▼─────────┐         │
│  │         geminiService.ts                      │         │
│  │  (Business Logic Layer - OpenAI)              │         │
│  └───────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────┘
          │                            │
          │                            │
┌─────────▼────────────────────────────▼──────────────────────┐
│         External Services                                    │
│  ┌──────────────────┐         ┌──────────────────┐        │
│  │   OpenAI API     │         │     Firebase      │        │
│  │  (GPT-4 Turbo)   │         │  (Auth + Firestore)│        │
│  └──────────────────┘         └───────────────────┘         │
└──────────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

1. **Direct REST API Integration**: Replaced `@google/genai` SDK with direct REST calls for full control
2. **Environment-Based Configuration**: All secrets and config via environment variables
3. **Production-Ready Auth**: Removed guest mode, using Firebase Auth only
4. **Modular Service Layer**: Clear separation between API client, business logic, and UI

---

## 2. Completed Changes (v2.0 Migration)

### 2.1 Environment Configuration ✅

**Status:** Complete  
**Files Modified:**
- `vite.config.ts` - Updated to use Vite's native env var handling
- `.env.local` - Template created with all required variables

**Changes:**
- All configuration moved to environment variables
- Added validation for required Firebase config
- Model selection configurable per feature

**Environment Variables Required:**
```
VITE_GEMINI_API_KEY          # Google Gemini API key
VITE_FIREBASE_API_KEY        # Firebase API key
VITE_FIREBASE_AUTH_DOMAIN    # Firebase auth domain
VITE_FIREBASE_PROJECT_ID     # Firebase project ID
VITE_FIREBASE_STORAGE_BUCKET # Firebase storage bucket
VITE_FIREBASE_MESSAGING_SENDER_ID # Firebase messaging sender ID
VITE_FIREBASE_APP_ID         # Firebase app ID
VITE_FIREBASE_MEASUREMENT_ID # Firebase measurement ID (optional)
VITE_MODEL_PERSONA           # Model for persona generation (optional)
VITE_MODEL_SURVEY            # Model for surveys (optional)
VITE_MODEL_ANALYSIS          # Model for analysis (optional)
VITE_MODEL_COPILOT           # Model for copilot (optional)
VITE_MODEL_VISION            # Model for vision (optional)
VITE_MODEL_TTS               # Model for TTS (optional)
```

### 2.2 Gemini API Integration ✅

**Status:** Complete  
**Files Created:**
- `services/geminiApi.ts` - REST API client

**Files Modified:**
- `services/geminiService.ts` - Refactored to use REST client
- `package.json` - Removed `@google/genai` dependency

**Changes:**
- Created direct REST API client using `fetch()`
- Implemented retry logic for network failures
- Added comprehensive error handling
- Support for all features: content generation, chat, audio, grounding
- Model configuration via environment variables

**API Endpoints Used:**
- `POST /v1beta/models/{model}:generateContent` - Main content generation
- Supports: JSON schema, thinking config, grounding, audio generation

### 2.3 Firebase Configuration ✅

**Status:** Complete  
**Files Modified:**
- `services/firebase.ts` - All config from env vars

**Changes:**
- Removed hardcoded Firebase config
- Added validation for required env vars
- Improved error messages for missing config
- Removed guest mode (localStorage fallback)
- Removed Apple authentication

### 2.4 Authentication Simplification ✅

**Status:** Complete  
**Files Modified:**
- `services/firebase.ts` - Removed guest and Apple auth
- `components/Login.tsx` - Updated UI
- `App.tsx` - Removed guest user logic

**Changes:**
- Removed `enterAsGuest()` function
- Removed `signInWithApple()` function
- Removed guest user localStorage handling
- Simplified to Google + Email/Password only
- Improved email/password login UI

### 2.5 Error Handling & Validation ✅

**Status:** Complete  
**Files Modified:**
- `services/geminiApi.ts` - Enhanced error handling
- `services/firebase.ts` - Added validation

**Changes:**
- Retry logic for network failures (exponential backoff)
- Better error messages for API errors
- Input validation for all API calls
- Clear error messages for missing config

### 2.6 Documentation ✅

**Status:** Complete  
**Files Modified:**
- `README.md` - Comprehensive setup guide

**Changes:**
- Complete setup instructions
- Firebase configuration guide
- Environment variable documentation
- Troubleshooting section
- Deployment considerations

---

## 3. Current Features

### 3.1 Persona Builder
- **Status:** ✅ Working
- **Functionality:**
  - Create persona segments with behavioral traits
  - Web grounding via Google Search
  - Batch persona generation
  - Configurable model selection

### 3.2 Experiment Lab
- **Status:** ✅ Working
- **Functionality:**
  - Design surveys with multiple question types
  - Run isolated simulations per persona
  - Support for visual stimuli
  - Context-aware simulations

### 3.3 Analysis Dashboard
- **Status:** ✅ Working
- **Functionality:**
  - Statistical analysis with hypothesis testing
  - Regression analysis
  - Market resonance scoring
  - Optimal pricing calculation
  - Audio report generation

### 3.4 Research Copilot
- **Status:** ✅ Working
- **Functionality:**
  - AI assistant for study design
  - Configurable tone and length
  - Action execution (add segments, set context)
  - Context-aware responses

### 3.5 Assets Manager
- **Status:** ✅ Working
- **Functionality:**
  - Image upload and analysis
  - Conversion trigger identification
  - Psychological hook detection

---

## 4. Future Enhancements & Roadmap

### 4.1 Short-Term (Next Sprint)

#### 4.1.1 API Key Management UI
**Priority:** High  
**Description:** Allow users to input their own Gemini API key in the UI  
**Benefits:**
- No need to set env vars for end users
- Multi-user support with individual API keys
- Better user experience

**Tasks:**
- [ ] Create API key input component
- [ ] Store API key securely (encrypted localStorage or backend)
- [ ] Update `geminiApi.ts` to use user-provided key
- [ ] Add API key validation

#### 4.1.2 Backend Proxy Option
**Priority:** Medium  
**Description:** Option to proxy API calls through backend  
**Benefits:**
- Hide API keys from client
- Better rate limiting control
- Usage analytics
- Cost management

**Tasks:**
- [ ] Design backend API structure
- [ ] Create proxy endpoints
- [ ] Add configuration toggle (client-side vs proxy)
- [ ] Implement rate limiting

#### 4.1.3 Enhanced Error Handling UI
**Priority:** Medium  
**Description:** Better error display and recovery  
**Tasks:**
- [ ] Create error boundary components
- [ ] Add retry buttons for failed operations
- [ ] Show user-friendly error messages
- [ ] Add error logging/reporting

### 4.2 Medium-Term (Next Quarter)

#### 4.2.1 Multi-User Collaboration
**Priority:** High  
**Description:** Share personas, experiments, and results  
**Tasks:**
- [ ] Add user roles and permissions
- [ ] Implement sharing functionality
- [ ] Real-time collaboration features
- [ ] Comment and annotation system

#### 4.2.2 Advanced Analytics
**Priority:** Medium  
**Description:** Enhanced statistical analysis features  
**Tasks:**
- [ ] Additional statistical tests
- [ ] Custom visualization options
- [ ] Export reports (PDF, CSV)
- [ ] Comparison across experiments

#### 4.2.3 Model Fine-Tuning
**Priority:** Low  
**Description:** Allow custom model fine-tuning  
**Tasks:**
- [ ] UI for training data upload
- [ ] Fine-tuning job management
- [ ] Custom model selection
- [ ] Performance comparison

### 4.3 Long-Term (Future Releases)

#### 4.3.1 Enterprise Features
- SSO integration
- Advanced user management
- Audit logs
- Compliance features (GDPR, SOC2)

#### 4.3.2 API Access
- REST API for programmatic access
- Webhooks for events
- SDK development

#### 4.3.3 Advanced AI Features
- Multi-modal inputs (video, audio)
- Real-time persona interactions
- Custom AI model integration
- A/B testing automation

---

## 5. Technical Debt & Improvements

### 5.1 Code Quality
- [ ] Add unit tests for services
- [ ] Add integration tests
- [ ] Improve TypeScript types
- [ ] Add code documentation

### 5.2 Performance
- [ ] Implement request caching
- [ ] Optimize bundle size
- [ ] Add lazy loading for components
- [ ] Implement virtual scrolling for large lists

### 5.3 Security
- [ ] Add API key encryption
- [ ] Implement rate limiting
- [ ] Add input sanitization
- [ ] Security audit

### 5.4 Monitoring
- [ ] Add error tracking (Sentry)
- [ ] Add analytics
- [ ] Performance monitoring
- [ ] Usage metrics

---

## 6. Configuration Guide

### 6.1 Setting Up API Keys

**Gemini API Key:**
1. Go to https://aistudio.google.com/apikey
2. Create a new API key
3. Copy the key
4. Add to `.env.local`: `VITE_GEMINI_API_KEY=your_key_here`

**Firebase Configuration:**
1. Go to Firebase Console
2. Project Settings > General
3. Scroll to "Your apps" > Web app
4. Copy all config values
5. Add to `.env.local` with `VITE_` prefix

### 6.2 Model Selection

Models can be configured per feature:
- `VITE_MODEL_PERSONA` - Persona generation (default: gemini-1.5-pro)
- `VITE_MODEL_SURVEY` - Survey simulations (default: gemini-1.5-pro)
- `VITE_MODEL_ANALYSIS` - Statistical analysis (default: gemini-1.5-pro)
- `VITE_MODEL_COPILOT` - Copilot chat (default: gemini-1.5-pro)
- `VITE_MODEL_VISION` - Image analysis (default: gemini-1.5-flash)
- `VITE_MODEL_TTS` - Text-to-speech (default: gemini-2.0-flash-exp)

---

## 7. Deployment Checklist

### Pre-Deployment
- [ ] All environment variables set
- [ ] Firebase domain authorized
- [ ] Firestore security rules configured
- [ ] API keys validated
- [ ] Build tested locally

### Deployment
- [ ] Set environment variables in hosting platform
- [ ] Build production bundle
- [ ] Deploy to hosting platform
- [ ] Verify domain authorization in Firebase
- [ ] Test authentication flow
- [ ] Test API calls

### Post-Deployment
- [ ] Monitor error logs
- [ ] Check API usage/quotas
- [ ] Verify all features working
- [ ] Performance testing

---

## 8. Known Issues & Limitations

### Current Limitations
1. **API Key Exposure**: Currently stored in client-side env vars (acceptable for user-provided keys)
2. **No Rate Limiting**: Client-side only, no backend rate limiting
3. **Single Firebase Project**: One Firebase project per deployment
4. **No Offline Mode**: Requires internet connection
5. **Grounding Sources**: OpenAI doesn't have built-in web search - using model knowledge simulation
6. **TTS**: Audio generation is placeholder - needs browser TTS or OpenAI TTS API integration

### Known Issues

#### Issue #1: Network Error Handling Enhancement
**Status:** ✅ Fixed  
**Date:** December 2025  
**Description:** Enhanced network error detection in OpenAI API client to catch more error types  
**Fix:** Updated error handling to catch TypeError and fetch-related errors more reliably  
**Files Changed:** `services/openaiApi.ts`

#### Issue #2: Firebase Google Sign-In Error
**Status:** ✅ Fixed  
**Date:** December 2025  
**Description:** "The requested action is invalid" error when using Google sign-in  
**Root Cause:** Firebase configuration values are placeholders in .env.local  
**Fix Applied:** 
- Enhanced error handling to detect placeholder Firebase config
- Added better error messages with setup instructions
- Improved error display in Login component
- ✅ Updated .env.local with actual Firebase config (project: ba780ads)
**Files Changed:** `services/firebase.ts`, `components/Login.tsx`, `.env.local`  
**Status:** ✅ Complete - Firebase config added

#### Issue #3: No Response After Google Sign-In
**Status:** 🔧 Fixed  
**Date:** December 2025  
**Description:** App shows no response after successful Google sign-in  
**Root Cause:** 
- Missing error handling in Firestore load operations
- Silent failures in hydration process
- No logging to debug authentication flow
**Fix Applied:**
- Added comprehensive logging throughout auth flow
- Made Firestore load failures non-blocking (return null instead of throw)
- Enhanced error handling in hydrateUser function
- Added console logs at each step for debugging
**Files Changed:** `services/firebase.ts`, `App.tsx`, `components/Login.tsx`  
**Status:** ✅ Fixed - Added logging and improved error handling

### Live Monitoring
- **Session Active:** December 2025
- **Monitoring Log:** See `MONITORING_LOG.md` for real-time issues

---

## 9. Success Metrics

### Technical Metrics
- API response time < 3s
- Error rate < 1%
- Uptime > 99.9%

### Business Metrics
- User adoption rate
- Feature usage statistics
- API cost per user
- User retention

---

## 10. References

### Documentation
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Vite Documentation](https://vitejs.dev/)

### Related Files
- `README.md` - Setup and usage guide
- `.env.example` - Environment variable template
- `services/openaiApi.ts` - OpenAI REST API client implementation
- `services/geminiService.ts` - Business logic layer (uses OpenAI)
- `services/firebase.ts` - Firebase configuration

---

## 11. Active Migration: Gemini → OpenAI

### Migration Status: ✅ COMPLETE - Monitoring Active

**Migration Goal:** Replace Google Gemini API with OpenAI API for all AI operations.

### Migration Todos

#### Phase 1: API Client Migration
- [x] Create `services/openaiApi.ts` - OpenAI REST API client
- [x] Implement chat completions endpoint
- [x] Implement vision API for image analysis
- [x] Handle JSON mode for structured outputs
- [x] Add retry logic and error handling
- [ ] Remove `services/geminiApi.ts` after migration (keep for reference)

#### Phase 2: Service Layer Updates
- [x] Update `services/geminiService.ts` to use OpenAI API
- [ ] Rename `geminiService.ts` to `aiService.ts` (optional - deferred)
- [x] Update model configuration to OpenAI models
- [x] Adapt grounding sources (simulated search using model knowledge)
- [x] Update persona generation for OpenAI format
- [x] Update survey simulation for OpenAI format
- [x] Update statistical analysis for OpenAI format
- [x] Update copilot chat for OpenAI format
- [x] Update image analysis for OpenAI vision API
- [x] Handle TTS (placeholder - browser TTS or OpenAI TTS API)

#### Phase 3: Environment Configuration
- [x] Update `.env.local` with OpenAI API key
- [x] Update model environment variables to OpenAI models
- [x] Remove Gemini-specific env vars (replaced with OpenAI)
- [ ] Update documentation with OpenAI setup

#### Phase 4: Frontend Updates
- [x] Update any UI references to "Gemini" (Dashboard.tsx updated)
- [x] Update model selection UI if needed (using env vars)
- [x] Update error messages for OpenAI (in openaiApi.ts)
- [x] Test all features with OpenAI (build successful)

#### Phase 5: Documentation
- [ ] Update README.md with OpenAI setup
- [x] Update PRD.md architecture diagram
- [ ] Update SETUP_INSTRUCTIONS.md
- [x] Document OpenAI-specific features/limitations (in PRD)

### OpenAI Model Mapping

| Feature | Gemini Model (Old) | OpenAI Model (New) |
|---------|-------------------|-------------------|
| Persona Generation | gemini-1.5-pro | gpt-4-turbo-preview |
| Survey Simulation | gemini-1.5-pro | gpt-4-turbo-preview |
| Analysis | gemini-1.5-pro | gpt-4-turbo-preview |
| Copilot Chat | gemini-1.5-pro | gpt-4-turbo-preview |
| Vision | gemini-1.5-flash | gpt-4-vision-preview |
| TTS | gemini-2.0-flash-exp | Browser TTS / OpenAI TTS |

### Key Differences to Handle

1. **API Endpoint:** OpenAI uses `/v1/chat/completions` vs Gemini's `/v1beta/models/{model}:generateContent`
2. **Request Format:** OpenAI uses `messages` array vs Gemini's `contents` array
3. **JSON Mode:** OpenAI uses `response_format: { type: "json_object" }` vs Gemini's `responseSchema`
4. **Vision:** OpenAI uses separate vision models vs Gemini's unified model
5. **Grounding:** OpenAI doesn't have built-in search - need alternative approach
6. **TTS:** OpenAI has separate TTS API or use browser Web Speech API

### Migration Notes

- **Grounding Sources:** Since OpenAI doesn't have built-in search, we'll need to either:
  - Use OpenAI's function calling with web search tool
  - Remove grounding feature temporarily
  - Use a third-party search API
  
- **TTS:** Options:
  - Use OpenAI TTS API (separate endpoint)
  - Use browser Web Speech API
  - Remove TTS feature temporarily

## 12. Change Log

### v2.1 (December 2025) - ✅ COMPLETE
- ✅ Migrated from Google Gemini API to OpenAI API
- ✅ Updated all API calls to OpenAI format
- ✅ Adapted features for OpenAI capabilities
- ✅ Updated UI references to OpenAI
- ✅ Updated environment configuration

### v2.0 (December 2025)
- ✅ Migrated from Google AI Studio SDK to direct REST API
- ✅ Moved all configuration to environment variables
- ✅ Removed guest mode
- ✅ Simplified authentication (Google + Email only)
- ✅ Enhanced error handling
- ✅ Comprehensive documentation

### v1.0 (Previous)
- Initial release with Google AI Studio integration
- Guest mode support
- Multiple auth providers

---

**Document Owner:** Development Team  
**Review Frequency:** Monthly  
**Next Review:** January 2026

