# Mobile Test Mode Guide for Ocean King 3

## Summary of Fixes Applied

### Issue Identified
The MobileEntryManager was not properly detecting the `testMobile` flag from URL hash (`/#testMobile`). The hash was appearing as empty string in the logs.

### Fixes Implemented

1. **Enhanced Hash Detection** (lines 273-276)
   ```typescript
   // Parse hash properly - window.location.hash includes the # symbol
   const hashValue = window.location.hash;
   const hashContainsTestMobile = hashValue === '#testMobile' || 
                                 hashValue.includes('testMobile');
   ```

2. **Test Mode Priority** (lines 315-318)
   ```typescript
   } else if (testMobile) {
       // Test mode - always show swipe prompt regardless of orientation
       console.log('MobileEntryManager: Test mode enabled, showing swipe prompt');
       this.showSwipePrompt();
   ```
   When test mode is active, it now always shows the swipe prompt, even in portrait orientation.

3. **Fallback Hash Detection** (lines 31-40)
   Added a 100ms delayed check to handle timing issues where hash might not be immediately available:
   ```typescript
   setTimeout(() => {
       if (this.overlayElement && this.overlayElement.parentNode) {
           const hashValue = window.location.hash;
           if (hashValue && hashValue.includes('testMobile')) {
               console.log('MobileEntryManager: Late hash detection - testMobile found');
               this.showSwipePrompt();
           }
       }
   }, 100);
   ```

## How to Enable Test Mode

### Method 1: Using localStorage (Most Reliable)
```javascript
// In browser console:
localStorage.setItem('testMobile', 'true');
location.reload();

// Or use the helper function:
setTestMobile(true);  // This will reload automatically
```

### Method 2: URL Hash
Navigate to: `http://yourdomain/#testMobile`
- Note: Due to how some dev servers handle routing, this may require a page refresh

### Method 3: Query Parameter
Navigate to: `http://yourdomain/?testMobile=true`

### Method 4: Window Property
```javascript
// In browser console:
window.testMobile = true;
location.reload();
```

## Expected Behaviors

### Desktop Mode (Default)
- **Condition**: No mobile device detected AND no test mode enabled
- **Behavior**: Shows overlay briefly, then auto-starts game
- **Console Log**: "MobileEntryManager: Desktop mode, auto-starting game"

### Test Mode Enabled
- **Condition**: Any test mode flag is set (localStorage, hash, query, or window)
- **Behavior**: Shows "Swipe Up to Begin" prompt with animated green arrow
- **Console Log**: "MobileEntryManager: Test mode enabled, showing swipe prompt"
- **UI Elements**:
  - Ocean King 3 logo at top
  - Bouncing green arrow animation
  - "Swipe Up to Begin" text
  - "This will enter fullscreen mode" subtitle

### Mobile Portrait Mode
- **Condition**: Mobile device in portrait orientation (no test mode)
- **Behavior**: Shows rotation prompt with animated phone icon
- **Console Log**: "MobileEntryManager: Portrait mode, showing rotation prompt"

### Mobile Landscape Mode
- **Condition**: Mobile device in landscape orientation
- **Behavior**: Shows swipe prompt (same as test mode)
- **Console Log**: "MobileEntryManager: Mobile landscape mode, showing swipe prompt"

## Testing Instructions

### To Verify Desktop Mode:
1. Clear all test flags:
   ```javascript
   localStorage.removeItem('testMobile');
   delete window.testMobile;
   ```
2. Navigate to base URL without hash or query params
3. Should see brief overlay then game starts automatically

### To Verify Test Mode:
1. Enable test mode using any method above
2. Refresh the page
3. Should see the swipe prompt with animated arrow
4. Check console for: "Test mode enabled, showing swipe prompt"
5. Swipe up or scroll to trigger fullscreen and start game

## Debugging Tips

### Check Current Test Mode Status:
```javascript
// Run in console to see all test mode flags:
console.log({
    hash: window.location.hash,
    hashContains: window.location.hash.includes('testMobile'),
    localStorage: localStorage.getItem('testMobile'),
    windowProp: window.testMobile,
    queryParam: new URLSearchParams(window.location.search).get('testMobile')
});
```

### Force Show Swipe Prompt (for testing UI):
```javascript
// This will directly trigger the swipe prompt UI:
if (window.game && window.game.mobileManager) {
    window.game.mobileManager.showSwipePrompt();
}
```

## Helper Files Created

1. **test-mobile-hash.html** - Comprehensive test page showing all URL parameters and test mode detection
2. **enable-test-mode.html** - Simple UI for enabling/disabling test mode with buttons

## Known Limitations

1. **Vite Dev Server**: HTML test pages served through Vite will load the game. Use the localStorage method for most reliable testing.
2. **Hash Timing**: Some environments may have a timing delay in hash availability, handled by the 100ms fallback check.
3. **Screenshot Tool**: The built-in screenshot tool URL-encodes hashes and query params, preventing proper testing via that method.

## Verification Complete

✅ Hash detection improved with explicit parsing
✅ Test mode always shows swipe prompt regardless of orientation
✅ Fallback timing check added for hash detection
✅ Multiple test mode methods available (localStorage, hash, query, window)
✅ Console logging enhanced for debugging