# Complete Testing Guide

## Pre-Test Checklist

- [x] Server running at http://localhost:3000
- [x] OpenAI API key configured
- [x] Firebase configured
- [x] Browser console open (F12)

## Test Flow

### Test 1: Cohort Generation & Display

1. **Navigate to Cohorts page**
   - Click "New Cohort" or navigate to Cohorts view
   - Should see "COHORT ORCHESTRATION" page

2. **Add a Segment**
   - Fill in "Segment Label" (e.g., "Early Adopters")
   - Set Quantity (e.g., 5)
   - Add description
   - Click "Lock In Segment"
   - ✅ Segment should appear in "Locked In Cohorts" list

3. **Generate Personas**
   - Click "Initiate Batch Generation"
   - ✅ Progress bars should appear
   - ✅ Console should show:
     ```
     🚀 Starting batch generation for 1 segments
     🔄 Generating 5 personas for segment: Early Adopters
     🔵 OpenAI API Request: { model: 'gpt-4-turbo-preview', jsonMode: true }
     🟢 OpenAI API Response received
     ✅ Parsed JSON successfully
     ✅ Found personas array in response object: 5 items
     ✅ Generated 5 personas for Early Adopters
     📊 Total personas after Early Adopters: 5
     ```

4. **Verify Display**
   - ✅ Personas should appear in right panel
   - ✅ LinkedIn-style cards with images
   - ✅ All details visible (name, age, location, bio, tags)
   - ✅ "Active Agents (5)" header shows correct count

### Test 2: Dashboard Updates

1. **Navigate to Overview/Dashboard**
   - Click "Overview" in sidebar
   - ✅ Should see "Total Agents: 5"
   - ✅ Should see "1 segments" (or correct count)
   - ✅ Status message shows correct counts

2. **Verify Metrics**
   - ✅ Total Agents card shows 5
   - ✅ Data Points shows 0 (no simulations yet)
   - ✅ All cards clickable and navigate correctly

### Test 3: Experiment Lab Activation

1. **Navigate to Simulations**
   - Click "Simulations" in sidebar or "Resume Lab" button
   - ✅ Should see "Research Sandbox" page

2. **Verify Persona Availability**
   - ✅ "Launch Simulation" button should show "(5 agents)"
   - ✅ Button should be ENABLED (not grayed out)
   - ✅ Can click button

3. **Run Simulation**
   - Add context (e.g., "You are considering a new product")
   - Add questions
   - Click "Launch Simulation"
   - ✅ Should run simulation for all 5 personas
   - ✅ Results should appear in right panel
   - ✅ Progress bar should show completion

### Test 4: Multiple Cohorts

1. **Add Second Cohort**
   - Go back to Cohorts
   - Add another segment (e.g., "Price Sensitive")
   - Click "Lock In Segment"
   - ✅ Should see 2 segments in list

2. **Generate Both**
   - Click "Initiate Batch Generation"
   - ✅ Should see 2 progress bars
   - ✅ Both should complete
   - ✅ Total personas should be sum of both

3. **Verify Updates**
   - Check Dashboard - should show total count
   - Check Experiment Lab - should show total count
   - ✅ All pages update correctly

### Test 5: State Persistence

1. **Refresh Page**
   - After generating personas, refresh browser (F5)
   - ✅ Personas should still be there
   - ✅ Segments should still be there
   - ✅ Dashboard should show correct counts

2. **Navigate Between Pages**
   - Go to Dashboard → Cohorts → Simulations → Analysis
   - ✅ Personas persist across navigation
   - ✅ Counts remain correct

## Expected Console Logs

### During Generation:
```
🚀 Starting batch generation for X segments
📊 Current personas count: 0
🔄 Generating X personas for segment: [name]
🔵 OpenAI API Request: { model: 'gpt-4-turbo-preview', jsonMode: true, ... }
🟢 OpenAI API Response received: { hasChoices: true, choiceCount: 1 }
✅ Received response for [name], parsing...
📝 Raw response (first 500 chars): {"personas":[...]}
✅ Parsed JSON successfully: { type: 'object', hasPersonas: true }
✅ Found personas array in response object: X items
✅ Generated X personas for [name]
🔄 Updating personas state with X new personas...
📊 Total personas after [name]: X
🎉 Batch generation complete! Total personas: X
```

### During Rendering:
```
🔍 PersonaBuilder render - personas: X, segments: Y
📋 Sample persona: { id: '...', name: '...', ... }
📋 All persona IDs: ['...', '...', ...]
```

## Error Scenarios

### If API Fails:
- Console shows: `❌ OpenAI API Error: [details]`
- Progress bar shows error status
- Other cohorts continue processing

### If JSON Parse Fails:
- Console shows: `❌ JSON parse error: [details]`
- Shows raw response for debugging
- Error status on progress bar

### If No Personas Generated:
- Console shows: `⚠️ No personas generated for [name]`
- Progress bar shows error
- Continues with next segment

## Success Criteria

✅ Personas display immediately after generation  
✅ Dashboard shows correct counts  
✅ Experiment Lab activates with personas  
✅ Simulation runs successfully  
✅ State persists across navigation  
✅ All buttons work correctly  
✅ No console errors  

---

**Last Updated:** December 2025

