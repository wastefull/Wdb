# Email Operations

WasteDB uses Resend-backed email workflows for authentication and selected
notifications.

## Configuration

- Configure sender domains and API credentials in the deployment environment.
- Keep API keys in Supabase Edge Function secrets.
- Set `PUBLIC_CONTACT_EMAIL` to the public role address sent to external
  metadata providers.
- Set `ADMIN_NOTIFICATION_EMAILS` to a comma-separated list of operational
  recipients. It defaults to `PUBLIC_CONTACT_EMAIL`.
- Confirm sender addresses and domain verification before production use.

## Current Uses

- Magic-link and authentication email
- Editorial and submission notifications
- Selected critical audit notifications

## Safety

- Migration and backfill jobs must not generate one email per migrated row.
- Audit summaries should describe the operation and counts.
- Email failure must not prevent an audit record from being written.
- Test email changes in a non-production recipient environment first.
