# PeoplePickerc21 - Org Contact Lookup

Production-ready containerized people directory application with Okta integration.

## Features

- 🔍 Real-time search across Okta directory
- 📊 Comprehensive diagnostics dashboard
- 🐳 Docker containerized for consistent deployments
- 🚀 Fast 2-3 minute deployments via GitHub Actions
- 📱 Responsive design with CSS Modules
- 🔐 Secure environment variable management
- 📈 Cache statistics and performance monitoring
- 🎯 Clean RESTful API architecture

## Tech Stack

- Next.js 14 App Router
- TypeScript (strict mode)
- Node 20 LTS
- Docker & Docker Compose
- CSS Modules (no frameworks)
- Azure Container Apps
- GitHub Actions CI/CD

## Quick Start

### Local Development

1. Clone repository:
```bash
   git clone https://github.com/YOUR_USERNAME/PeoplePickerc21.git
   cd PeoplePickerc21
```

2. Install dependencies:
```bash
   npm install
```

3. Create environment file:
```bash
   cp .env.local.example .env.local
```

4. Add your Okta credentials to .env.local:
```
   okta-org-url=https://your-org.okta.com
   okta-api-token=your_token_here
   cache-type=memory
   cache-ttl-seconds=600
```

5. Run development server:
```bash
   npm run dev
```

6. Open http://localhost:3000

### Docker Development

1. Build and run with Docker Compose:
```bash
   docker-compose up --build
```

2. Access at http://localhost:3000

## Project Structure
```
PeoplePickerc21/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Main dashboard
│   ├── diagnostics/       # Detailed metrics
│   ├── api-docs/          # API documentation
│   ├── user/[id]/         # User profiles
│   └── api/               # API routes
├── components/            # React components
│   ├── dashboard/         # Dashboard components
│   ├── search/            # Search components
│   └── diagnostics/       # Diagnostic components
├── lib/                   # Utilities and hooks
│   ├── types.ts          # TypeScript types
│   ├── okta.ts           # Okta API client
│   ├── cache.ts          # Cache abstraction
│   └── hooks/            # Custom React hooks
├── Dockerfile            # Container definition
├── docker-compose.yml    # Local Docker setup
└── .github/workflows/    # CI/CD pipelines
```

## API Endpoints

- `GET /api/health` - System health status
- `GET /api/okta/ping` - Okta connectivity test
- `GET /api/okta/users?q={query}` - Search users
- `GET /api/okta/users/sample` - Sample users
- `GET /api/okta/users/{id}` - Get specific user

Full documentation available at `/api-docs`

## Deployment to Azure

Detailed Azure deployment instructions will be provided separately.

The application is designed to run on Azure Container Apps with:
- Azure Container Registry for image storage
- GitHub Actions for automated builds and deployments
- Environment variables managed in Azure Portal

## Environment Variables

### Required (Production)
- `okta-org-url` - Your Okta organization URL
- `okta-api-token` - Okta API token with read access

### Optional
- `cache-ttl-seconds` - Cache duration (default: 600)
- `cache-type` - Cache implementation (memory or redis)

**Security Note:** Never commit .env.local to git. Use Azure Application Settings for production.

## Architecture Decisions

### Why Containers?
- Consistent builds across environments
- Fast deployments (2-3 minutes vs 10+ with App Service)
- No Oryx build issues
- Easy rollbacks

### Why CSS Modules?
- No framework dependencies
- Predictable styling
- No build-time class name issues
- Better for AI-assisted development

### Why Memory Cache?
- Simple for single-instance development
- Easy to swap to Redis for production scaling
- Clear performance metrics

## Performance

- Initial page load: <2s
- Search latency: 200-500ms (includes Okta API)
- Deployment time: 2-3 minutes
- Container size: ~150MB

## Contributing

This is an internal tool. For issues or suggestions, contact the development team.

## License

Proprietary - Internal use only.
