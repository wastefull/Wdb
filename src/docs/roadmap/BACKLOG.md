# WasteDB Backlog

_Future enhancements and deferred work items_

**Last Updated:** November 17, 2025

---

## 📋 Overview

This document tracks all backlog items, future enhancements, and deferred work for WasteDB. Items are organized by category and priority.

---

## 🔥 High Priority

### Data Retention & Lifecycle Management

**Status:** Deferred from Phase 9.0 Day 7  
**Related:** `/docs/PHASE_9_STATUS.md`

1. **Audit Log Cleanup Enhancements**

   - **Description:** Extend the existing audit log cleanup functionality with more granular controls
   - **Tasks:**
     - [ ] Add date range selector for cleanup (instead of just 7+ years)
     - [ ] Add preview of logs to be deleted before confirmation
     - [ ] Add export option before deletion (backup as JSON/CSV)
     - [ ] Add filter by entity type before cleanup
   - **Estimated Effort:** 2-3 hours
   - **Dependencies:** Phase 9.0 Day 7 complete

2. **Retention Dashboard Integration**

   - **Description:** Enhance existing Moderation > Data Retention page with comprehensive stats and actions
   - **Tasks:**
     - [ ] Add visual charts for retention statistics (screenshot age distribution, audit log age distribution)
     - [ ] Add storage space indicators (how much space would be freed)
     - [ ] Add last cleanup date tracking
     - [ ] Add automated cleanup scheduling UI (cron job configuration)
   - **Estimated Effort:** 4-5 hours
   - **Dependencies:** Phase 9.0 Day 7 complete

3. **Bulk Source Deletion**

   - **Description:** Allow admins to delete multiple sources at once with referential integrity checks
   - **Tasks:**
     - [ ] Add multi-select UI in Source Library Manager
     - [ ] Add "Check All" button to verify all selected sources can be deleted
     - [ ] Add batch referential integrity checking endpoint
     - [ ] Add confirmation dialog showing which sources can/cannot be deleted
     - [ ] Add bulk delete endpoint with rollback on error
   - **Estimated Effort:** 5-6 hours
   - **Dependencies:** Phase 9.0 Day 7 complete

4. **Configurable Retention Policies**
   - **Description:** Allow admins to customize retention periods instead of hardcoded 7 years
   - **Tasks:**
     - [ ] Create retention policy configuration UI in admin settings
     - [ ] Add fields for screenshot retention period (days)
     - [ ] Add fields for audit log retention period (days)
     - [ ] Store policy config in KV store
     - [ ] Update cleanup endpoints to respect configured policies
     - [ ] Add policy version tracking and audit trail
   - **Estimated Effort:** 6-8 hours
   - **Dependencies:** Phase 9.0 Day 7 complete

---

## 📦 Medium Priority

### Phase 6 (Content Management) Enhancements

**Status:** Deferred from Phase 6.4  
**Related:** `/docs/PHASE_6_COMPLETE.md`

1. **Inline Diff Viewer for Article Updates**
   - **Description:** Show color-coded diffs when reviewing article edits
   - **Tasks:**
     - [ ] Implement diff algorithm for markdown content
     - [ ] Create visual diff component with color coding
     - [ ] Add icons for additions/deletions
     - [ ] Integrate into Review Modal
   - **Estimated Effort:** 3-4 hours
   - **Dependencies:** None

### Source Library Enhancements

**Status:** Future work identified in Phase 9.0 Day 5  
**Related:** `/docs/FINAL_SESSION_SUMMARY_NOV_2_2025.md`

1. **BibTeX Import/Export**

   - **Description:** Support BibTeX format for academic citation management
   - **Tasks:**
     - [ ] Add BibTeX parser library
     - [ ] Create import endpoint
     - [ ] Create export endpoint
     - [ ] Add UI buttons in Source Library Manager
   - **Estimated Effort:** 4-5 hours

2. **DOI Auto-Lookup**

   - **Description:** Automatically fetch citation metadata from DOI.org API
   - **Tasks:**
     - [ ] Integrate DOI.org API
     - [ ] Add "Fetch from DOI" button in source creation form
     - [ ] Auto-populate title, authors, year, journal fields
   - **Estimated Effort:** 2-3 hours

3. **Citation Generator**

   - **Description:** Generate formatted citations in multiple styles (APA, MLA, Chicago)
   - **Tasks:**
     - [ ] Add citation formatting library
     - [ ] Create citation generation endpoint
     - [ ] Add "Copy Citation" dropdown in Source Library
   - **Estimated Effort:** 3-4 hours

4. **Source Versioning**

   - **Description:** Track changes to source metadata over time
   - **Tasks:**
     - [ ] Add version history to source records
     - [ ] Create version comparison UI
     - [ ] Add revert to previous version functionality
   - **Estimated Effort:** 6-8 hours

5. **Advanced Search with Boolean Operators**
   - **Description:** Support complex searches like `(aluminum OR aluminium) AND recycling NOT contamination`
   - **Tasks:**
     - [ ] Implement query parser
     - [ ] Update search endpoint
     - [ ] Add search syntax help/documentation
   - **Estimated Effort:** 5-6 hours

### Audit Log Viewer Enhancements

**Status:** Deferred from Phase 9.0 Day 6  
**Related:** `/docs/PHASE_9_0_STATUS_SUMMARY.md` line 350-351

1. **Scroll-to-Focus Behavior**
   - **Description:** When opening audit log detail modal from bottom of list, ensure modal is visible
   - **Tasks:**
     - [ ] Add scroll-to-top behavior when modal opens
     - [ ] Ensure modal overlay covers audit log list
     - [ ] Test on mobile/tablet viewports
   - **Estimated Effort:** 1 hour

---

## 💡 Low Priority / Nice to Have

### Authentication Enhancements

**Status:** Future work from Phase 3.5  
**Related:** `/docs/PHASE_3.5_COMPLETE.md`

1. **OAuth Providers**

   - [ ] Google Sign-In
   - [ ] GitHub Sign-In
   - **Estimated Effort:** 8-10 hours

2. **Remember Device**

   - [ ] "Trust this device for 30 days" checkbox
   - [ ] Device fingerprinting
   - **Estimated Effort:** 4-5 hours

3. **Two-Factor Authentication**

   - [ ] TOTP (Time-based One-Time Password)
   - [ ] SMS backup codes
   - [ ] Admin-only requirement option
   - **Estimated Effort:** 10-12 hours

4. **Resend Confirmation Email Button**
   - [ ] Add to sign-in page for unconfirmed accounts
   - **Estimated Effort:** 1-2 hours

### Visualization Enhancements

**Status:** Future work from Phase 4  
**Related:** `/docs/PHASE_4_VISUALIZATION_COMPLETE.md`

1. **Animation Improvements**

   - [ ] Smooth fade-in for quantile visualizations
   - [ ] Animated transitions between data updates
   - **Estimated Effort:** 2-3 hours

2. **Tooltip Enhancements**

   - [ ] Add tooltips explaining each parameter tab
   - [ ] Add methodology references in tooltips
   - **Estimated Effort:** 2-3 hours

3. **Badge Indicators**

   - [ ] Show count of materials with scientific data
   - [ ] Show data completeness percentage
   - **Estimated Effort:** 1-2 hours

4. **Keyboard Navigation**

   - [ ] Arrow keys to switch between CR/CC/RU tabs
   - [ ] Remember last active tab in localStorage
   - **Estimated Effort:** 1-2 hours

5. **Dark Mode Chart Support**
   - **Description:** Configure sustainability graphs (CR/CC/RU visualizations) to render properly in dark mode
   - **Tasks:**
     - [ ] Update chart background colors for dark mode
     - [ ] Update axis labels and text colors
     - [ ] Update legend styling
     - [ ] Update grid lines and borders
     - [ ] Test all chart types in dark mode
   - **Estimated Effort:** 3-4 hours
   - **Dependencies:** Dark mode theme complete

### Performance Optimizations

**Status:** Migrated to Phase 10  
**Related:** `/docs/PHASE_8_COMPLETE.md`, `/ROADMAP.md`

1. **Server-Side Chart Rendering**

   - [ ] Add server-side rendering option for static charts
   - [ ] Reduce client-side computation
   - **Estimated Effort:** 8-10 hours

2. **Database Query Optimization**

   - [ ] Add pagination for large result sets
   - [ ] Implement query result caching
   - [ ] Add database indexes
   - [ ] Query plan analysis
   - **Estimated Effort:** 10-12 hours

3. **Progressive Data Loading**
   - [ ] Load scientific data editor tabs on-demand
   - [ ] Lazy load parameter forms
   - **Estimated Effort:** 4-5 hours

### Logging & Monitoring

**Status:** Future work from Logger implementation  
**Related:** `/docs/LOGGER_IMPLEMENTATION_SUMMARY.md`

1. **Remote Logging Integration**

   - [ ] Integrate Sentry for error tracking
   - [ ] Integrate LogRocket for session replay
   - **Estimated Effort:** 6-8 hours

2. **Log Level Filtering**

   - [ ] UI controls to show only warnings/errors
   - [ ] Filter by log category
   - **Estimated Effort:** 2-3 hours

3. **Persistent TEST_MODE Setting**
   - [ ] Store TEST_MODE preference in localStorage
   - [ ] Add toggle in developer tools
   - **Estimated Effort:** 1 hour

### Parameter & Caching

**Status:** Future work from cache implementation  
**Related:** `/docs/PARAMETER_SOURCE_CACHE.md`

1. **Persisted Cache**

   - [ ] Store parameter availability cache in localStorage
   - [ ] Improve offline performance
   - **Estimated Effort:** 3-4 hours

2. **Worker Thread Cache Building**

   - [ ] Move cache building to Web Worker
   - [ ] Prevent UI blocking for large datasets
   - **Estimated Effort:** 5-6 hours

3. **Incremental Cache Updates**
   - [ ] Update cache incrementally instead of full rebuild
   - [ ] Track which materials changed
   - **Estimated Effort:** 4-5 hours

### API & Developer Tools

**Status:** Future work from Phase 7  
**Related:** `/docs/PHASE_7_COMPLETE.md`

1. **Interactive API Testing**

   - [ ] Add "Try it" buttons to test endpoints in UI
   - [ ] Show live response data
   - [ ] Support parameter customization
   - **Estimated Effort:** 6-8 hours

2. **API Rate Limiting**

   - [ ] Add rate limiting per IP/API key
   - [ ] Show rate limit status in headers
   - **Estimated Effort:** 3-4 hours

3. **API Versioning**
   - [ ] Support /api/v1 and /api/v2 simultaneously
   - [ ] Deprecation notices
   - **Estimated Effort:** 5-6 hours

---

## 🚫 Deferred / Out of Scope

### COI Field in Database

**Status:** Deferred to Phase 9.2  
**Related:** `/docs/PHASE_9_0_STATUS_SUMMARY.md` line 141-144  
**Reason:** Evidence Wizard doesn't exist yet; no MIUs to store COI for

- [ ] Add `conflict_of_interest` TEXT field to `evidence_points` table
- **Future:** Implement during Phase 9.2 (Curation Workbench)

---

## Priority Matrix

| Category           | High  | Medium | Low    | Total  |
| ------------------ | ----- | ------ | ------ | ------ |
| Data Retention     | 4     | 0      | 0      | 4      |
| Content Management | 0     | 1      | 0      | 1      |
| Source Library     | 0     | 5      | 0      | 5      |
| Audit Logging      | 0     | 1      | 0      | 1      |
| Authentication     | 0     | 0      | 4      | 4      |
| Visualization      | 0     | 0      | 4      | 4      |
| Performance        | 0     | 0      | 3      | 3      |
| Logging            | 0     | 0      | 3      | 3      |
| Caching            | 0     | 0      | 3      | 3      |
| API/Dev Tools      | 0     | 0      | 3      | 3      |
| **Total**          | **4** | **7**  | **20** | **31** |

---

## Implementation Notes

### When to Address Backlog Items

- **High Priority:** Address after Phase 9.0 completion or during Phase 10
- **Medium Priority:** Address during Phase 10 or as time permits
- **Low Priority:** Address in post-launch maintenance cycles

### Adding New Items

When adding new backlog items, include:

1. **Description:** What needs to be done and why
2. **Tasks:** Checklist of specific implementation steps
3. **Estimated Effort:** Time estimate in hours
4. **Dependencies:** What must be complete first
5. **Status:** Where it was deferred from or identified

### Removing Items

Items should be removed from backlog when:

1. Completed and deployed to production
2. Determined to be out of scope permanently
3. Superseded by alternative implementation

---

**Next Review:** After Phase 9.0 completion (Day 10)
