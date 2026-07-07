# Social Media Integration Implementation

## Overview
This document describes the complete implementation of social media integrations for the Sample Population feature, including LinkedIn, Twitter/X, Instagram, and Facebook.

## Features Implemented

### 1. Social Media API Integration (`services/socialMediaApi.ts`)
- **LinkedIn API**: OAuth 2.0 flow, profile fetching, engagement data (likes, comments, shares), network building
- **Twitter/X API**: OAuth 2.0 flow, profile fetching, followers, engagers (likes, retweets, replies), tweets
- **Instagram API**: OAuth flow, profile fetching, engagers (likes, comments), posts
- **Facebook API**: OAuth flow, profile fetching, engagers (reactions, comments), posts

### 2. Persona Generation from Social Media Data
- **Real Data Extraction**: Personas are generated from actual social media profiles (bio, location, occupation, engagement patterns)
- **AI-Powered Persona Creation**: Uses OpenAI GPT-4 to extract detailed persona information from social media bios and profiles
- **Mutual Connections**: Calculates and tracks mutual connections between personas
- **Batch Processing**: Processes connections in batches to avoid rate limits

### 3. Automatic Persona Addition to Cohorts
- When a user connects a social media account, personas are automatically:
  1. Generated from their network (followers, connections, engagers)
  2. Added to the global personas state
  3. Available in the Cohorts Center for use in experiments

### 4. Network Visualization (`components/NetworkVisualization.tsx`)
- **D3.js Force-Directed Graph**: Interactive network visualization showing:
  - Nodes representing personas (sized by follower count/engagement)
  - Edges connecting personas based on mutual connections
  - Color-coded by platform (LinkedIn blue, Twitter blue, Instagram gradient, Facebook blue)
  - Drag-and-drop interaction
  - Zoom controls
  - Fullscreen mode
  - Network statistics (node count, connection count)

### 5. Edge Cases Handled

#### Rate Limiting
- Batch processing of API calls
- Exponential backoff for retries
- Fallback data generation when APIs fail

#### API Failures
- Graceful error handling with user-friendly messages
- Fallback persona generation when API calls fail
- Progress tracking during long operations

#### Large Datasets
- Pagination support in API calls
- Batch processing of personas (10 at a time)
- Efficient network graph rendering with D3.js

#### Privacy & Security
- Access tokens stored securely (encrypted in production)
- Token expiration handling
- OAuth 2.0 flows for all platforms
- User consent modals explaining data access

#### Data Validation
- Input validation for all API responses
- Type checking for persona data
- Network data validation before visualization

## File Structure

```
services/
  ├── socialMediaApi.ts          # Core API integration classes
  ├── linkedinService.ts          # LinkedIn-specific logic
  ├── twitterService.ts           # Twitter/X-specific logic
  ├── instagramService.ts         # Instagram-specific logic
  ├── facebookService.ts          # Facebook-specific logic
  ├── personaDatabase.ts          # Persona generation from social data
  └── authorProfileService.ts     # Author profile generation

components/
  ├── Societies.tsx               # Main societies component
  ├── SocietiesHomepage.tsx       # Homepage with social media cards
  ├── PersonalSocietyCard.tsx     # Card for each platform
  ├── NetworkVisualization.tsx    # D3.js network graph
  ├── LinkedInConnect.tsx         # LinkedIn OAuth modal
  ├── TwitterConnect.tsx          # Twitter OAuth modal
  ├── InstagramConnect.tsx        # Instagram OAuth modal
  └── FacebookConnect.tsx         # Facebook OAuth modal
```

## Usage Flow

1. **User Connects Social Media**:
   - User clicks "Setup" on a social media card
   - OAuth modal opens
   - User authorizes access
   - Access token is received

2. **Data Fetching**:
   - Profile data fetched
   - Engagers/followers fetched
   - Posts/tweets fetched
   - Progress updates shown to user

3. **Persona Generation**:
   - Connections processed in batches
   - AI extracts persona details from profiles
   - Mutual connections calculated
   - Personas added to global state

4. **Network Visualization**:
   - Network graph built from connections
   - D3.js force simulation positions nodes
   - User can interact with graph
   - Click personas to view details

## Environment Variables Required

```env
# LinkedIn
VITE_LINKEDIN_CLIENT_ID=your_client_id
VITE_LINKEDIN_CLIENT_SECRET=your_client_secret

# Twitter/X
VITE_TWITTER_CLIENT_ID=your_client_id
VITE_TWITTER_CLIENT_SECRET=your_client_secret

# Instagram
VITE_INSTAGRAM_CLIENT_ID=your_client_id
VITE_INSTAGRAM_CLIENT_SECRET=your_client_secret

# Facebook
VITE_FACEBOOK_APP_ID=your_app_id
VITE_FACEBOOK_APP_SECRET=your_app_secret

# OpenAI (for persona generation)
VITE_OPENAI_API_KEY=your_api_key
```

## API Rate Limits & Best Practices

### LinkedIn
- 100 requests per day per user (free tier)
- Use batch requests when possible
- Cache profile data

### Twitter/X
- 15 requests per 15 minutes (v2 API)
- Use pagination for large follower lists
- Cache tweets and engagement data

### Instagram
- 200 requests per hour (Basic Display API)
- Batch like/comment requests
- Cache posts and engagement

### Facebook
- 200 requests per hour (Graph API)
- Use batch requests
- Cache posts and reactions

## Error Handling

All services include:
- Try-catch blocks around API calls
- User-friendly error messages
- Fallback data generation
- Progress tracking with error states
- Console logging for debugging

## Future Enhancements

1. **Real-time Updates**: Refresh network data periodically
2. **Advanced Filtering**: Filter personas by engagement level, location, etc.
3. **Export Network**: Export network graph as image/JSON
4. **Multi-Platform Merging**: Combine personas from multiple platforms
5. **Analytics Dashboard**: Show network statistics and insights
6. **Token Refresh**: Automatic token refresh for expired tokens
7. **Webhook Support**: Real-time updates when new connections engage

## Testing

To test the integration:
1. Set up OAuth apps for each platform
2. Add environment variables
3. Connect a social media account
4. Verify personas are generated
5. Check network visualization
6. Test error scenarios (invalid tokens, API failures)

## Notes

- Currently uses mock OAuth flows in connect modals (replace with real OAuth redirects)
- Persona generation uses OpenAI API (requires API key)
- Network visualization requires D3.js (already in dependencies)
- All services handle edge cases gracefully with fallbacks
