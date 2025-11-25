# Security Documentation

Security measures, access control, and production hardening guides for WasteDB.

## 📁 Contents

| File                                                                   | Purpose                                  |
| ---------------------------------------------------------------------- | ---------------------------------------- |
| [SECURITY.md](./SECURITY.md)                                           | Main security documentation and measures |
| [PRODUCTION_SECURITY_CHECKLIST.md](./PRODUCTION_SECURITY_CHECKLIST.md) | Pre-production security verification     |
| [ROLES_AND_PERMISSIONS.md](./ROLES_AND_PERMISSIONS.md)                 | User roles and RBAC documentation        |

## 🔐 Quick Reference

### User Roles

- **Admin**: Full access to all features
- **User**: Read access, can submit content for review

### Key Security Features

- Row-Level Security (RLS) on Supabase
- JWT token authentication
- Rate limiting on API endpoints
- Input validation and sanitization

## Related

- [auth/](../auth/) - Authentication implementation details
- [setup/](../setup/) - Deployment guides
