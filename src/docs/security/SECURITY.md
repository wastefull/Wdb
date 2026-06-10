# Security

WasteDB uses Supabase Auth, server-side authorization, Postgres RLS, input
validation, rate limiting, audit logging, and restricted service-role access.

## Core Rules

- The edge function and Postgres policies are authoritative.
- Never expose service-role credentials to the client.
- Treat the public Supabase anonymous key as anonymous transport credentials,
  never as proof of user authentication.
- Grant privileged roles explicitly; never ship default admin credentials or
  email-address-based privilege bypasses.
- Validate all privileged actions on the server.
- Prefer stable user IDs over duplicated personal data.
- Keep public revision history separate from restricted audit and security
  telemetry.
- Minimize request metadata retention and document its purpose.

## Data and Migration Safety

- Use additive migrations by default.
- Create and validate a full-site backup before migration work.
- Preserve original payloads for unresolved records.
- Reconcile before switching reads or stopping legacy writes.
- Do not drop legacy fields or tables without separately approved destructive
  cleanup and a verified recovery path.

## Operational References

- [Authentication](../admin/AUTHENTICATION.md)
- [Operations](../admin/OPERATIONS.md)
- [Privacy Policy](./PRIVACY_POLICY.md)
