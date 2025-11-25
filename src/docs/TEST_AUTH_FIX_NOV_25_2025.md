# Test Authentication Fix - November 25, 2025

## Problem
After refactoring the local development environment setup, 7 evidence-related tests were failing with "Unauthorized - invalid token" errors. This was due to tests using `publicAnonKey` instead of the user's `accessToken` when calling authenticated endpoints.

## Root Cause
The evidence endpoints in `/supabase/functions/server/index.tsx` all require `verifyAuth` middleware, which validates the user's access token. However, several tests were incorrectly using `publicAnonKey` instead of retrieving the user's token from sessionStorage.

## Failed Tests (Before Fix)
1. **Phase 9.0.4**: Get Evidence by Material - "Unauthorized - invalid token"
2. **Phase 9.1**: Get Evidence Point by ID - "Unauthorized - invalid token"
3. **Phase 9.1**: Get Evidence Points by Material - "Unauthorized - invalid token"
4. **Phase 9.2**: Filter Evidence by Material - "Unauthorized - invalid token"
5. **Phase 9.2**: Filter Evidence by Parameter - "Failed to fetch evidence for filtering test"
6. **Phase 9.2**: Search Evidence by Snippet Text - "Failed to fetch evidence for search test"
7. **Phase 9.2**: Verify Locator Field Options - "Failed to fetch evidence"

## Solution
Updated all affected tests to:
1. Check if user is authenticated before running
2. Retrieve `accessToken` from `sessionStorage.getItem('wastedb_access_token')`
3. Use `accessToken` instead of `publicAnonKey` in Authorization headers
4. Return helpful error messages if user is not authenticated

## Files Modified
- `/config/tests/phases/9.0.4.ts` - Fixed "Get Evidence by Material" test
- `/config/tests/phases/9.1.ts` - Fixed "Get Evidence Point by ID" and "Get Evidence Points by Material" tests
- `/config/tests/phases/9.2.ts` - Fixed all 4 evidence-related tests

## Example Change
**Before:**
```typescript
const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/evidence/material/${materialId}`, {
  method: 'GET',
  headers: { 'Authorization': `Bearer ${publicAnonKey}` }, // ❌ Wrong
});
```

**After:**
```typescript
if (!user) {
  return { success: false, message: 'Must be authenticated to retrieve evidence' };
}

const accessToken = sessionStorage.getItem('wastedb_access_token');
if (!accessToken) {
  return { success: false, message: 'No access token found - please sign in again' };
}

const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/evidence/material/${materialId}`, {
  method: 'GET',
  headers: { 'Authorization': `Bearer ${accessToken}` }, // ✅ Correct
});
```

## Server Endpoints Requiring Auth
All the following endpoints require `verifyAuth` middleware:
- `GET /evidence` - List all evidence
- `GET /evidence/material/:materialId` - Get evidence by material
- `GET /evidence/:evidenceId` - Get single evidence point
- `POST /evidence` - Create evidence (also requires admin)
- `PUT /evidence/:evidenceId` - Update evidence (also requires admin)
- `DELETE /evidence/:evidenceId` - Delete evidence (also requires admin)
- `PATCH /evidence/:id/validation` - Update validation status (also requires admin)

## Testing
After the fix:
1. Sign in to the application
2. Navigate to Roadmap → Phase 9.0.4, 9.1, or 9.2
3. Run the affected tests
4. All tests should now pass with valid authentication

## Notes
- Tests that create/update/delete evidence still require admin privileges
- Tests that only read evidence require any authenticated user
- The `publicAnonKey` should only be used for public, unauthenticated endpoints (like ontology files)
- This aligns with your local development environment where authentication is properly configured
