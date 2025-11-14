# People Finder - Enterprise Directory Search

Modern, production-ready people directory application integrating Okta user data with Microsoft 365 presence and profile photos.

## 📌 Current Status (November 2025)

**Active Development** | **Production Ready** | **Monorepo Architecture**

The application has evolved significantly beyond its initial scope:

- ✅ **Core People Search**: Fully functional with Okta integration
- ✅ **Outlook Add-in**: React-based task pane add-in for Outlook on the web
- ✅ **Admin System**: Database-backed authentication with emergency access
- ✅ **Multi-Tenancy**: Office 365 tenancy support with domain routing
- ✅ **Advanced Features**: Group permissions, delegated auth, audit logging
- 🚀 **Active PRs**: Continuous improvements to authentication and Graph API integration

**Recent Enhancements** (Last 20 commits):
- Delegated authentication for group permission checks with Graph API fallback
- JWT-based admin authentication system
- Group send permission validation
- Domain-level feature flags for granular control
- Enhanced audit metadata and security improvements

## ✨ Features

### Core Functionality
- 🔍 **Real-time Search** - Fast search across Okta directory by name, title, department, location
- 👤 **Rich User Profiles** - Comprehensive user information with contact details and org context
- 📸 **Profile Photos** - Microsoft Entra ID profile pictures with 24-hour caching
- 🟢 **Teams Presence** - Real-time availability status with official Microsoft icons
- 🔗 **Manager Navigation** - Clickable manager links to navigate org hierarchy
- ✖️ **Smart Search UX** - Clear button and preserved context on navigation

### Enterprise Features
- 🏢 **Multi-Tenancy Support** - Office 365 tenancy routing based on email domains
- 🎛️ **Feature Flags** - Per-tenancy and per-domain configuration for Graph API features
- 👥 **Group Permissions** - Validate group membership and send-on-behalf permissions
- 🔐 **Delegated Auth** - User-context Graph API calls with automatic fallback
- 📧 **Outlook Add-in** - Integrated task pane for Outlook on the web
- 🗄️ **Database-backed Config** - Azure SQL Server with Prisma ORM

### Admin & Security
- 🛡️ **Admin Authentication** - JWT-based admin system with break-glass emergency access
- 📋 **Audit Logging** - Comprehensive tracking of all admin actions
- 🔑 **User Management** - Add/remove admins with role-based access
- 🚨 **Emergency Access** - Secure URL token-based emergency admin login
- 🔒 **Encrypted Secrets** - Configuration encryption for sensitive data

### Technical Features
- 📊 **Diagnostics Dashboard** - Cache statistics, health monitoring, and performance metrics
- 🧹 **Cache Management** - One-click cache clearing for troubleshooting
- 🐳 **Docker Containerized** - Consistent deployments with fast 2-3 minute builds
- 🚀 **Automated CI/CD** - GitHub Actions pipeline to Azure Container Apps
- 🔐 **Azure Easy Auth** - Microsoft and GitHub authentication with auto-redirect
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile
- ⚡ **Redis Caching** - Performance optimization with configurable TTLs

## 🏗️ Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- TypeScript (strict mode)
- React 18
- Tailwind CSS
- Lucide React Icons
- Framer Motion (animations)
- Vite (Outlook add-in dev server)

**Backend:**
- Node.js 20 LTS
- Okta API integration
- Microsoft Graph API (application & delegated permissions)
- Redis caching layer (ioredis)
- Prisma ORM
- Azure SQL Database (SQL Server)
- JWT authentication (jose)
- bcrypt password hashing

**Infrastructure:**
- Docker containerization (multi-stage builds)
- Azure Container Apps
- Azure Container Registry
- GitHub Actions CI/CD
- Azure Easy Auth
- Azure SQL Database
- Azure Cache for Redis

**Monorepo:**
- npm workspaces
- Shared TypeScript SDK package
- Concurrent development servers

## 🚀 Quick Start

### Prerequisites
- Node.js 20 LTS
- npm (bundled with Node 20)
- Okta admin access (API token)
- Microsoft Entra ID admin access (Graph API client)
- Docker Desktop (optional, for container testing)
- Outlook on the web (Monarch) if you plan to sideload the add-in

### Install dependencies

```bash
git clone https://github.com/YOUR_ORG/PeoplePickerc21.git
cd PeoplePickerc21
npm install
```

The repository uses npm workspaces; running `npm install` at the root bootstraps the Next.js admin app (`apps/web`), the Outlook add-in (`apps/addin`), and shared packages (`packages/*`).

### Configure environment (backend)

Create `apps/web/.env.local` and add the required secrets:

```env
# Okta Configuration
okta-org-url=https://your-org.okta.com
okta-api-token=your_okta_api_token_here

# Microsoft Graph API (for photos & presence)
ENTRA_TENANT_ID=your-azure-tenant-id
ENTRA_CLIENT_ID=your-app-client-id
ENTRA_CLIENT_SECRET=your-app-client-secret

# Optional: Redis for caching
redis-connection-string=redis://localhost:6379

# Azure SQL Database (Required)
DATABASE_URL="sqlserver://USERNAME:PASSWORD@SERVERNAME.database.windows.net:1433?database=DBNAME&encrypt=true&trustServerCertificate=false&connectionTimeout=30"

# Admin Authentication (Required)
JWT_SECRET=your-random-32-byte-secret
BREAK_GLASS_URL_TOKEN=your-emergency-access-token
BREAK_GLASS_EMAIL=emergency-admin@example.com
BREAK_GLASS_PASSWORD=your-secure-emergency-password
INITIAL_ADMIN_EMAIL=admin@example.com

# Optional: Azure AD SSO for Add-in
AZURE_AD_ENABLED=true
NEXT_PUBLIC_AZURE_AD_CLIENT_ID=your-sso-client-id
AZURE_AD_CLIENT_SECRET=your-sso-secret
AZURE_AD_TENANT_ID=your-tenant-id
AZURE_AD_REDIRECT_URI=http://localhost:3000/api/auth/callback
```

> Encode reserved characters in the SQL password. Use the same `DATABASE_URL` for build and runtime so Prisma targets the correct database.

### Database setup

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npx prisma migrate deploy --schema apps/web/prisma/schema.prisma

# (Optional) Seed initial data
npx prisma db seed
```

### Run development servers

```bash
npm run dev
```

This starts:
- `apps/web` at http://localhost:3000 (Next.js admin + API)
- `apps/addin` at https://localhost:5173 (Vite dev server with HTTPS and `/api` proxy)

Sideload the add-in during development by pointing Outlook to `https://localhost:5173/manifest.xml`.

### Access admin interface

Navigate to:
- http://localhost:3000/admin/dashboard - Admin panel (requires authentication)
- http://localhost:3000/admin/emergency?token={BREAK_GLASS_URL_TOKEN} - Emergency access

### Docker Development
```bash
docker-compose up --build
```

Access at http://localhost:3000

## 📁 Project Structure
```
PeoplePickerc21/
├── apps/
│   ├── web/                        # Next.js admin + API (existing People Picker app)
│   │   ├── app/                    # App Router routes (/api preserved)
│   │   ├── components/             # UI components
│   │   ├── lib/                    # Okta, Graph, Redis utilities
│   │   ├── prisma/                 # Schema, migrations, seed script
│   │   ├── next.config.js
│   │   └── package.json
│   └── addin/                      # Outlook task-pane add-in (React + Vite)
│       ├── src/                    # Task pane UI, hooks, commands
│       ├── public/                 # Manifest + icons
│       ├── index.html              # Task pane entry point
│       ├── commands.html           # Ribbon command host
│       └── package.json
├── packages/
│   └── sdk/                        # Shared TypeScript SDK (fetch wrappers)
│       ├── src/index.ts
│       ├── dist/                   # Build output (gitignored)
│       └── package.json
├── docs/                           # Add-in dev/deploy guides
├── package.json                    # Workspace root (scripts, dev deps)
├── tsconfig.base.json              # Shared TypeScript settings
├── tsconfig.json                   # Project references
├── docker-compose.yml
└── Dockerfile
```

## 🔌 API Endpoints

### Health & Diagnostics
- `GET /api/health` - System health check
- `GET /api/okta/ping` - Okta connectivity test
- `GET /api/cache/stats` - Cache statistics
- `POST /api/cache/clear` - Clear all cache

### User Data
- `GET /api/okta/users?q={query}` - Search users by name, title, location
- `GET /api/okta/users/{id}` - Get user by Okta ID
- `GET /api/okta/users/sample` - Sample user data

### Microsoft Graph Integration
- `GET /api/graph/photo/{email}` - User profile photo (24h cache)
- `GET /api/graph/presence/{email}` - Teams presence status (configurable cache, 30–300s)
- `POST /api/graph/check-send-permission` - Validate group send permissions (delegated auth)

### Admin & Authentication
- `POST /api/admin/login` - Admin JWT authentication
- `POST /api/admin/logout` - Invalidate admin session
- `POST /api/admin/emergency-login` - Emergency break-glass access
- `GET /api/admin/users` - List all admins (protected)
- `POST /api/admin/users` - Create new admin (protected)
- `DELETE /api/admin/users/{id}` - Remove admin (protected)
- `GET /api/audit-logs` - View audit trail (protected)

### Tenancy & Configuration
- `GET /api/tenancies` - List Office 365 tenancies (protected)
- `POST /api/tenancies` - Create new tenancy (protected)
- `PUT /api/tenancies/{id}` - Update tenancy settings (protected)
- `DELETE /api/tenancies/{id}` - Remove tenancy (protected)
- `GET /api/domains` - List SMTP domain mappings (protected)
- `POST /api/domains` - Map domain to tenancy (protected)
- `GET /api/tenancies/{id}/test-connection` - Test Graph API connectivity (protected)

### Add-in Support
- `GET /api/config/public` - Safe public metadata for task panes (name, org, feature flags)

Full API documentation: `/admin/api-docs`

## 🔐 Authentication Setup

### Azure Easy Auth Configuration
The application uses Azure Container Apps Easy Auth with two providers:

**Microsoft (Primary):**
- Tenant: Plan International Azure AD
- Auto-redirect for unauthenticated users
- Validates tenant ID via middleware

**GitHub (Admin):**
- Manual access via `/.auth/login/github`
- Restricted to allowed admin usernames
- Used for development and troubleshooting

### Microsoft Graph API Setup

**1. Create App Registration:**
- Azure Portal → Entra ID → App registrations
- Name: `PeoplePicker-GraphAPI`
- Single tenant only

**2. Required Permissions:**
- `User.Read.All` (Application) - For user data
- `Presence.Read.All` (Application) - For Teams presence

**3. Grant Admin Consent** for both permissions

**4. Add credentials to Azure Container App** as secrets:
- `ENTRA_TENANT_ID`
- `ENTRA_CLIENT_ID`
- `ENTRA_CLIENT_SECRET`

## ☁️ Azure Deployment

### Architecture
```
GitHub → Actions → Container Registry → Container App
                        ↓
                   Easy Auth Layer
                        ↓
                   Next.js App
                        ↓
               Okta + Graph API + Redis
```

### Initial Setup

**1. Create Azure Resources:**
- Container Apps Environment
- Container Registry
- Redis Cache (optional but recommended)

**2. Configure GitHub Actions:**
- Add secrets: `AZURE_CREDENTIALS`, `REGISTRY_LOGIN_SERVER`
  - `AZURE_CREDENTIALS` must be JSON with camelCased keys: `clientId`, `clientSecret`, `subscriptionId`, `tenantId`.
- Pipeline auto-builds on push to main

**3. Configure Container App:**
- Add environment variables (Okta, Graph API)
- Enable Easy Auth with Microsoft + GitHub
- Set health probe to `/api/health`

**4. Deploy:**
```bash
git push origin main
# GitHub Actions builds and deploys automatically
# Create new revision in Azure Portal
```

### Environment Variables (Production)
Set in Azure Container App → Configuration → Secrets:
```env
# Okta
okta-org-url=https://plan-international.okta.com
okta-api-token=<from-okta-admin>

# Microsoft Graph
ENTRA_TENANT_ID=<azure-tenant-id>
ENTRA_CLIENT_ID=<app-registration-client-id>
ENTRA_CLIENT_SECRET=<app-registration-secret>

# Redis (recommended)
redis-connection-string=<azure-redis-connection-string>

# Optional
search-results-limit=100
```

## 🎨 Key UI Features

### Search Interface
- **Left Panel:** Search results with photos, titles, location
- **Right Panel:** Selected user preview with contact info
- **Top Bar:** Search input with clear button (×)
- **Context Preservation:** Back navigation maintains search state

### User Profile Preview
- Profile photo with Teams presence indicator
- Title, Department, Organization
- Quick action buttons (Email, Teams chat)
- Contact information (email, phone, location)
- Manager link (clickable to manager's profile)

### Full Profile Page
- Comprehensive Okta profile data
- Organized sections:
  - Basic Information
  - Contact Information
  - Organization Details
  - Location & Preferences
  - System Information

### Diagnostics Page
- System health status
- Okta connectivity check
- Cache statistics (hit rate, keys, memory usage)
- Performance metrics
- One-click cache clearing
- Build information

## 📊 Performance

- **Initial Load:** <2s
- **Search Latency:** 200-500ms (Okta API + caching)
- **Photo Load:** Instant (cached) or ~500ms (first fetch)
- **Presence Update:** 5 minute cache, ~300ms fetch
- **Deployment:** 2-3 minutes via GitHub Actions
- **Container Size:** ~200MB

## 🔮 Development Roadmap

### Phase 1: Core Features ✅ COMPLETED
- [x] Okta integration
- [x] User search
- [x] Profile display
- [x] Profile photos
- [x] Teams presence

### Phase 2: Enterprise Features ✅ COMPLETED
- [x] Admin authentication system
- [x] Audit logging
- [x] Role-based access control
- [x] Multi-tenancy support
- [x] Domain routing
- [x] Feature flags
- [x] Outlook add-in
- [x] Group permission checks
- [x] Delegated authentication

### Phase 3: Advanced Features (In Progress)
- [x] Group send permission validation
- [x] Database-backed configuration
- [ ] Org chart visualization
- [ ] Manager hierarchy navigation
- [ ] Out of office status
- [ ] Recent searches history
- [ ] Keyboard shortcuts
- [ ] Rate limiting per tenancy

### Phase 4: Operational Excellence (Planned)
- [ ] Comprehensive E2E testing
- [ ] Performance monitoring dashboards
- [ ] Automated rollback on failures
- [ ] Infrastructure as Code (Bicep/Terraform)
- [ ] Azure Key Vault integration
- [ ] Structured logging with correlation IDs
- [ ] Azure Monitor alerting
- [ ] CDN for static assets

## 📚 Documentation

The repository includes extensive documentation:

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Comprehensive system architecture documentation
- **[ADMIN_SYSTEM.md](./ADMIN_SYSTEM.md)** - Admin authentication and management guide
- **[QUICK_START_ADMIN.md](./QUICK_START_ADMIN.md)** - Quick start guide for admins
- **[TENANCY_FEATURE_GUIDE.md](./TENANCY_FEATURE_GUIDE.md)** - Multi-tenancy setup guide
- **[CONFIGURATION_DEPLOYMENT.md](./CONFIGURATION_DEPLOYMENT.md)** - Deployment configuration
- **[docs/ADDIN_DEV.md](./docs/ADDIN_DEV.md)** - Outlook add-in development guide
- **[docs/ADDIN_DEPLOY.md](./docs/ADDIN_DEPLOY.md)** - Outlook add-in deployment guide
- **[VISUAL_GUIDE.md](./VISUAL_GUIDE.md)** - Visual walkthrough of features

## 🗄️ Database Schema

The application uses Azure SQL Database with the following tables:

- **admins** - Admin user accounts
- **audit_logs** - Comprehensive audit trail of all admin actions
- **configurations** - Key-value configuration store (supports encryption)
- **office_tenancies** - Office 365 tenant configurations with feature flags
- **smtp_domains** - Email domain to tenancy mappings

See [apps/web/prisma/schema.prisma](./apps/web/prisma/schema.prisma) for the complete schema.

## 🛠️ Troubleshooting

### Common Issues

**Database connection errors:**
- Verify `DATABASE_URL` is correctly formatted
- Ensure Azure SQL firewall allows your IP
- Run `npx prisma migrate deploy` to apply schema
- Check connection string encoding for special characters

**Admin login fails:**
- Verify `JWT_SECRET` is set and consistent
- Check admin exists in database: `SELECT * FROM admins WHERE email = 'your-email'`
- For emergency access, verify `BREAK_GLASS_URL_TOKEN` matches URL parameter

**Photos not loading:**
- Check Graph API permissions granted
- Verify `ENTRA_*` credentials in Azure
- Check logs: `/technical` page
- Ensure tenancy is configured with `enablePhotos` flag

**Presence not showing:**
- Ensure `Presence.Read.All` permission granted
- Check 5-minute cache hasn't expired
- Verify tenancy has `enablePresence` flag enabled
- Some users may have presence disabled

**Group permissions not working:**
- Ensure `Group.Read.All` permission granted
- Check tenancy `enableGroupSendCheck` flag
- Verify user has delegated token available
- Check fallback to application permissions

**Search slow:**
- Enable Redis caching
- Check Okta API rate limits
- Review cache hit rate in diagnostics

**Build failures:**
- Verify all dependencies in `package.json`
- Check TypeScript errors: `npm run typecheck`
- Run `npm run prisma:generate` before build
- Review GitHub Actions logs

### Debug Tools
- **Admin Dashboard:** `/admin/dashboard` - Tenancy management, audit logs
- **System Information:** `/technical` - Build info, environment details
- **Cache Stats:** System Information page → Cache statistics
- **Cache Clear:** System Information page → "Clear All Cache" button
- **Diagnostics:** `/diagnostics` - Health metrics, API connectivity
- **Logs:** Azure Portal → Container App → Log stream
- **Database:** Azure Portal → SQL Database → Query editor

## 🤝 Contributing

Internal tool for Plan International. For questions or issues:
1. Check diagnostics page
2. Review Azure logs
3. Contact IT development team

## 📄 License

Proprietary - Plan International Internal Use Only

---

## 📊 Repository Statistics

- **Lines of Code:** ~15,000+ (TypeScript, React, SQL)
- **API Endpoints:** 30+
- **Database Tables:** 5
- **Active Development:** Yes
- **Production Status:** Deployed
- **Test Coverage:** In progress

---

**Version:** 3.0
**Last Updated:** November 2025
**Maintained By:** Plan International IT Team
**Architecture:** Monorepo with npm workspaces
**Primary Branch:** `main`
**Development Branch:** `claude/update-readme-app-status-*`
