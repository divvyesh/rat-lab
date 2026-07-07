# Navigation Testing Script

This document provides a comprehensive testing guide for validating all navigation paths, keyboard shortcuts, and edge cases in the RAT Lab application.

## Prerequisites

1. Start the development server: `npm run dev`
2. Open the application in a browser
3. Open browser DevTools (F12) to view console logs
4. Have a test user account ready or use demo mode

---

## Test Suite 1: Basic Navigation Paths

### Test 1.1: Sidebar Navigation
**Objective:** Verify all sidebar navigation items work correctly

**Steps:**
1. Log in to the application
2. Click each navigation item in the sidebar:
   - Overview (Dashboard)
   - Cohorts (Persona Builder)
   - Sample Population (Societies)
   - Simulations (Experiment Lab)
   - Analysis
   - Assets
   - Templates (if implemented)
   - Workspaces (if implemented)
   - Settings (if implemented)
   - API (API Playground)

**Expected Results:**
- ✅ Each click navigates to the correct view
- ✅ Active navigation item is highlighted
- ✅ URL updates to match the view (e.g., `/cohorts`, `/simulations`)
- ✅ No console errors
- ✅ Page content loads correctly

**Test Results:**
- [ ] Overview
- [ ] Cohorts
- [ ] Sample Population
- [ ] Simulations
- [ ] Analysis
- [ ] Assets
- [ ] Templates
- [ ] Workspaces
- [ ] Settings
- [ ] API

---

## Test Suite 2: Keyboard Shortcuts

### Test 2.1: Navigation Shortcuts
**Objective:** Verify all keyboard shortcuts for navigation work

**Steps:**
1. Ensure you're logged in and on any view
2. Press each keyboard shortcut:
   - `Ctrl+1` → Dashboard
   - `Ctrl+2` → Cohorts
   - `Ctrl+3` → Sample Population
   - `Ctrl+4` → Simulations
   - `Ctrl+5` → Analysis
   - `Ctrl+6` → Assets
   - `Ctrl+7` → API Playground

**Expected Results:**
- ✅ Each shortcut navigates to the correct view
- ✅ Shortcuts don't trigger when typing in input fields
- ✅ URL updates correctly
- ✅ Console shows navigation logs

**Test Results:**
- [ ] Ctrl+1 (Dashboard)
- [ ] Ctrl+2 (Cohorts)
- [ ] Ctrl+3 (Sample Population)
- [ ] Ctrl+4 (Simulations)
- [ ] Ctrl+5 (Analysis)
- [ ] Ctrl+6 (Assets)
- [ ] Ctrl+7 (API)

### Test 2.2: Action Shortcuts
**Objective:** Verify action shortcuts work correctly

**Steps:**
1. Press `Ctrl+K` → Should open Quick Actions modal
2. Press `Ctrl+N` → Should open Quick Actions modal (New action)
3. Press `?` → Should open Keyboard Shortcuts modal
4. Press `Esc` → Should close any open modal

**Expected Results:**
- ✅ Modals open/close correctly
- ✅ Shortcuts work from any view
- ✅ Esc closes modals

**Test Results:**
- [ ] Ctrl+K (Quick Actions)
- [ ] Ctrl+N (New/Quick Actions)
- [ ] ? (Shortcuts Modal)
- [ ] Esc (Close Modal)

### Test 2.3: Shortcut Edge Cases
**Objective:** Verify shortcuts don't interfere with typing

**Steps:**
1. Navigate to a view with input fields (e.g., Persona Builder)
2. Click in an input field
3. Try pressing navigation shortcuts (Ctrl+1, Ctrl+2, etc.)
4. Type in the input field
5. Press shortcuts again when not focused on input

**Expected Results:**
- ✅ Shortcuts don't trigger when typing in inputs
- ✅ Shortcuts work normally when not in input fields
- ✅ No interference with normal typing

**Test Results:**
- [ ] Shortcuts disabled in inputs
- [ ] Shortcuts work outside inputs

---

## Test Suite 3: URL Routing & Deep Linking

### Test 3.1: Direct URL Navigation
**Objective:** Verify deep linking works for all views

**Steps:**
1. While logged in, manually navigate to each URL:
   - `http://localhost:5173/` → Dashboard
   - `http://localhost:5173/cohorts` → Cohorts
   - `http://localhost:5173/societies` → Sample Population
   - `http://localhost:5173/simulations` → Simulations
   - `http://localhost:5173/analysis` → Analysis
   - `http://localhost:5173/assets` → Assets
   - `http://localhost:5173/api` → API Playground

**Expected Results:**
- ✅ Each URL loads the correct view
- ✅ Sidebar highlights the active view
- ✅ No redirects to login (if already authenticated)
- ✅ URL stays as entered

**Test Results:**
- [ ] `/` (Dashboard)
- [ ] `/cohorts` (Cohorts)
- [ ] `/societies` (Sample Population)
- [ ] `/simulations` (Simulations)
- [ ] `/analysis` (Analysis)
- [ ] `/assets` (Assets)
- [ ] `/api` (API)

### Test 3.2: URL Updates on Navigation
**Objective:** Verify URL updates when navigating via UI

**Steps:**
1. Start on Dashboard (`/`)
2. Click each sidebar item
3. Observe URL changes in address bar

**Expected Results:**
- ✅ URL updates immediately on navigation
- ✅ URL matches the current view
- ✅ Browser history is updated

**Test Results:**
- [ ] URL updates on sidebar click
- [ ] URL matches view

### Test 3.3: Invalid URL Handling
**Objective:** Verify invalid URLs are handled gracefully

**Steps:**
1. Navigate to invalid URLs:
   - `http://localhost:5173/invalid`
   - `http://localhost:5173/random-path`
   - `http://localhost:5173/cohorts/invalid`

**Expected Results:**
- ✅ Invalid URLs redirect to Dashboard (default)
- ✅ No errors in console
- ✅ Application remains functional

**Test Results:**
- [ ] Invalid URL handling

---

## Test Suite 4: Browser History (Back/Forward)

### Test 4.1: Browser Back Button
**Objective:** Verify browser back button works correctly

**Steps:**
1. Navigate through multiple views:
   - Dashboard → Cohorts → Simulations → Analysis
2. Click browser back button multiple times
3. Observe view changes

**Expected Results:**
- ✅ Back button navigates to previous view
- ✅ URL updates correctly
- ✅ Sidebar highlights correct view
- ✅ View content loads correctly

**Test Results:**
- [ ] Back button works
- [ ] URL syncs with view
- [ ] Sidebar highlights correctly

### Test 4.2: Browser Forward Button
**Objective:** Verify browser forward button works correctly

**Steps:**
1. Navigate: Dashboard → Cohorts → Simulations
2. Click back button twice (back to Dashboard)
3. Click forward button twice
4. Observe navigation

**Expected Results:**
- ✅ Forward button navigates to next view in history
- ✅ URL updates correctly
- ✅ Sidebar highlights correct view

**Test Results:**
- [ ] Forward button works
- [ ] History navigation correct

### Test 4.3: History with Modals
**Objective:** Verify modals don't interfere with history

**Steps:**
1. Navigate to Dashboard
2. Open Quick Actions modal (Ctrl+K)
3. Close modal
4. Navigate to Cohorts
5. Click back button

**Expected Results:**
- ✅ Modal open/close doesn't create history entries
- ✅ Back button navigates to Dashboard (not modal state)
- ✅ History is clean

**Test Results:**
- [ ] Modals don't pollute history

---

## Test Suite 5: Edge Cases

### Test 5.1: Navigation During Operations
**Objective:** Verify navigation works during async operations

**Steps:**
1. Start a persona generation (if available)
2. While operation is in progress, navigate to another view
3. Observe behavior

**Expected Results:**
- ✅ Navigation works even during operations
- ✅ No errors or crashes
- ✅ Operation can continue in background (if applicable)

**Test Results:**
- [ ] Navigation during operations

### Test 5.2: Rapid Navigation
**Objective:** Verify rapid clicking doesn't cause issues

**Steps:**
1. Rapidly click through all sidebar items (5-10 clicks per second)
2. Observe application behavior

**Expected Results:**
- ✅ Application remains responsive
- ✅ No errors or crashes
- ✅ Final view is correct
- ✅ URL matches final view

**Test Results:**
- [ ] Rapid navigation handling

### Test 5.3: Browser Refresh
**Objective:** Verify state persists after refresh

**Steps:**
1. Navigate to a specific view (e.g., Simulations)
2. Refresh browser (F5)
3. Observe behavior

**Expected Results:**
- ✅ User remains logged in (if session valid)
- ✅ View is restored from URL
- ✅ Data loads correctly
- ✅ No errors

**Test Results:**
- [ ] Refresh preserves view
- [ ] Session persists

### Test 5.4: Navigation After Errors
**Objective:** Verify navigation works after errors

**Steps:**
1. Trigger an error (e.g., invalid API call)
2. Try to navigate to another view
3. Observe behavior

**Expected Results:**
- ✅ Navigation still works after errors
- ✅ Error doesn't block navigation
- ✅ Application recovers gracefully

**Test Results:**
- [ ] Navigation after errors

### Test 5.5: Deep Link While Logged Out
**Objective:** Verify deep links redirect to login when not authenticated

**Steps:**
1. Log out of the application
2. Manually navigate to `/cohorts` or `/simulations`
3. Observe behavior

**Expected Results:**
- ✅ Redirects to login page
- ✅ After login, navigates to the requested view (if URL preserved)
- ✅ Or defaults to Dashboard

**Test Results:**
- [ ] Deep link redirects to login
- [ ] Post-login navigation

### Test 5.6: Multiple Tabs
**Objective:** Verify navigation works across multiple tabs

**Steps:**
1. Open application in two browser tabs
2. Navigate to different views in each tab
3. Observe behavior

**Expected Results:**
- ✅ Each tab maintains independent navigation state
- ✅ No conflicts between tabs
- ✅ Both tabs function correctly

**Test Results:**
- [ ] Multiple tabs work independently

---

## Test Suite 6: Quick Actions Modal

### Test 6.1: Quick Actions Navigation
**Objective:** Verify Quick Actions modal navigation works

**Steps:**
1. Open Quick Actions (Ctrl+K)
2. Click each action item
3. Verify navigation

**Expected Results:**
- ✅ Each action navigates correctly
- ✅ Modal closes after selection
- ✅ View loads correctly

**Test Results:**
- [ ] All Quick Actions work
- [ ] Modal closes correctly

### Test 6.2: Quick Actions Search
**Objective:** Verify search functionality in Quick Actions

**Steps:**
1. Open Quick Actions (Ctrl+K)
2. Type in search box
3. Verify filtering works
4. Select filtered item

**Expected Results:**
- ✅ Search filters actions correctly
- ✅ Selection works from filtered results
- ✅ Empty state shows when no matches

**Test Results:**
- [ ] Search filtering works
- [ ] Selection from filtered results

---

## Test Suite 7: Keyboard Shortcuts Modal

### Test 7.1: Shortcuts Modal Display
**Objective:** Verify shortcuts modal shows all shortcuts

**Steps:**
1. Press `?` to open shortcuts modal
2. Verify all shortcuts are listed
3. Check categories are correct

**Expected Results:**
- ✅ All shortcuts are displayed
- ✅ Categories are organized
- ✅ Key combinations are shown correctly

**Test Results:**
- [ ] All shortcuts displayed
- [ ] Categories correct

### Test 7.2: Shortcuts Modal Interaction
**Objective:** Verify shortcuts modal can be closed

**Steps:**
1. Open shortcuts modal (`?`)
2. Close via X button
3. Open again
4. Close via Esc key
5. Open again
6. Close via backdrop click

**Expected Results:**
- ✅ All close methods work
- ✅ Modal opens/closes smoothly
- ✅ No errors

**Test Results:**
- [ ] X button closes modal
- [ ] Esc key closes modal
- [ ] Backdrop click closes modal

---

## Test Suite 8: Integration Tests

### Test 8.1: Complete User Journey
**Objective:** Test a complete navigation journey

**Steps:**
1. Log in
2. Navigate: Dashboard → Cohorts → Create cohort → Simulations → Run simulation → Analysis
3. Use keyboard shortcuts where possible
4. Use browser back/forward buttons
5. Use Quick Actions modal

**Expected Results:**
- ✅ All navigation methods work together
- ✅ No conflicts between methods
- ✅ State is consistent
- ✅ URL always matches view

**Test Results:**
- [ ] Complete journey works
- [ ] All methods compatible

### Test 8.2: Navigation State Consistency
**Objective:** Verify navigation state is always consistent

**Steps:**
1. Navigate using sidebar
2. Check URL matches
3. Navigate using keyboard shortcut
4. Check URL matches
5. Navigate using browser back
6. Check URL matches
7. Navigate using Quick Actions
8. Check URL matches

**Expected Results:**
- ✅ URL always matches current view
- ✅ Sidebar always highlights correct view
- ✅ No inconsistencies

**Test Results:**
- [ ] State always consistent

---

## Automated Test Checklist

For automated testing, verify:

- [ ] All AppView enum values have corresponding routes
- [ ] All routes have corresponding views
- [ ] URL routing functions work correctly
- [ ] Browser history integration works
- [ ] Keyboard shortcuts are properly registered
- [ ] Modals don't interfere with navigation
- [ ] Deep linking works for all views
- [ ] Invalid URLs are handled
- [ ] Navigation state persists on refresh

---

## Known Issues & Notes

Document any issues found during testing:

1. **Issue:** [Description]
   - **Steps to reproduce:** 
   - **Expected:** 
   - **Actual:** 
   - **Status:** 

---

## Test Execution Log

**Date:** _______________
**Tester:** _______________
**Browser:** _______________
**Version:** _______________

**Summary:**
- Total Tests: ___
- Passed: ___
- Failed: ___
- Blocked: ___

**Notes:**
