# WasteDB Documentation

Welcome to the WasteDB documentation. This folder is organized by topic for easy navigation.

## 📁 Structure

```
docs/
├── README.md                    # This file
├── QUICK_START.md              # User getting started guide
│
├── # Active Phase 9 Documents
├── MIU_SCHEMA_PLAN.md          # MIU schema specification
├── EVIDENCE_PIPELINE_SPEC.md   # Evidence pipeline design
├── PARAMETER_SOURCE_CACHE.md   # Parameter caching strategy
│
├── setup/                       # Development & deployment
│   ├── LOCAL_DEVELOPMENT_SETUP.md
│   ├── GITHUB_DEPLOYMENT_GUIDE.md
│   └── DEPLOYMENT_CHECKLIST.md
│
├── security/                    # Security & access control
│   ├── SECURITY.md
│   ├── PRODUCTION_SECURITY_CHECKLIST.md
│   └── ROLES_AND_PERMISSIONS.md
│
├── source/                      # Source citation system
│   ├── SOURCE_SCHEMA.md
│   ├── SOURCE_TRACEABILITY.md
│   ├── SOURCE_LIBRARY_*.md
│   └── SOURCE_COMPARISON_*.md
│
├── visualization/               # Charts & data visualization
│   ├── VISUALIZATION.md
│   └── VIZ_UNIFIED.md
│
├── auth/                        # Authentication
├── data/                        # Data processing
├── admin/                       # Admin features
├── smtp/                        # Email configuration
├── roadmap/                     # Project roadmap & status
│
└── archive/                     # Historical documents
```

---

## Quick Links

### Getting Started

| Document                                                               | Purpose                           |
| ---------------------------------------------------------------------- | --------------------------------- |
| [QUICK_START.md](./QUICK_START.md)                                     | User-facing getting started guide |
| [setup/LOCAL_DEVELOPMENT_SETUP.md](./setup/LOCAL_DEVELOPMENT_SETUP.md) | Developer local environment       |
| [setup/DEPLOYMENT_CHECKLIST.md](./setup/DEPLOYMENT_CHECKLIST.md)       | Pre-production checklist          |

### Core Documentation

| Folder                             | Contents                              |
| ---------------------------------- | ------------------------------------- |
| [setup/](./setup/)                 | Development & deployment guides       |
| [security/](./security/)           | Security, RBAC, production hardening  |
| [source/](./source/)               | Source citation & traceability system |
| [visualization/](./visualization/) | Charts & 3D visualization             |
| [auth/](./auth/)                   | Authentication implementation         |
| [data/](./data/)                   | Data processing pipeline              |

### Active Phase 9 (MIU & Evidence)

| Document                                                 | Purpose                           |
| -------------------------------------------------------- | --------------------------------- |
| [MIU_SCHEMA_PLAN.md](./MIU_SCHEMA_PLAN.md)               | Minimal Interpretable Unit schema |
| [EVIDENCE_PIPELINE_SPEC.md](./EVIDENCE_PIPELINE_SPEC.md) | Evidence extraction pipeline      |
| [PARAMETER_SOURCE_CACHE.md](./PARAMETER_SOURCE_CACHE.md) | Parameter caching strategy        |
| [roadmap/PHASE_9_STATUS.md](./roadmap/PHASE_9_STATUS.md) | Current phase status              |

### Project Status

| Document                                                   | Purpose                |
| ---------------------------------------------------------- | ---------------------- |
| [roadmap/PROJECT_STATUS.md](./roadmap/PROJECT_STATUS.md)   | Overall project status |
| [roadmap/PHASE_9_ROADMAP.md](./roadmap/PHASE_9_ROADMAP.md) | Phase 9 roadmap        |
| [roadmap/BACKLOG.md](./roadmap/BACKLOG.md)                 | Feature backlog        |

---

## 📂 Folder Index

### `/setup/` - Development & Deployment

Getting your development environment running and deploying to production.

- Local development setup
- GitHub deployment guide
- Pre-deployment checklist

### `/security/` - Security Documentation

Security measures, access control, and production hardening.

- Main security documentation
- Production security checklist
- Roles and permissions (RBAC)

### `/source/` - Source Citation System

Managing academic sources and ensuring data traceability.

- Source schema definitions
- Traceability principles
- Source Library Manager guides
- Source Comparison tool guides

### `/visualization/` - Data Visualization

Charts, 3D visualization, and data presentation.

- Hybrid Quantile-Halo model
- Unified 3D visualization architecture

### `/auth/` - Authentication

Authentication implementation and testing.

- Magic link authentication
- Auth error handling
- Environment auth strategy

### `/data/` - Data Processing

Data pipeline, calculations, and backend processing.

- Multi-dimensional backend
- Calculation tests
- Data pipeline architecture
- Supabase integration
- Material defaults database

### `/admin/` - Admin Features

Admin-specific features and configuration.

- Phase configuration
- Asset storage
- Backup & recovery

### `/smtp/` - Email Configuration

Email and SMTP setup for notifications.

- Email confirmation setup
- Resend integration
- Testing guides

### `/roadmap/` - Project Planning

Project status, roadmaps, and phase tracking.

- Current phase status
- Future phase planning
- Feature backlog

### `/archive/` - Historical Documents

Completed phase documents and dated updates.

- Session summaries
- Completed refactoring plans
- Historical updates

---

## Finding Documentation

**New to WasteDB?** → Start with [QUICK_START.md](./QUICK_START.md)

**Setting up development?** → See [setup/](./setup/)

**Security questions?** → Check [security/](./security/)

**Understanding source data?** → Read [source/](./source/)

**Project status?** → See [roadmap/PROJECT_STATUS.md](./roadmap/PROJECT_STATUS.md)
