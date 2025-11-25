# Source Management Documentation

This folder contains all documentation related to WasteDB's source citation and traceability system.

## 📁 Contents

| File                                                                           | Purpose                                                                                            | Audience            |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- | ------------------- |
| [SOURCE_SCHEMA.md](./SOURCE_SCHEMA.md)                                         | **Schema & Interface definitions** - TypeScript interfaces, field specifications, validation rules | Developers          |
| [SOURCE_TRACEABILITY.md](./SOURCE_TRACEABILITY.md)                             | **Traceability principles** - How parameters link to academic sources                              | All                 |
| [SOURCE_LIBRARY_MANAGER_PRODUCTION.md](./SOURCE_LIBRARY_MANAGER_PRODUCTION.md) | **Feature documentation** - Full Source Library Manager docs                                       | Developers, Admins  |
| [SOURCE_LIBRARY_QUICK_REFERENCE.md](./SOURCE_LIBRARY_QUICK_REFERENCE.md)       | **Quick reference card** - One-page Source Library Manager usage                                   | Admins, Users       |
| [SOURCE_COMPARISON_GUIDE.md](./SOURCE_COMPARISON_GUIDE.md)                     | **Source Comparison tool** - User guide for comparing source contributions                         | All                 |
| [QUICK_REFERENCE_SOURCE_COMPARISON.md](./QUICK_REFERENCE_SOURCE_COMPARISON.md) | **Quick reference** - One-page Source Comparison usage                                             | Admins, Users       |
| [SOURCE_LIBRARY_TESTING_GUIDE.md](./SOURCE_LIBRARY_TESTING_GUIDE.md)           | **Testing checklist** - QA verification for Source Library                                         | QA, Developers      |
| [SOURCE_LIBRARY_TROUBLESHOOTING.md](./SOURCE_LIBRARY_TROUBLESHOOTING.md)       | **Troubleshooting** - Common errors and solutions                                                  | Support, Developers |

---

## Quick Start

### For Users

1. Start with [SOURCE_LIBRARY_QUICK_REFERENCE.md](./SOURCE_LIBRARY_QUICK_REFERENCE.md)
2. Learn about traceability in [SOURCE_TRACEABILITY.md](./SOURCE_TRACEABILITY.md)

### For Admins

1. Read the [Quick Reference](./SOURCE_LIBRARY_QUICK_REFERENCE.md)
2. For comparison tools, see [QUICK_REFERENCE_SOURCE_COMPARISON.md](./QUICK_REFERENCE_SOURCE_COMPARISON.md)

### For Developers

1. Start with [SOURCE_SCHEMA.md](./SOURCE_SCHEMA.md) for interface definitions
2. Read [SOURCE_LIBRARY_MANAGER_PRODUCTION.md](./SOURCE_LIBRARY_MANAGER_PRODUCTION.md) for architecture

---

## 🔗 Related Documentation

- [SUPABASE_INTEGRATION.md](../SUPABASE_INTEGRATION.md) - Backend integration
- [ROLES_AND_PERMISSIONS.md](../ROLES_AND_PERMISSIONS.md) - Access control
- [SECURITY.md](../SECURITY.md) - Security measures

---

## Source Types & Weights

| Type              | Default Weight | Description                     |
| ----------------- | -------------- | ------------------------------- |
| **Peer-Reviewed** | 1.0            | Academic journal articles       |
| **Government**    | 0.9            | EPA, EU, national agencies      |
| **Industrial**    | 0.7            | LCA databases, industry reports |
| **NGO/Nonprofit** | 0.6            | Research organizations          |
| **Internal**      | 0.3            | Unpublished, proprietary        |

---

## 📝 Key Concepts

### Source Library vs Material Sources

- **Source Library** (`/data/sources.ts`) - Global repository of all academic sources
- **Material Sources** - Sources attached to individual materials for specific parameters

### Parameter Attribution

Each source must declare which parameters it supports via the `parameters` array:

```typescript
{
  title: "Aluminum Recycling Study",
  parameters: ['Y_value', 'CR_practical_mean']  // Which parameters this source validates
}
```

### Traceability

Every scientific parameter in WasteDB (15 total) should be traceable to at least one academic source, ensuring scientific rigor and reproducibility.
