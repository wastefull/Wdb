# Backup & Recovery Procedures

**Last Updated:** November 17, 2025  
**Version:** 1.0  
**Applies To:** WasteDB Phase 9.0+

---

## Overview

This document outlines the backup and recovery procedures for the WasteDB platform. WasteDB uses a dual-tier backup strategy combining automated Supabase backups with manual JSON export capabilities.

---

## Backup Strategy

### 1. Automated Supabase Backups

**What:** Supabase provides automated database backups for PostgreSQL data.

**Coverage:**
- PostgreSQL database (KV store table)
- User authentication data
- All relational data

**Frequency:**
- **Pro Tier:** Daily automatic backups with 7-day retention
- **Free Tier:** Point-in-time recovery available for 7 days

**Configuration:**
1. Log in to [Supabase Dashboard](https://app.supabase.com)
2. Select your WasteDB project
3. Navigate to **Settings → Database**
4. Under **Backup & Recovery**, configure:
   - **Enable Point-in-Time Recovery (PITR):** Recommended for production
   - **Backup Schedule:** Daily (default)
   - **Retention Period:** 7 days (free tier) or 30 days (pro tier)

**Access Backups:**
- Via Supabase Dashboard → Database → Backups
- Download full database dumps
- Point-in-time recovery available via Supabase CLI

---

### 2. Manual JSON Export

**What:** WasteDB provides API endpoints for exporting all KV store data as JSON.

**Coverage:**
- All materials
- All sources (whitepapers, articles, external references)
- All evidence points
- All users (passwords excluded)
- All audit logs
- All notifications
- All takedown requests
- All recompute jobs
- All content submissions
- Transform definitions (for reference)

**Endpoint:** `POST /make-server-17cae920/backup/export`

**Authentication:** Admin role required

**Response Format:**
```json
{
  "metadata": {
    "version": "1.0",
    "timestamp": "2025-11-17T12:00:00.000Z",
    "exported_by": "user-uuid",
    "database_name": "WasteDB",
    "total_records": 1234,
    "export_duration_ms": 523
  },
  "data": {
    "materials": [...],
    "sources": [...],
    "whitepapers": [...],
    "evidence": [...],
    "users": [...],
    "audit_logs": [...],
    "notifications": [...],
    "takedown_requests": [...],
    "recompute_jobs": [...],
    "submissions": [...]
  },
  "transforms": {
    "version": "1.0",
    "transforms": [...]
  }
}
```

**Performance:**
- Typical export time: 500ms - 3 seconds (depending on data volume)
- Target: <5 minutes for exports up to 10,000 records

---

## Backup Procedures

### Automated Daily Backup (Recommended)

**No action required.** Supabase handles this automatically if configured.

**Verification:**
1. Log in to Supabase Dashboard
2. Navigate to Database → Backups
3. Verify most recent backup timestamp is within 24 hours

---

### Manual Backup Export

**When to use:**
- Before major system upgrades
- Before bulk data operations
- For off-site backup storage
- For data migration/transfer
- Monthly archival backups

**Procedure:**

1. **Authenticate as Admin**
   ```bash
   # Log in to WasteDB as admin user
   ```

2. **Trigger Export**
   ```bash
   curl -X POST https://[project-id].supabase.co/functions/v1/make-server-17cae920/backup/export \
     -H "Authorization: Bearer [access-token]" \
     -H "Content-Type: application/json" \
     -o wastedb-backup-$(date +%Y%m%d-%H%M%S).json
   ```

3. **Validate Backup**
   ```bash
   # Check file size (should be >1KB for non-empty database)
   ls -lh wastedb-backup-*.json
   
   # Optionally validate structure
   curl -X POST https://[project-id].supabase.co/functions/v1/make-server-17cae920/backup/validate \
     -H "Authorization: Bearer [access-token]" \
     -H "Content-Type: application/json" \
     -d @wastedb-backup-[timestamp].json
   ```

4. **Store Securely**
   - Store in encrypted cloud storage (Google Drive, Dropbox, S3)
   - Keep at least 3 backups: current, -1 week, -1 month
   - Never commit backup files to version control

---

## Recovery Procedures

### Scenario 1: Restore Single Record

**Use Case:** Accidentally deleted material, source, or evidence entry

**Procedure:**
1. Download most recent backup
2. Extract the specific record from JSON
3. Use admin UI to re-create the record manually
4. Verify data integrity

**Alternative:** Use audit logs to identify the "before" state and manually restore

---

### Scenario 2: Restore Category (e.g., All Sources)

**Use Case:** Bulk deletion or corruption of a single data category

**Procedure:**
1. Download most recent backup
2. Use import endpoint with merge mode:
   ```bash
   curl -X POST https://[project-id].supabase.co/functions/v1/make-server-17cae920/backup/import \
     -H "Authorization: Bearer [access-token]" \
     -H "Content-Type: application/json" \
     -d '{
       "backup": [BACKUP_JSON_CONTENT],
       "mode": "merge"
     }'
   ```
3. Import will:
   - Add missing records
   - Update existing records with backup data
   - NOT delete records that exist in production but not in backup
4. Verify restored data in admin UI

---

### Scenario 3: Full Database Restore

**Use Case:** Catastrophic data loss, corruption, or ransomware

**⚠️ WARNING:** This is a destructive operation. Only proceed with extreme caution.

**Procedure:**

**Option A: Restore from Supabase Backup (Recommended)**
1. Contact Supabase support or use Supabase CLI
2. Specify restore point (timestamp)
3. Supabase will restore PostgreSQL database to that point
4. Verify data integrity
5. Restart server to clear KV cache

**Option B: Restore from JSON Export**
1. Download most recent clean backup
2. **CRITICAL:** Backup current state first (even if corrupted)
   ```bash
   curl -X POST .../backup/export > pre-restore-backup.json
   ```
3. Validate backup file:
   ```bash
   curl -X POST .../backup/validate -d @backup.json
   ```
4. Import backup:
   ```bash
   curl -X POST .../backup/import \
     -d '{"backup": [BACKUP_JSON], "mode": "merge"}'
   ```
5. Review import results:
   - Check `imported`, `skipped`, `errors` counts
   - Verify critical materials exist
   - Check audit logs for completeness
6. Manual verification:
   - Test login for admin and regular users
   - Verify materials display correctly
   - Check source library
   - Test evidence retrieval
   - Verify whitepapers load

---

## Validation & Testing

### Backup Validation Endpoint

**Endpoint:** `POST /make-server-17cae920/backup/validate`

**Request:**
```json
{
  "backup": { ... }
}
```

**Response:**
```json
{
  "valid": true,
  "issues": [],
  "warnings": [
    "Category 'notifications' is missing"
  ],
  "stats": {
    "total_records": 1234,
    "categories": {
      "materials": 8,
      "sources": 42,
      "evidence": 156,
      ...
    },
    "metadata": { ... }
  }
}
```

**Validation Checks:**
- ✅ Backup structure is valid JSON
- ✅ Metadata present and complete
- ✅ All expected data categories present
- ✅ Each category is an array
- ✅ All records have valid IDs
- ✅ Total record count matches metadata

---

### Testing Backup/Restore

**Monthly Test Procedure:**

1. **Create test environment**
   - Clone production data to staging (if available)
   - OR use a dedicated test account

2. **Export backup**
   ```bash
   curl -X POST .../backup/export > test-backup.json
   ```

3. **Validate backup**
   ```bash
   curl -X POST .../backup/validate -d @test-backup.json
   ```

4. **Test restore**
   - Delete a test record
   - Import backup in merge mode
   - Verify record is restored

5. **Document results**
   - Export duration
   - File size
   - Validation status
   - Restore success/failure

---

## Retention Policy

### JSON Export Backups

| Frequency | Retention Period | Storage Location |
|-----------|------------------|------------------|
| Daily (automated) | 7 days | Supabase |
| Weekly (manual) | 4 weeks | Encrypted cloud storage |
| Monthly (manual) | 12 months | Encrypted cloud storage |
| Yearly (manual) | 7 years | Encrypted archive storage |

### Audit Logs

- Retained for 7 years per MIU Licensing Policy
- Included in all backup exports
- Subject to cleanup after retention period (see Phase 9.0 Day 7)

---

## Disaster Recovery

### Recovery Time Objective (RTO)

**Target:** 4 hours from incident to full restoration

**Breakdown:**
- Incident detection: 30 minutes
- Backup retrieval: 15 minutes
- Validation: 15 minutes
- Import execution: 30 minutes
- Verification: 2 hours
- Post-recovery testing: 1 hour

### Recovery Point Objective (RPO)

**Target:** 24 hours maximum data loss

**Achieved via:**
- Daily automated Supabase backups
- Point-in-time recovery (if enabled)

---

## Troubleshooting

### Export Fails

**Symptoms:** 500 error, timeout, or incomplete data

**Solutions:**
1. Check server logs for errors
2. Verify admin authentication
3. Check KV store connectivity
4. Try exporting individual categories
5. Contact Supabase support if KV store is down

### Import Fails

**Symptoms:** High error count, data not restored

**Solutions:**
1. Validate backup file first
2. Check backup format version matches current version
3. Review import response for specific errors
4. Import categories individually if full import fails
5. Check for ID conflicts (duplicate records)

### Validation Warnings

**Common warnings:**
- "Category missing" - Backup predates feature implementation (safe to ignore)
- "Records without IDs" - Invalid data, should be excluded from import
- "Record count mismatch" - May indicate corrupted backup file

---

## Security Considerations

### Backup File Protection

**DO:**
- ✅ Encrypt backup files at rest
- ✅ Use secure transfer protocols (HTTPS, SFTP)
- ✅ Restrict access to admin users only
- ✅ Store in geographically distributed locations
- ✅ Audit backup access logs

**DO NOT:**
- ❌ Commit backup files to Git repositories
- ❌ Share backup files via unencrypted email
- ❌ Store backups in publicly accessible cloud storage
- ❌ Include backups in application deployments

### Password Exclusion

**Note:** User passwords are **never** included in JSON exports for security.

**Impact:** After restore from JSON backup:
- Users will need to reset passwords via "Forgot Password" flow
- Session tokens will be invalidated
- Admin will need to re-authenticate

**Alternative:** For user account recovery, use Supabase's built-in auth backup.

---

## Compliance

### GDPR & Data Protection

- Backups contain personal data and must be protected accordingly
- Backup retention follows WasteDB's 7-year retention policy
- Users have the right to request deletion from backups (contact admin)
- Encrypted backups meet GDPR "appropriate safeguards" requirement

### Audit Trail

- All backup exports logged to audit_logs table
- All backup imports logged with full metadata
- Audit logs include:
  - Timestamp
  - User who performed operation
  - Record counts
  - Duration
  - Success/failure status

---

## Contact & Support

**For backup/recovery assistance:**
- Email: natto@wastefull.org (Admin: Nao)
- Supabase Support: https://supabase.com/support
- WasteDB Documentation: `/docs/PHASE_9_0_STATUS_SUMMARY.md`

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-11-17 | Initial release - Phase 9.0 Day 8 |
