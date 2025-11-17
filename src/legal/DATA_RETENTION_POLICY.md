# WasteDB Data Retention & Deletion Policy

**Version:** 1.0  
**Effective Date:** November 16, 2025  
**Last Updated:** November 16, 2025  
**Owner:** WasteDB Legal & Compliance Team

---

## 1. Purpose

This Data Retention & Deletion Policy establishes guidelines for the lifecycle management of data stored in WasteDB, ensuring compliance with legal requirements, research integrity standards, and responsible data stewardship practices.

---

## 2. Scope

This policy applies to all data stored in WasteDB, including but not limited to:

- **Materials** - Sustainability scores and metadata
- **Sources** - Academic papers, whitepapers, articles, and external references
- **Evidence Points** - Material Information Units (MIUs) extracted from sources
- **Screenshots** - Visual evidence of source content
- **User Data** - Curator profiles and authentication records
- **Audit Logs** - System activity and change history
- **Transform Definitions** - Versioned scoring algorithms

---

## 3. General Principles

### 3.1 Data Minimization
WasteDB collects and retains only data necessary for its core mission: providing transparent, evidence-based sustainability information.

### 3.2 Research Integrity
Data retention periods are designed to support academic citation standards and enable reproducibility of sustainability assessments.

### 3.3 Right to Erasure
WasteDB respects data subjects' rights under GDPR and similar regulations, balanced against legitimate research and archival interests.

### 3.4 Referential Integrity
Data deletion must preserve the integrity of dependent records and maintain traceability of evidence chains.

---

## 4. Retention Periods by Data Type

### 4.1 Materials
**Retention:** Indefinite (unless material is discontinued)  
**Rationale:** Core database content; materials remain relevant as long as they exist in commerce.

**Deletion Triggers:**
- Admin-initiated removal (e.g., duplicate, error, obsolete product)
- Manufacturer/rights holder takedown request (per `/legal/TAKEDOWN_PROCESS.md`)

**Deletion Process:**
- Requires admin authorization
- Cannot delete if evidence points exist (must cascade delete or orphan evidence first)
- Audit log entry required

### 4.2 Sources (Academic Papers, Whitepapers, Articles)
**Retention:** Indefinite (core research asset)  
**Rationale:** Sources are permanent records in the academic/publishing ecosystem.

**Deletion Triggers:**
- Confirmed duplicate (merge workflow preferred)
- Copyright takedown request (per `/legal/TAKEDOWN_PROCESS.md`)
- Fraud/retraction (source permanently discredited)

**Deletion Process:**
- **CRITICAL:** Cannot delete if evidence points reference this source
- Requires admin authorization
- Must provide deletion reason (logged in audit trail)
- Referential integrity check MUST pass before deletion
- Associated screenshots handled per Section 4.3

**Protected Deletion:**
Sources with dependent evidence points CANNOT be deleted. Options:
1. Remove evidence points first (cascade delete)
2. Mark source as "deprecated" without deletion
3. Merge into canonical source (deduplication workflow)

### 4.3 Screenshots
**Retention:** 7 years from capture date  
**Rationale:** Aligns with academic citation standards and copyright fair use best practices.

**Deletion Triggers:**
- Screenshot older than 7 years (automatic cleanup)
- Parent source deleted (cascade)
- Admin-initiated removal (e.g., PII/sensitive content)

**Automatic Cleanup:**
- Scheduled job runs monthly
- Identifies screenshots older than 7 years
- Deletes from Supabase Storage
- Logs deletion in audit trail
- Updates source record (`screenshot_url` set to null)

**Exception:** Screenshots supporting active legal disputes are retained until resolution.

### 4.4 Evidence Points (MIUs)
**Retention:** Indefinite (unless source deleted)  
**Rationale:** Evidence points are the scientific foundation of WasteDB scores; deletion undermines traceability.

**Deletion Triggers:**
- Parent material deleted (cascade)
- Parent source deleted (cascade)
- Curator-initiated correction (soft delete + replacement)

**Deletion Process:**
- Requires admin authorization
- Audit log entry required (including before/after snapshot)
- Transform scores automatically recomputed when evidence changes

### 4.5 User Data
**Retention:** Active accounts - indefinite; Inactive accounts - 3 years  
**Rationale:** Balances GDPR "right to erasure" with need for curator attribution.

**Deletion Triggers:**
- User requests account deletion (GDPR Article 17)
- Account inactive for 3+ years (no login, no evidence contributions)

**Deletion Process:**
- Email confirmation required (30-day grace period)
- Evidence contributions preserved (attributed to "Anonymous Curator")
- Audit logs preserved (user ID anonymized as `deleted-user-{hash}`)
- Authentication credentials purged immediately

### 4.6 Audit Logs
**Retention:** 7 years (compliance standard)  
**Rationale:** Supports forensic investigation, compliance audits, and transparency reporting.

**Deletion Triggers:**
- Log older than 7 years (automatic cleanup)
- Legal requirement (e.g., GDPR erasure request for sensitive PII)

**Automatic Cleanup:**
- Scheduled job runs quarterly
- Archives logs 7+ years old (compressed export)
- Deletes from active database
- Archive stored in secure long-term storage

### 4.7 Transform Definitions
**Retention:** Indefinite (permanent versioned record)  
**Rationale:** Transform versioning is essential for reproducibility; old versions must remain accessible.

**Deletion:** Not permitted (versions marked deprecated instead)

---

## 5. Referential Integrity Rules

### 5.1 Protected Deletion
The following data types CANNOT be deleted if dependent records exist:

| Data Type | Protected If | Resolution |
|-----------|--------------|------------|
| Materials | Evidence points exist | Delete evidence first OR mark material as archived |
| Sources | Evidence points exist | Delete evidence first OR mark source as deprecated |
| Users | Authored evidence points | Anonymize user data, preserve evidence attribution |

### 5.2 Cascade Deletion
The following data types automatically cascade delete:

| Parent Deletion | Cascade Deletes |
|----------------|-----------------|
| Material | All evidence points for that material |
| Source | All evidence points referencing that source + screenshots |
| User (GDPR request) | User profile, auth tokens (evidence anonymized, not deleted) |

### 5.3 Orphan Prevention
The database MUST enforce referential integrity:
- Evidence points MUST reference valid material + source
- Audit logs MUST reference valid entity IDs (or store snapshot if entity deleted)
- Screenshots MUST belong to a valid source (or be marked orphaned for cleanup)

---

## 6. Deletion Workflow

### 6.1 Admin-Initiated Deletion
**Process:**
1. Admin navigates to Data Retention Manager (`/admin/data-retention`)
2. Selects entity type (material, source, user) and specific entity
3. System performs referential integrity check
4. If blocked: Display reason + resolution options
5. If allowed: Confirmation modal with deletion preview
6. Admin provides deletion reason (required)
7. System executes deletion + logs audit entry
8. Email notification sent to admin team (critical action)

### 6.2 Automatic Scheduled Cleanup
**Process:**
1. Cron job runs on schedule (monthly for screenshots, quarterly for logs)
2. Identifies records exceeding retention period
3. Executes deletion in batches (100 records/batch)
4. Logs summary in audit trail
5. Email report sent to admin team

### 6.3 User-Requested Deletion (GDPR)
**Process:**
1. User submits erasure request via email/form
2. Admin verifies identity
3. System generates deletion preview (what will be deleted/anonymized)
4. Admin sends preview to user for confirmation
5. 30-day waiting period (user can cancel)
6. After 30 days: Execute deletion + anonymization
7. Confirmation email sent to user
8. Audit log entry created

---

## 7. Screenshot Retention Specifics

### 7.1 7-Year Rationale
The 7-year retention period for screenshots balances multiple considerations:

- **Academic Standards:** Most journals accept citations up to 7 years old
- **Copyright Fair Use:** Long-term storage reduces fair use defense strength
- **Storage Costs:** Screenshots are the largest storage consumers in WasteDB
- **Evidence Validity:** Material formulations often change within 7 years

### 7.2 Automatic Cleanup Job
**Schedule:** Monthly (1st of each month, 2:00 AM UTC)

**Logic:**
```
FOR EACH screenshot IN supabase.storage.list('screenshots-17cae920'):
  IF screenshot.created_at < (NOW() - 7 years):
    DELETE screenshot FROM storage
    UPDATE sources SET screenshot_url = NULL WHERE screenshot_url = screenshot.url
    LOG audit_entry (action: 'screenshot_expired', entity: source_id)
```

**Notifications:**
- Monthly summary email to admins (count of deleted screenshots)
- No notification for individual deletions (automatic process)

### 7.3 Grace Period
Screenshots are marked for deletion 30 days before actual deletion:
- `screenshot_expiry_date` field set 30 days before 7-year mark
- Admins can flag screenshots for preservation (legal disputes, active research)
- Flagged screenshots exempt from automatic cleanup

---

## 8. Compliance & Legal Considerations

### 8.1 GDPR Compliance (EU Users)
WasteDB respects GDPR rights:
- **Right to Erasure (Article 17):** User data deletion within 30 days
- **Right to Data Portability (Article 20):** Export via `/api/export` endpoint
- **Right to Rectification (Article 16):** Edit profile via account settings

**Limitations:**
- Evidence points preserved for research integrity (GDPR Article 17(3)(d) - public interest in scientific research)
- User attribution anonymized but contributions not deleted

### 8.2 CCPA Compliance (California Users)
- **Right to Delete:** Same process as GDPR erasure
- **Right to Know:** Audit logs accessible to account owner
- **Right to Opt-Out:** Not applicable (WasteDB does not sell data)

### 8.3 Safe Harbor (DMCA § 512)
- Deletion following takedown requests per `/legal/TAKEDOWN_PROCESS.md`
- 72-hour response guarantee maintained
- Counter-notification process preserved

---

## 9. Data Retention Manager (Admin UI)

### 9.1 Features
The Data Retention Manager provides:
- **Entity Search:** Find materials, sources, users by ID/name
- **Referential Integrity Check:** Real-time validation before deletion
- **Deletion Preview:** Show what will be deleted (including cascades)
- **Bulk Operations:** Delete multiple orphaned records
- **Scheduled Job Status:** View last run + next scheduled cleanup
- **Retention Statistics:** Count of records approaching retention limits

### 9.2 Access Control
- **Required Role:** Admin
- **Audit Logging:** All deletion attempts logged (success + failure)
- **Two-Factor Confirmation:** Critical deletions require password re-entry

---

## 10. Backup & Recovery Considerations

### 10.1 Soft Delete Strategy
For critical data types, WasteDB uses soft deletion:
- Record marked `deleted_at` timestamp (not physically removed)
- Excluded from queries via `WHERE deleted_at IS NULL`
- Recoverable by admins within 30 days
- Hard delete after 30-day grace period

**Soft Delete Applies To:**
- Materials (30-day recovery window)
- Evidence points (30-day recovery window)
- Users (30-day recovery window per GDPR)

### 10.2 Backup Interaction
- Daily backups include soft-deleted records (for recovery)
- Hard deletions cannot be recovered (even from backups)
- Screenshot deletions are immediate (storage costs)

---

## 11. Monitoring & Reporting

### 11.1 Deletion Metrics
Monthly admin report includes:
- Count of deleted entities by type
- Count of blocked deletion attempts (referential integrity)
- Count of expired screenshots cleaned up
- Storage reclaimed (GB)

### 11.2 Anomaly Detection
Alert admins if:
- Deletion rate >10% of database in single day (potential attack)
- Referential integrity violations detected (database corruption)
- Scheduled cleanup job fails (technical issue)

---

## 12. Policy Review & Updates

**Review Schedule:** Annually (every November)  
**Owner:** WasteDB Legal & Compliance Team  
**Approval Required:** Technical Lead + Legal Counsel

**Trigger for Immediate Review:**
- New data protection regulation (e.g., new state privacy laws)
- Major database schema change
- Security incident involving data deletion
- User community feedback on retention periods

---

## 13. Contact & Questions

For questions about this policy:
- **Email:** legal@wastefull.org
- **Data Protection Officer:** Nao (natto@wastefull.org)
- **Technical Contact:** WasteDB Admin Team

For data deletion requests:
- **GDPR/CCPA Requests:** Use form at `/legal/data-deletion-request`
- **Source Takedown:** Use form at `/legal/takedown-request`
- **General Inquiries:** legal@wastefull.org

---

## Appendix A: Retention Period Summary Table

| Data Type | Retention Period | Auto-Delete | Referential Check |
|-----------|-----------------|-------------|-------------------|
| Materials | Indefinite | No | Yes (evidence) |
| Sources | Indefinite | No | Yes (evidence) |
| Evidence Points | Indefinite | No | No |
| Screenshots | 7 years | Yes | No |
| User Data (Active) | Indefinite | No | Yes (evidence) |
| User Data (Inactive) | 3 years | Yes | Yes (evidence) |
| Audit Logs | 7 years | Yes | No |
| Transform Definitions | Indefinite | No | N/A |
| Takedown Requests | 7 years | Yes | No |
| Notifications | 90 days | Yes | No |

---

## Appendix B: Deletion Decision Tree

```
┌─────────────────────────────────┐
│ Admin initiates deletion request │
└─────────────┬───────────────────┘
              │
              ▼
      ┌───────────────┐
      │ Entity exists? │
      └───┬───────┬───┘
          │ No    │ Yes
          │       │
          ▼       ▼
      ┌─────┐  ┌──────────────────────┐
      │ 404 │  │ Check referential    │
      └─────┘  │ integrity            │
               └───┬──────────────┬───┘
                   │ Has deps     │ No deps
                   │              │
                   ▼              ▼
            ┌─────────────┐   ┌──────────────┐
            │ Block delete│   │ Show preview │
            │ Show deps   │   └──────┬───────┘
            └─────────────┘          │
                                     ▼
                              ┌──────────────┐
                              │ Admin confirm│
                              └──────┬───────┘
                                     │ Yes
                                     ▼
                              ┌──────────────┐
                              │ Soft delete  │
                              │ (30 days)    │
                              └──────┬───────┘
                                     │
                                     ▼
                              ┌──────────────┐
                              │ Audit log +  │
                              │ Email alert  │
                              └──────────────┘
```

---

**Document Version History:**
- **v1.0** (2025-11-16): Initial policy creation for Phase 9.0 Day 7
