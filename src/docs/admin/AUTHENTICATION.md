# Authentication and Roles

WasteDB uses Supabase Auth plus WasteDB session handling. The current role
source of truth is `user_profiles.role`.

## Roles

- `user`: public contributor capabilities
- `staff`: operational and editorial capabilities
- `admin`: full administrative capabilities

Server-side authorization is authoritative. Hiding a client control is not an
authorization boundary.

## Sign-In Methods

- Production supports Google OAuth for approved organization accounts and
  magic-link fallback.
- Local development may expose password authentication for testing.
- Authentication behavior and allowed providers must be kept aligned with the
  privacy policy and Supabase project configuration.

## Admin Attribution

Admins can create selected content on behalf of another user. The content
retains the selected creator attribution while the audit record identifies the
admin who performed the action.

## Operational Rules

- Never place service-role credentials in client code.
- Assign admin privileges explicitly through `user_profiles.role`; never create
  default admin credentials or promote users by matching an email address.
- Verify role and session behavior after auth changes.
- Preserve existing user IDs during migrations.
- Treat email addresses as account data; prefer stable user IDs in new audit
  and relationship records.

## First Admin Bootstrap

After the intended administrator signs in once, a trusted operator must assign
the role using the Supabase SQL editor or another service-role-only workflow:

```sql
update public.user_profiles
set role = 'admin'
where id = '<auth-user-uuid>';
```

Confirm the target UUID before applying the update and record the promotion in
the operational audit trail.
