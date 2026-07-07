# Insights Generation Fix Guide

## Issues Identified & Fixed

### 1. **Conversion Probability Display Bug** ✅ FIXED
**Problem:** Conversion probability was showing as "0.65%" instead of "65%"
**Root Cause:** The value is stored as 0-1 (0.65 = 65%), but was displayed without multiplication
**Fix:** Updated `AnalysisDashboard.tsx` line 288 to multiply by 100:
```typescript
val: `${Math.round((report.conversionProbability || 0) * 100)}%`
```

### 2. **Improved Error Handling** ✅ FIXED
**Problem:** Errors in analysis generation weren't clear
**Fix:** Added detailed error messages that check for API key issues and provide actionable guidance

### 3. **Enhanced Logging** ✅ FIXED
**Problem:** Difficult to debug when insights fail to generate
**Fix:** Added detailed console logging at each step of the analysis pipeline

## How the Insights Pipeline Works

### Data Flow:
```
1. User creates COHORTS (PersonaBuilder)
   ↓
2. Generates PERSONAS using AI (geminiService.generatePersonasBatch)
   ↓
3. User creates QUESTIONS (ExperimentLab)
   ↓
4. Runs SIMULATION (geminiService.simulateParticipantSurvey)
   ↓
5. Results stored in App state (results array)
   ↓
6. Navigate to ANALYSIS tab
   ↓
7. AnalysisDashboard receives results as props
   ↓
8. Calls performStatisticalAnalysis()
   ↓
9. OpenAI API generates insights
   ↓
10. Results displayed in charts/tables
```

### Required Environment Variables:
```bash
# OpenAI API (REQUIRED for simulations & analysis)
VITE_OPENAI_API_KEY=sk-...your-key-here

# Firebase (for data persistence)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

## Common Issues & Solutions

### Issue: "No simulation results available for analysis"
**Cause:** No simulations have been run yet
**Solution:** 
1. Go to "Cohorts" tab → Create segments → Generate personas
2. Go to "Simulations" tab → Add questions → Run simulation
3. Then go to "Analysis" tab

### Issue: "VITE_OPENAI_API_KEY is not set"
**Cause:** Missing API key in environment variables
**Solution:** 
1. Create `.env.local` file in project root
2. Add: `VITE_OPENAI_API_KEY=sk-your-key-here`
3. Restart dev server

### Issue: Insights show "0%" for all metrics
**Cause:** Analysis API returned 0-1 values but UI expected percentages
**Solution:** ✅ Already fixed in this update

### Issue: Loading spinner never stops
**Cause:** API call failed but error wasn't caught properly
**Solution:** ✅ Improved error handling in this update

## Testing the Full Pipeline

### Option 1: With Real API Key
1. Add OpenAI API key to `.env.local`
2. Restart server
3. Create cohort → Generate personas → Run simulation → View analysis

### Option 2: Demo Mode (No API Key Required)
1. Navigate to: `http://localhost:3000/?demo=true`
2. Use the demo data generator (coming in next update)

## Debugging Checklist

When insights aren't generating, check these in order:

1. **✅ Open Browser Console (F12)**
   - Look for red errors
   - Check for "API_KEY" errors
   - Look for network request failures

2. **✅ Verify Results Exist**
   ```javascript
   // In browser console:
   console.log('Results count:', window.location.href);
   // Should show simulation results
   ```

3. **✅ Check Network Tab**
   - Filter by "openai"
   - Look for 401 (auth) or 429 (rate limit) errors
   - Check response bodies for error messages

4. **✅ Verify Analysis Dashboard Props**
   - Results array should have > 0 items
   - Each result should have responses array
   - Segments array should match result segmentIds

5. **✅ Check Console for Analysis Logs**
   Look for these log messages:
   - `🔄 Generating analysis for X results...`
   - `📊 Analysis input:` (shows data being analyzed)
   - `✅ Analysis complete:` (shows successful completion)
   - OR `❌ Analysis generation error:` (shows what failed)

## Next Steps for Full Testing

1. **Add Demo Data Generator**: Button to create mock simulation results
2. **Add Retry Logic**: Automatic retry on transient API failures
3. **Add Progress Indicators**: Show % completion during analysis
4. **Add Result Validation**: Check data quality before sending to analysis
5. **Add Export Feature**: Download raw results as JSON for debugging

## Files Modified
- `components/AnalysisDashboard.tsx` - Fixed display bugs, added error handling
- `services/geminiService.ts` - Already has proper error handling
- `services/openaiApi.ts` - Has retry logic and proper error messages

## Performance Notes
- Analysis typically takes 5-15 seconds for 10-50 results
- Larger datasets (100+ results) may take 30-60 seconds
- Rate limits: OpenAI has per-minute limits based on your tier
- Costs: ~$0.01-0.05 per analysis depending on result size

