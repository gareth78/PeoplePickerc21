# People Finder - Enterprise Directory Search

Modern, production-ready people directory application integrating Okta user data with Microsoft 365 presence and profile photos.

## ✨ Features

### Core Functionality
- 🔍 **Real-time Search** - Fast search across Okta directory by name, title, department, location
- 👤 **Rich User Profiles** - Comprehensive user information with contact details and org context
- 📸 **Profile Photos** - Microsoft Entra ID profile pictures with 24-hour caching
- 🟢 **Teams Presence** - Real-time availability status with official Microsoft icons
- 🔗 **Manager Navigation** - Clickable manager links to navigate org hierarchy
- ✖️ **Smart Search UX** - Clear button and preserved context on navigation

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
- Microsoft Fluent UI Icons

**Backend:**
- Node.js 20 LTS
- Okta API integration
- Microsoft Graph API
- Redis caching layer

**Infrastructure:**
- Docker containerization
- Azure Container Apps
- Azure Container Registry
- GitHub Actions CI/CD
- Azure Easy Auth

## 🚀 Quick Start

### Prerequisites
- Node.js 20 LTS
- Docker Desktop (optional, for local container testing)
- Azure subscription (for deployment)
- Okta admin access (for API token)
- Microsoft Entra ID admin access (for Graph API)

### Local Development

1. **Clone and install:**
```bash
git clone https://github.com/YOUR_ORG/PeoplePickerc21.git
cd PeoplePickerc21
npm install
```

2. **Configure environment:**
```bash
cp .env.local.example .env.local
```

3. **Add credentials to `.env.local`:**
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
```

### SQL Server configuration

- `DATABASE_URL` must point to Azure SQL using the SQL Server driver:

  ```env
  DATABASE_URL="sqlserver://USERNAME:PASSWORD@SERVERNAME.database.windows.net:1433?database=DBNAME&encrypt=true&trustServerCertificate=false&connectionTimeout=30"
  INITIAL_ADMIN_EMAIL=admin@example.com
  ```

- URL-encode any reserved characters (such as `@`, `#`, `%`, or `:`) inside the password.
- Provide the same `DATABASE_URL` at build time (`npm run build`) and runtime (Azure Container Apps environment variables) so Prisma targets the correct database.
- After the app starts, confirm connectivity via:
  - `GET /api/ping` → returns `{ "ok": true }`
  - `GET /api/admin/check` (with your auth context) → returns `{ "isAdmin": true }` once the admin bootstrap has run.

4. **Run development server:**
```bash
npm run dev
```

5. **Open:** http://localhost:3000

### Docker Development
```bash
docker-compose up --build
```

Access at http://localhost:3000

## 📁 Project Structure
```
PeoplePickerc21/
├── app/
│   ├── page.tsx                    # Main search interface
│   ├── user/[id]/                  # Full user profile pages
│   ├── diagnostics/                # System diagnostics
│   ├── technical/                  # Technical details page
│   └── api/
│       ├── okta/                   # Okta API routes
│       │   └── users/              # User search & lookup
│       ├── graph/
│       │   ├── photo/              # Profile photo fetching
│       │   └── presence/           # Teams presence status
│       └── cache/                  # Cache management
├── components/
│   ├── search/
│   │   ├── SearchInterface.tsx     # Main search UI
│   │   └── UserCard.tsx            # Search result cards
│   ├── UserAvatar.tsx              # Avatar with photo & presence
│   ├── PresenceBadge.tsx           # Teams status indicator
│   └── diagnostics/                # Diagnostic components
├── lib/
│   ├── okta.ts                     # Okta API client
│   ├── graph.ts                    # Microsoft Graph client
│   ├── redis.ts                    # Redis caching
│   └── types.ts                    # TypeScript definitions
├── middleware.ts                   # Authentication middleware (future)
├── Dockerfile                      # Container definition
├── docker-compose.yml              # Local Docker setup
└── .github/workflows/
    └── azure-container-deploy.yml  # CI/CD pipeline
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
- `GET /api/graph/presence/{email}` - Teams presence status (5min cache)

Full API documentation: `/api-docs` (coming soon)

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

## 🔮 Roadmap

### Phase 1: Core Features ✅
- [x] Okta integration
- [x] User search
- [x] Profile display
- [x] Profile photos
- [x] Teams presence

### Phase 2: Security & Polish (In Progress)
- [ ] Tenant validation middleware
- [ ] Audit logging
- [ ] Role-based access control
- [ ] Rate limiting
- [ ] Reorganize technical page
- [ ] Enhanced UX features

### Phase 3: Advanced Features
- [ ] Group search
- [ ] Org chart visualization
- [ ] Manager hierarchy navigation
- [ ] Out of office status
- [ ] Recent searches history
- [ ] Keyboard shortcuts

## 🛠️ Troubleshooting

### Common Issues

**Photos not loading:**
- Check Graph API permissions granted
- Verify `ENTRA_*` credentials in Azure
- Check logs: `/technical` page

**Presence not showing:**
- Ensure `Presence.Read.All` permission granted
- Check 5-minute cache hasn't expired
- Some users may have presence disabled

**Search slow:**
- Enable Redis caching
- Check Okta API rate limits
- Review cache hit rate in diagnostics

**Build failures:**
- Verify all dependencies in `package.json`
- Check TypeScript errors: `npm run build`
- Review GitHub Actions logs

### Debug Tools
- **System Information:** `/technical`
- **Cache Clear:** System Information page → "Clear All Cache" button
- **Logs:** Azure Portal → Container App → Log stream

## 🤝 Contributing

Internal tool for Plan International. For questions or issues:
1. Check diagnostics page
2. Review Azure logs
3. Contact IT development team

## 📄 License

Proprietary - Plan International Internal Use Only

---

**Version:** 2.0  
**Last Updated:** October 2025  
**Maintained By:** Plan International IT Team.
