# Deployment

## Standard Flow

1. Review migrations and confirm they are additive.
2. Create a full-site backup from Admin > Database > Materials.
3. Validate the downloaded backup with `POST /backup/validate`.
4. Run the roadmap acceptance tests relevant to the change.
5. Deploy database migrations.
6. Deploy the Supabase edge function.
7. Deploy the Vite client.
8. Run smoke tests and reconcile expected counts.

## Required Safety Gates

- No unexplained row, relationship, attribution, evidence, or audit-history
  loss.
- Existing backup and audit endpoints continue to respond.
- Any incompatible behavior has a documented manual migration and recovery
  procedure.
- Read paths do not switch to a migrated representation before reconciliation.
- Legacy reads remain available for at least one release cycle after legacy
  writes stop.

## Supabase

Typical commands:

```bash
supabase link --project-ref YOUR_PROJECT_ID
supabase db push
supabase functions deploy make-server-17cae920
```

Confirm required secrets in the Supabase dashboard before deploying the edge
function. Do not put the service-role key in client-visible configuration.

## Rollback

Application rollback and data rollback are separate operations. Reverting
client or edge-function code does not reverse a database migration. Database
rollback must use a reviewed reverse migration or the manual recovery process
in [Operations](../admin/OPERATIONS.md).
