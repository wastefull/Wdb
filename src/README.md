# WasteDB 🌍

**A comprehensive CMS for managing material sustainability data with retro Wastefull brand design and Apple Liquid Glass inspired elements.**

WasteDB helps organizations track and curate sustainability scores for materials, powered by scientific evidence and peer-reviewed sources. Features include CRUD operations, evidence curation workbench, policy snapshots, and comprehensive testing infrastructure.

---

## Quick Start

### For End Users (Production)

Visit the live app at **https://db.wastefull.org** and sign in with a magic link.

📖 See [QUICK_START.md](/docs/QUICK_START.md) for usage guide.

### For Developers (Local Setup)

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd wastedb

# 2. Install dependencies
npm install

# 3. Copy environment template
cp .env.example .env.local

# 4. Add your Supabase credentials to .env.local
# Get from: https://app.supabase.com/project/YOUR_PROJECT/settings/api

# 5. Run development server
npm run dev
```

📖 See [LOCAL_DEVELOPMENT_SETUP.md](/docs/LOCAL_DEVELOPMENT_SETUP.md) for complete setup guide.

---

## 🏗️ Architecture

```
Frontend (React + TypeScript + Tailwind)
    ↓
Edge Functions (Deno + Hono)
    ↓
Database (Supabase PostgreSQL + KV Store)
```

### Key Technologies

- **Frontend**: React, TypeScript, Tailwind CSS v4.0, ShadCN UI
- **Backend**: Supabase Edge Functions (Deno runtime)
- **Database**: Supabase (PostgreSQL + Key-Value Store)
- **Auth**: Supabase Auth with magic links (Resend)
- **Charts**: Recharts
- **Deployment**: Figma Make (production), Local (development)

---

## 📂 Project Structure

```
wastedb/
├── /components/          # React components
│   ├── /ui/             # ShadCN UI components
│   ├── /scientific-editor/  # Parameter editor tabs
│   └── /figma/          # Figma import utilities
├── /config/              # Test definitions & phase configs
│   └── /tests/
│       ├── /phases/      # Phase-specific test modules
│       ├── all.ts        # Centralized test aggregation
│       └── types.ts      # Test type definitions
├── /contexts/            # React contexts
│   ├── AuthContext.tsx   # Authentication state
│   ├── MaterialsContext.tsx  # Materials state & localStorage sync
│   └── NavigationContext.tsx # Navigation state
├── /data/                # Static data
│   ├── sources.ts        # Source library (peer-reviewed papers)
│   └── transforms.ts     # Transform formulas for calculations
├── /docs/                # Documentation (50+ files)
├── /ontologies/          # Ontology definitions
│   ├── units.json        # Parameter units & validation rules
│   └── context.json      # Controlled vocabularies
├── /supabase/            # Backend edge functions
│   └── /functions/
│       └── /server/
│           ├── index.tsx          # Main server (5000+ lines)
│           ├── kv_store.tsx       # KV utilities (protected)
│           ├── evidence-routes.tsx # Evidence CRUD endpoints
│           └── exports.tsx        # Data export endpoints
├── /styles/
│   └── globals.css       # Tailwind config & design tokens
├── /types/
│   └── material.ts       # Core type definitions
├── /utils/               # Utility functions
│   ├── /supabase/        # Supabase helpers
│   ├── logger.ts         # Smart logging system
│   └── environment.ts    # Environment detection
├── App.tsx               # Main app component
├── .env.example          # Environment template
└── .gitignore            # Git ignore rules
```

---

## Key Features

### ✅ Phase 9.0 - Evidence Infrastructure

- Evidence CRUD operations
- Policy snapshots with version tracking
- Aggregation computation engine
- Units & context ontologies
- Comprehensive test suite (50+ tests)

### ✅ Phase 9.1 - Evidence API

- Evidence creation with validation
- Material-scoped evidence queries
- Parameter-specific filtering
- Source citation tracking
- Confidence levels (high/medium/low)

### ✅ Phase 9.2 - Curation Workbench

- 5-step evidence wizard
- Smart context pre-fill (AI-powered)
- Unit validation against ontologies
- Pilot scope (6 materials: PET, HDPE, Cardboard, Paper, Glass Clear, Glass Colored)
- CR parameters (Y, D, C, M, E)

### 🔐 Authentication & Authorization

- Magic link authentication (no passwords)
- Role-based access control (public/user/admin)
- Session management with Supabase Auth
- Email delivery via Resend

### Data Management

- localStorage + Supabase sync
- CSV import/export
- Batch operations
- Source library management
- Material defaults system

### 🧪 Testing Infrastructure

- Centralized test definitions
- Phase-filtered test tabs
- Modular test organization
- 100+ comprehensive tests

---

## 🔧 Development

### Environment Setup

You need either:

**Option A: Remote Supabase** (recommended)

```bash
# .env.local
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Option B: Local Supabase**

```bash
supabase start  # Requires Docker
# Then use credentials from output
```

### Common Commands

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Deploy edge functions (production)
supabase functions deploy make-server-17cae920

# Initialize ontologies
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/make-server-17cae920/ontologies/initialize \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# Check local Supabase status
supabase status

# View edge function logs
supabase functions logs make-server-17cae920
```

### Testing

1. Navigate to **Roadmap** tab
2. Select a phase (e.g., **Phase 9.2**)
3. Click **Run Tests**
4. View results in real-time

Tests verify:

- ✅ Database connectivity
- ✅ API endpoints
- ✅ Auth flows
- ✅ Data validation
- ✅ Business logic

---

## Documentation

| Document                                                       | Description                |
| -------------------------------------------------------------- | -------------------------- |
| [LOCAL_DEVELOPMENT_SETUP.md](/docs/LOCAL_DEVELOPMENT_SETUP.md) | Complete local setup guide |
| [QUICK_START.md](/docs/QUICK_START.md)                         | End-user guide             |
| [PHASE_9_ROADMAP.md](/docs/PHASE_9_ROADMAP.md)                 | Phase 9 development plan   |
| [SUPABASE_INTEGRATION.md](/docs/SUPABASE_INTEGRATION.md)       | Database architecture      |
| [SECURITY.md](/docs/SECURITY.md)                               | Security features & RBAC   |
| [DATA_PIPELINE.md](/docs/DATA_PIPELINE.md)                     | Scientific methodology     |
| [LOGGER_USAGE_GUIDE.md](/docs/LOGGER_USAGE_GUIDE.md)           | Logging system             |
| [API_SECURITY_LOGGING.md](/docs/API_SECURITY_LOGGING.md)       | API security               |
| [ASSET_STORAGE_GUIDE.md](/docs/ASSET_STORAGE_GUIDE.md)         | File uploads               |

📁 See `/docs/` directory for 50+ additional guides.

---

## 🔐 Security

- ✅ Role-based access control (RBAC)
- ✅ Secure API key management
- ✅ Protected edge function endpoints
- ✅ Input validation & sanitization
- ✅ Comprehensive security logging
- ✅ Rate limiting on auth endpoints
- ✅ Environment variable protection

⚠️ **NEVER commit**:

- `.env.local`
- Service role keys
- API keys
- Production credentials

---

## 🧪 Testing

### Test Organization

Tests are organized by phase in `/config/tests/phases/`:

```
/config/tests/
├── phases/
│   ├── 9.0.1.ts   # Core infrastructure
│   ├── 9.0.2.ts   # Auth & sync
│   ├── 9.0.3.ts   # Material CRUD
│   ├── 9.0.4.ts   # Source management
│   ├── 9.0.5.ts   # Scientific data
│   ├── 9.0.6.ts   # Articles & attachments
│   ├── 9.0.7.ts   # User management
│   ├── 9.0.8.ts   # Public export
│   ├── 9.0.9.ts   # Edge cases
│   ├── 9.0.10.ts  # Performance & caching
│   ├── 9.0.11.ts  # Ontologies & aggregation
│   ├── 9.1.ts     # Evidence API
│   └── 9.2.ts     # Curation workbench
├── all.ts         # Centralized aggregation
└── testDefinitions.ts  # Public API
```

### Running Tests

```bash
# In app UI
1. Navigate to Roadmap
2. Select phase tab (e.g., "Phase 9.2")
3. Click "Run Tests"

# Or use unified Tests tab for all tests
```

---

## 🛠️ Troubleshooting

### "Failed to load units ontology"

**Solution**: Initialize ontologies via API:

```bash
curl -X POST <SUPABASE_URL>/functions/v1/make-server-17cae920/ontologies/initialize \
  -H "Authorization: Bearer <ANON_KEY>"
```

### "CORS error"

**Solution**: Ensure edge functions are deployed and include correct auth header.

### "Cannot connect to local Supabase"

**Solution**:

```bash
# Check Docker is running
docker ps

# Restart Supabase
supabase stop && supabase start
```

### "Module not found"

**Solution**:

```bash
rm -rf node_modules
npm install
```

📖 See [LOCAL_DEVELOPMENT_SETUP.md](/docs/LOCAL_DEVELOPMENT_SETUP.md) for more troubleshooting.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests to verify (`Roadmap → Tests`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Style

- Use TypeScript for all new code
- Follow existing naming conventions
- Add JSDoc comments for public functions
- Write tests for new features
- Update documentation

---

## 📝 Environment Variables

| Variable                    | Required    | Description                  |
| --------------------------- | ----------- | ---------------------------- |
| `VITE_SUPABASE_URL`         | Yes (local) | Supabase API URL             |
| `VITE_SUPABASE_ANON_KEY`    | Yes (local) | Public anon key              |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes         | Admin key for edge functions |
| `SUPABASE_DB_URL`           | Yes         | PostgreSQL connection string |
| `RESEND_API_KEY`            | Optional    | Email service API key        |

See `.env.example` for template.

---

## Current Status

### ✅ Completed Phases

- **Phase 9.0**: Complete infrastructure (Days 1-11)
- **Phase 9.1**: Evidence API integration
- **Phase 9.2**: Curation workbench UI

### 🚧 In Progress

- Phase 9.3: Advanced search & filtering
- Phase 9.4: Data visualization enhancements

### 📋 Planned

- Phase 10: Polish & scale
- Public API v1
- Mobile app support

---

## License

[Add your license here]

---

## 🙏 Acknowledgments

- Built with [Supabase](https://supabase.com)
- UI components from [ShadCN](https://ui.shadcn.com)
- Email delivery via [Resend](https://resend.com)

---

## 📞 Support

- **Production URL**: https://db.wastefull.org
- **Email**: natto@wastefull.org
- **Documentation**: `/docs/` directory
- **Issues**: [GitHub Issues](your-github-repo/issues)

---

## 🎉 Getting Started

**For Users**: Visit https://db.wastefull.org and sign in with your email.

**For Developers**: Follow [LOCAL_DEVELOPMENT_SETUP.md](/docs/LOCAL_DEVELOPMENT_SETUP.md) to get started locally.

**Questions?** Check the `/docs/` directory or reach out to the team!
