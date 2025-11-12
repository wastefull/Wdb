~~1. Log out button should redirect user to front page.~~ ✅ FIXED - Nov 10, 2025: Added navigation to materials list on logout

~~2. [Error] Did not parse stylesheet at 'https://db.wastefull.org/daddytime.css' because non CSS MIME types are not allowed in strict mode.~~ ✅ FIXED - Nov 10, 2025: Replaced 2.93 MB DaddyTimeMono font with JetBrains Mono (~80 KB) from Google Fonts

~~3. Auth token expiration exposes API endpoints in console and doesn't redirect user.~~ ✅ FIXED - Nov 10, 2025: 
  - Enhanced error handling for 401/403 responses
  - Endpoints no longer logged in production (only in test mode)
  - Session expiry now triggers automatic redirect to front page/login
  - User-friendly toast messages instead of technical errors
  - Sanitized error messages to prevent information disclosure
  - **UPDATE:** Removed explicit `setTestMode(true)` from App.tsx - now uses environment-based detection
  - Production (db.wastefull.org): Console logs automatically suppressed
  - Development (Figma Make/localhost): Console logs enabled for debugging

~~4. Figma devtools_worker errors (Versions 437-545)~~ ✅ FIXED - Nov 12, 2025:
  - **Root Cause #1:** Missing `AlertCircle` import in App.tsx (line 3155 used it, line 3 didn't import it)
  - **Root Cause #2:** Unconditional `console.log()` calls during initialization:
    - Line 2817: Direct `console.log` in Phase 3A verification
    - Line 3588: `loggerInfo()` call that always outputs to console
  - **Root Cause #3:** Removed logger imports prematurely while they were still being used
    - Lines 2797-2799: `setTestMode`, `getTestMode`, `loggerInfo` used in window.wastedbLogger setup
  - **Fixes Applied:**
    - ✅ Added `AlertCircle` to lucide-react imports
    - ✅ Changed `console.log` to `logger.log` on line 2817
    - ✅ Removed unconditional `loggerInfo()` call from main App component
    - ✅ Re-added necessary logger imports (`setTestMode`, `getTestMode`, `loggerInfo`) for window.wastedbLogger
  - **Result:** App renders successfully with proper error-free initialization
  - **Lesson:** Verify all usages before removing imports; use React error boundaries for better debugging

5.
