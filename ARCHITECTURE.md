# Architecture Overview — PeoplePickerc21

**Version:** 0.1.0
**Last Updated:** 2025-10-29
**Document Purpose:** Comprehensive system architecture documentation for the PeoplePickerc21 organizational contact lookup application.

---

## Table of Contents

1. [High-Level System Context](#1-high-level-system-context)
2. [Module & Folder Breakdown](#2-module--folder-breakdown)
3. [Runtime Behavior](#3-runtime-behavior)
4. [Configuration & Environment](#4-configuration--environment)
5. [Security Posture](#5-security-posture)
6. [Observability](#6-observability)
7. [Deployment Pipeline](#7-deployment-pipeline)
8. [Architecture Diagrams](#8-architecture-diagrams)
9. [Risks & Technical Debt](#9-risks--technical-debt)

---

## 1. High-Level System Context

### 1.1 Purpose

PeoplePickerc21 is an organizational contact lookup application that enables employees to search and connect with colleagues through an Okta directory integration. The system provides real-time search capabilities with optional Redis caching for performance optimization.

### 1.2 Users & Use Cases

**Primary Users:**
- Internal employees searching for colleague contact information
- System administrators monitoring application health
- Developers accessing API documentation

**Core Use Cases:**
1. Search for employees by name, title, or email
2. View detailed employee profiles (title, department, location, contact info)
3. Quickly initiate communication via email or Microsoft Teams
4. Monitor system health and cache performance
5. Validate Okta connectivity and API integration

### 1.3 Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Framework** | Next.js (App Router) | 14.2.33 |
| **Runtime** | Node.js | 20.x LTS |
| **Language** | TypeScript (strict mode) | 5.x |
| **UI Library** | React | 18.x |
| **Styling** | Tailwind CSS + CSS Modules | 3.4.18 |
| **Caching** | ioredis (optional) | 5.8.2 |
| **Container** | Docker (Alpine) | Multi-stage |
| **CI/CD** | GitHub Actions | - |
| **Hosting** | Azure Container Apps | - |

### 1.4 External Services

**Okta Identity Platform**
- **Purpose:** User directory and authentication
- **API:** Okta Users API v1 (REST)
- **Authentication:** SSWS (Simple Signed Web Services) token
- **Operations:** User search, user retrieval by ID
- **Rate Limits:** Subject to Okta API rate limits (handles 429 responses with exponential backoff)

**Redis Cache (Optional)**
- **Purpose:** Distributed caching layer for search results and user profiles
- **Client:** ioredis with connection pooling
- **Deployment:** Azure Cache for Redis or Azure Managed Redis
- **Fallback:** Application gracefully degrades if Redis unavailable

**Microsoft Teams & Outlook**
- **Purpose:** Deep linking for quick communication
- **Integration:** Client-side URL schemes (mailto:, teams://chat)

### 1.5 Azure Resources

Based on codebase analysis, the following Azure resources are utilized:

| Resource | Purpose | Configuration Source |
|----------|---------|---------------------|
| **Azure Container Registry (ACR)** | Docker image storage | GitHub secrets: `AZURE_CONTAINER_REGISTRY` |
| **Azure Container Apps** | Application hosting | Manual deployment (unclear in codebase) |
| **Azure Cache for Redis** (optional) | Distributed caching | Connection string via env var |
| **Application Insights** (optional) | Telemetry & monitoring | Not explicitly configured in codebase |

**Note:** The codebase contains CI/CD for building and pushing to ACR, but deployment to Azure Container Apps appears to require manual steps (not automated in workflows).

### 1.6 Frontend Architecture

**Pattern:** Next.js App Router with Server/Client Component separation

- **Server Components:** Page layouts, direct Okta API calls (user profile page)
- **Client Components:** Interactive search interface, diagnostics dashboard
- **Data Fetching:** API routes for client-side data, direct Okta calls for SSR
- **Styling:** Tailwind utility classes + CSS Modules for component-specific styles

---

## 2. Module & Folder Breakdown

### 2.1 Directory Structure

```
PeoplePickerc21/
├── app/                          # Next.js 14 App Router
│   ├── api/                      # API route handlers
│   │   ├── health/
│   │   │   └── route.ts         # System health endpoint
│   │   ├── okta/
│   │   │   ├── ping/route.ts    # Okta connectivity test
│   │   │   └── users/
│   │   │       ├── route.ts     # User search endpoint
│   │   │       ├── [id]/route.ts # Single user retrieval
│   │   │       └── sample/route.ts # Sample data
│   │   └── cache/
│   │       └── stats/route.ts   # Cache statistics
│   ├── user/[id]/
│   │   ├── page.tsx             # Server-rendered user profile
│   │   └── page.module.css      # Profile page styles
│   ├── diagnostics/
│   │   ├── page.tsx             # Diagnostics page wrapper
│   │   ├── DiagnosticsClient.tsx # Client diagnostics UI
│   │   └── page.module.css
│   ├── api-docs/
│   │   ├── page.tsx             # API documentation page
│   │   └── page.module.css
│   ├── technical/
│   │   └── page.tsx             # Technical details & build info
│   ├── layout.tsx               # Root layout with metadata
│   ├── page.tsx                 # Home page (search interface)
│   └── globals.css              # Global Tailwind styles
│
├── components/                   # Reusable React components
│   ├── search/
│   │   ├── SearchInterface.tsx  # Main search UI (254 lines)
│   │   ├── SearchResults.tsx    # Results list component
│   │   ├── UserCard.tsx         # Individual user card
│   │   ├── SearchInput.tsx      # Search input component
│   │   └── *.module.css         # Component-specific styles
│   ├── diagnostics/
│   │   ├── HealthMetrics.tsx    # Health dashboard component
│   │   └── HealthMetrics.module.css
│   └── dashboard/
│       └── DiagnosticCard.tsx   # Reusable card component
│
├── lib/                          # Shared utilities & business logic
│   ├── okta.ts                  # Okta API client (209 lines)
│   ├── redis.ts                 # Redis caching layer (238 lines)
│   ├── types.ts                 # TypeScript type definitions
│   ├── fetcher.ts               # HTTP utility wrapper
│   └── hooks/
│       ├── useSearch.ts         # Search state management
│       ├── useHealth.ts         # Health metrics hook
│       └── useDebounce.ts       # Debounce utility hook
│
├── public/                       # Static assets
│   └── icons/
│       ├── OutlookAppIcon.jpg
│       └── TeamsAppIcon.jpg
│
├── .github/
│   └── workflows/
│       └── build-and-push.yml   # CI/CD to ACR
│
├── Configuration Files
│   ├── package.json             # Dependencies & scripts
│   ├── tsconfig.json            # TypeScript strict config
│   ├── next.config.js           # Next.js standalone output
│   ├── tailwind.config.js       # Custom theme
│   ├── postcss.config.js        # CSS processing
│   ├── .env.local.example       # Environment template
│   ├── docker-compose.yml       # Local dev setup
│   ├── Dockerfile               # Multi-stage production build
│   └── README.md                # Project documentation
```

### 2.2 Key Modules

#### 2.2.1 `lib/okta.ts` (209 lines)

**Purpose:** Okta Users API client with retry logic and rate limit handling

**Exports:**
- `searchUsers(query, limit, cursor)` - Search users with pagination
- `getUserById(id)` - Retrieve single user by ID
- `searchUserByEmail(email)` - Find user by exact email match
- `normalizeUser(oktaUser)` - Transform Okta format to internal User type

**Key Features:**
- Exponential backoff retry (max 3 retries, 1s base delay)
- 10-second timeout protection with AbortController
- Multi-term search with complex filter generation
- Link header parsing for pagination cursors
- Results sorted alphabetically by displayName

**Error Handling:**
- Detects rate limits (429 status or "rate limit" in error message)
- Validates environment variables on each request
- Throws descriptive errors for HTTP failures

#### 2.2.2 `lib/redis.ts` (238 lines)

**Purpose:** Redis caching abstraction with graceful fallback

**Exports:**
- `getRedisClient()` - Singleton Redis client instance
- `getCacheStats()` - Connection status, key count, memory, hit rate
- `cacheGet<T>(key)` - Retrieve cached value
- `cacheSet(key, value, ttl)` - Store value with TTL
- `cacheDelete(key)` - Remove single key
- `cacheClear()` - Flush entire database

**TTL Configuration:**
```typescript
TTL.PHOTO = 86400 sec    // 24 hours
TTL.PROFILE = 14400 sec  // 4 hours
TTL.SEARCH = 3600 sec    // 1 hour
TTL.PRESENCE = 300 sec   // 5 minutes (future use)
```

**Key Features:**
- Singleton pattern prevents multiple connections
- Retry strategy: 50ms * retry_count (max 2000ms)
- Supports Azure Managed Redis (handles different INFO response formats)
- Graceful degradation: returns null if Redis unavailable
- Connection event logging for diagnostics

#### 2.2.3 `lib/types.ts`

**Core Type Definitions:**

```typescript
User                    // Normalized user profile
OktaUser               // Raw Okta API response
SearchResult           // Search response with pagination
ApiResponse<T>         // Generic API wrapper
HealthStatus           // System health metrics
DiagnosticMetrics      // Combined health + Okta status
CacheStats             // Redis performance metrics
```

### 2.3 Notable Data Flows

#### Search Flow (with caching)
```
User Input (SearchInterface)
  → debounce (300ms) → useSearch hook
    → fetch /api/okta/users?q=query
      → route.ts: Check Redis cache (key: search:{query}:{cursor})
        → Cache HIT: Return cached result
        → Cache MISS: searchUsers(query) → Okta API
          → Store in Redis (TTL: 1 hour)
          → Return fresh result
```

#### User Profile Flow
```
User clicks profile → /user/[id]
  → Server Component (page.tsx)
    → Direct Okta API call: getUserById(id)
      → No caching at route level (server-side rendering)
      → Returns 404 if user not found
```

#### Health Check Flow
```
Diagnostics Page → useHealth hook
  → Promise.all([
      fetch /api/health → Node metrics
      fetch /api/okta/ping → Okta connectivity test
    ])
  → Display combined metrics with refresh capability
```

### 2.4 Dependency Hotspots

**Critical Dependencies:**
1. **Okta API availability** - Application cannot function without Okta access
2. **Environment variables** - Missing `okta-org-url` or `okta-api-token` causes runtime failures
3. **Redis connection** (optional) - Degraded performance without caching, but non-blocking

**Internal Coupling:**
- All API routes depend on `lib/okta.ts` and `lib/redis.ts`
- Client components depend on API route contracts (ApiResponse<T>)
- Search interface tightly coupled to `useSearch` and `useDebounce` hooks
- Type definitions (`lib/types.ts`) used across entire application

---

## 3. Runtime Behavior

### 3.1 Request Flow

```
┌──────────────────────────────────────────────────────────────┐
│ 1. INCOMING REQUEST                                           │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ 2. NEXT.JS ROUTING                                            │
│    • App router matches route                                 │
│    • No custom middleware (middleware.ts not present)         │
│    • Runtime: nodejs (specified in API routes)               │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ 3. ROUTE HANDLER (API routes) or SERVER COMPONENT (pages)    │
│    • Parse query parameters                                   │
│    • Validate input (e.g., query length >= 2)                │
│    • Check Redis cache (if applicable)                       │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ 4. OKTA API CALL (if cache miss)                             │
│    • lib/okta.ts: validateOktaConfig()                       │
│    • Construct URL with search parameters                    │
│    • Set SSWS Authorization header                           │
│    • AbortController timeout (10 seconds)                    │
│    • Execute fetch with exponential backoff retry            │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ 5. ERROR HANDLING & RETRY LOGIC                              │
│    • Rate limit (429): Exponential backoff (1s, 2s, 4s)     │
│    • Timeout: AbortController cancels request                │
│    • Network errors: Propagate to caller                     │
│    • HTTP errors: Throw with status code                     │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ 6. RESPONSE TRANSFORMATION                                    │
│    • Parse Okta response JSON                                │
│    • Normalize users with normalizeUser()                    │
│    • Sort alphabetically by displayName                      │
│    • Extract pagination cursor from Link header             │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ 7. CACHE STORAGE (async, fire-and-forget)                    │
│    • cacheSet(key, result, TTL.SEARCH)                       │
│    • Errors logged but don't block response                  │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ 8. HTTP RESPONSE                                              │
│    • Success: 200 with ApiResponse<T> format                 │
│    • Validation error: 400 with error message                │
│    • Server error: 500 with error message                    │
│    • Cache-Control: no-store (for dynamic endpoints)         │
└──────────────────────────────────────────────────────────────┘
```

### 3.2 Authentication Flow

**Current State:** No user authentication implemented

The application currently has **no authentication or authorization layer**. It relies on:

1. **Network-level security:** Expected to run in a private network or behind Azure AD App Proxy
2. **Okta API token security:** Server-side token never exposed to client
3. **Environment variable protection:** Secrets stored in Azure App Settings (not in code)

**Okta Integration Pattern:**
- Uses **SSWS token authentication** (server-to-server)
- Token format: `Authorization: SSWS {api-token}`
- Token stored in environment variable: `okta-api-token`
- No OAuth flows or user login implemented

**Future consideration:** Add Azure AD authentication for user-level access control.

### 3.3 Error Handling Patterns

#### API Route Error Handling
```typescript
try {
  // Route logic
  return NextResponse.json({ ok: true, data: result });
} catch (error) {
  return NextResponse.json(
    { ok: false, error: error.message },
    { status: 500 }
  );
}
```

#### Okta Client Error Handling
```typescript
// Exponential backoff retry wrapper
async function fetchWithRetry(fn, retryCount = 0) {
  try {
    return await fn();
  } catch (error) {
    if (isRateLimit && retryCount < MAX_RETRIES) {
      await sleep(RETRY_DELAY_MS * Math.pow(2, retryCount));
      return fetchWithRetry(fn, retryCount + 1);
    }
    throw error; // Re-throw after max retries
  }
}
```

#### Redis Error Handling
```typescript
// Graceful fallback pattern
export async function cacheGet(key) {
  const client = getRedisClient();
  if (!client) return null; // Degraded mode

  try {
    // ... cache logic
  } catch (error) {
    console.error('Cache error:', error);
    return null; // Non-blocking failure
  }
}
```

### 3.4 Logging & Telemetry Points

**Console Logging:**
- Redis connection events: `✅ Redis connected`
- Cache stats debugging: `📊 getCacheStats: ...`
- Redis errors: `console.error('Redis error:', err)`
- Cache operation failures: `console.error('Cache get error:', error)`
- Failed cache writes: `console.error('Failed to cache search result:', err)`

**Structured Logging (not implemented):**
- No structured logging library (e.g., Winston, Pino)
- No request ID tracking
- No correlation IDs across service boundaries

**Telemetry Endpoints:**
- `GET /api/health` - System uptime, Node version, environment
- `GET /api/okta/ping` - Okta connectivity with latency measurement
- `GET /api/cache/stats` - Redis stats (keys, memory, hit rate)

**Application Insights Integration:** Not explicitly configured in codebase

---

## 4. Configuration & Environment

### 4.1 Environment Variables

| Variable | Type | Required | Default | Purpose | Set Where |
|----------|------|----------|---------|---------|-----------|
| `okta-org-url` | string | **Yes** | - | Okta organization URL (e.g., https://org.okta.com) | Azure App Settings |
| `okta-api-token` | string | **Yes** | - | Okta SSWS API token | Azure App Settings (secret) |
| `redis-connection-string` | string | No | - | Redis connection string (ioredis format) | Azure App Settings |
| `REDIS_CONNECTION_STRING` | string | No | - | Alternative Redis connection string | Azure App Settings |
| `search-results-limit` | number | No | 100 | Max results per search query | Azure App Settings |
| `NODE_ENV` | string | No | development | Node environment (production/development) | Runtime (Docker) |
| `PORT` | number | No | 3000 | HTTP server port | Runtime (Docker) |
| `HOSTNAME` | string | No | 0.0.0.0 | Server bind address | Runtime (Docker) |

### 4.2 Deployment-Time vs Runtime

**Deployment-Time (Build):**
- No build-time environment variable interpolation
- Next.js builds with `output: 'standalone'` for containerization
- Docker image baked with production dependencies only

**Runtime (Container Start):**
- All environment variables read at runtime via `process.env`
- `okta-org-url` and `okta-api-token` validated on first API call
- Redis connection established lazily on first cache operation
- Server starts with `node server.js` (standalone Next.js server)

### 4.3 Configuration Sources

1. **Azure App Service Configuration (Production)**
   - Navigate to: Azure Portal → App Service → Configuration → Application settings
   - Add environment variables as key-value pairs
   - Mark `okta-api-token` and `redis-connection-string` as sensitive (slot setting)

2. **Local Development**
   - Copy `.env.local.example` → `.env.local`
   - Next.js automatically loads `.env.local` in development mode
   - **Never commit `.env.local` to git**

3. **Docker Compose (Local Testing)**
   - Environment variables defined in `docker-compose.yml`
   - Override with `.env` file if needed

### 4.4 Proposed .env.example

```bash
# ====================================================================
# PeoplePickerc21 Environment Configuration
# ====================================================================
# Copy this file to .env.local for local development
# For production, set these in Azure App Service Configuration
# ====================================================================

# --------------------------------------------------------------------
# OKTA CONFIGURATION (Required)
# --------------------------------------------------------------------
okta-org-url=https://your-org.okta.com
okta-api-token=00XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# --------------------------------------------------------------------
# REDIS CONFIGURATION (Optional)
# --------------------------------------------------------------------
# Format: redis://[[username:]password@]host[:port][/db-number]
# Azure Managed Redis: rediss://default:PASSWORD@HOST:6380/0?ssl=true
redis-connection-string=redis://localhost:6379/0

# Alternative format (fallback)
# REDIS_CONNECTION_STRING=redis://localhost:6379/0

# --------------------------------------------------------------------
# SEARCH CONFIGURATION (Optional)
# --------------------------------------------------------------------
# Maximum number of results returned per search query
search-results-limit=100

# --------------------------------------------------------------------
# NODE ENVIRONMENT (Set automatically by Docker/Azure)
# --------------------------------------------------------------------
# NODE_ENV=production
# PORT=3000
# HOSTNAME=0.0.0.0

# ====================================================================
# SECURITY NOTES:
# - Never commit this file with real credentials
# - Use Azure Key Vault for production secrets (future enhancement)
# - Rotate okta-api-token regularly
# - Use TLS for Redis connections in production (rediss://)
# ====================================================================
```

### 4.5 Configuration Validation

**Startup Validation:**
- Okta configuration validated on first API call (not at startup)
- Redis connection validated lazily (logs warning if unavailable)

**Runtime Validation:**
- Search query length: minimum 2 characters (400 error if invalid)
- User ID format: no validation (trusts Okta format)
- Pagination cursor: no validation (trusts Okta Link header)

**Recommendation:** Add startup health check that validates critical config before accepting traffic.

---

## 5. Security Posture

### 5.1 Okta Integration Security

**Authentication Method:**
- Uses **SSWS (Simple Signed Web Services) token**
- Token scope: Read-only access to Okta Users API
- Token stored server-side only (never exposed to client)

**Token Handling:**
```typescript
// lib/okta.ts
const OKTA_API_TOKEN = process.env['okta-api-token'];

headers: {
  Authorization: `SSWS ${OKTA_API_TOKEN}`
}
```

**Security Strengths:**
- ✅ Token never sent to client
- ✅ Token loaded from environment (not hardcoded)
- ✅ Read-only API access (cannot modify users)

**Security Risks:**
- ⚠️ No token rotation mechanism
- ⚠️ Token not stored in Azure Key Vault
- ⚠️ No validation of Okta SSL certificate pinning

### 5.2 CORS & Request Security

**CORS Configuration:** Not explicitly configured (Next.js defaults)

- Next.js API routes allow same-origin requests by default
- No CORS headers set in route handlers
- **Risk:** If deployed without proper network boundaries, could be accessed from any origin

**Recommendation:**
```typescript
// Add CORS middleware for API routes
headers: {
  'Access-Control-Allow-Origin': 'https://your-domain.com',
  'Access-Control-Allow-Methods': 'GET',
  'Access-Control-Allow-Headers': 'Content-Type',
}
```

### 5.3 Session & Cookie Usage

**Current State:** No session management or cookies used

- Application is stateless (no user login)
- No authentication cookies
- No session storage (Redis not used for sessions)

**Implication:** Application relies entirely on network-level security (Azure Private Link, VPN, or Azure AD App Proxy).

### 5.4 Secret Storage

| Secret | Storage Location | Security Level | Recommendation |
|--------|------------------|----------------|----------------|
| Okta API Token | Azure App Settings | ⚠️ Medium | Migrate to Azure Key Vault |
| Redis Password | Connection string in App Settings | ⚠️ Medium | Migrate to Azure Key Vault |
| ACR Credentials | GitHub Secrets | ✅ Good | Keep as-is |

**Azure Key Vault Integration (not implemented):**
```typescript
// Future enhancement
import { SecretClient } from '@azure/keyvault-secrets';

const vaultUrl = process.env.AZURE_KEY_VAULT_URL;
const client = new SecretClient(vaultUrl, credential);
const oktaToken = await client.getSecret('okta-api-token');
```

### 5.5 Input Validation & Sanitization

**Query Parameters:**
- ✅ Search query: Minimum length validation (2 characters)
- ✅ User ID: Used as-is in URL path (Okta validates format)
- ❌ Pagination cursor: No validation (trusts Okta Link header)

**Injection Risks:**
- ✅ SQL Injection: N/A (no database queries)
- ✅ NoSQL Injection: Redis keys are string interpolations, but no user input in key names
- ⚠️ SSRF: Okta URL constructed from env var (risk if env var compromised)

**Recommendation:** Validate Okta org URL format at startup:
```typescript
if (!OKTA_ORG_URL.match(/^https:\/\/[a-z0-9-]+\.okta\.com$/)) {
  throw new Error('Invalid Okta org URL format');
}
```

### 5.6 Least Privilege Principles

**Docker Container:**
- ✅ Runs as non-root user (`nextjs:1001`)
- ✅ Minimal Alpine base image
- ✅ No shell access in production

**Okta API Token:**
- ✅ Read-only access to Users API
- ⚠️ Recommendation: Use Okta API scopes to further limit access

**Redis Access:**
- ⚠️ Full database access (can FLUSHDB)
- Recommendation: Use Redis ACLs to restrict commands

**Azure Container Apps:**
- Unclear in codebase (manual deployment)
- Recommendation: Use managed identity for ACR pull (avoid storing credentials)

### 5.7 Security Headers

**Current Headers:**
- `Cache-Control: no-store` (dynamic endpoints)

**Missing Security Headers:**
- ❌ `Strict-Transport-Security` (HSTS)
- ❌ `X-Content-Type-Options: nosniff`
- ❌ `X-Frame-Options: DENY`
- ❌ `Content-Security-Policy`

**Recommendation:** Add security headers in `next.config.js`:
```javascript
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      ],
    },
  ];
}
```

---

## 6. Observability

### 6.1 Logging

**Current Logging:**
- **Level:** Console output only (stdout/stderr)
- **Format:** Unstructured text logs
- **Destination:** Container logs (captured by Azure Container Apps)

**Log Examples:**
```javascript
console.log('✅ Redis connected');
console.error('Redis error:', err);
console.warn('Redis connection string not found. Caching disabled.');
console.error('📊 getCacheStats error:', error);
```

**Log Aggregation:**
- Azure Container Apps: Logs available via Azure Portal → Log stream
- Azure Monitor: Can configure log analytics workspace for aggregation

**Limitations:**
- ❌ No structured logging (JSON format)
- ❌ No log levels (DEBUG, INFO, WARN, ERROR)
- ❌ No request correlation IDs
- ❌ No user action tracking

### 6.2 Health Checks

**Endpoint:** `GET /api/health`

**Response:**
```json
{
  "ok": true,
  "status": 200,
  "timestamp": "2025-10-29T12:00:00.000Z",
  "environment": "production",
  "nodeVersion": "v20.x.x",
  "uptime": 3600
}
```

**Checks Performed:**
- ✅ Node.js process is running
- ✅ Environment variable available
- ❌ Does NOT check Okta connectivity
- ❌ Does NOT check Redis connectivity

**Okta Connectivity Check:** `GET /api/okta/ping`

**Response:**
```json
{
  "ok": true,
  "connected": true,
  "latency": 234
}
```

**Implementation:**
```typescript
const start = Date.now();
await searchUsers('', 1); // Minimal search as connectivity test
const latency = Date.now() - start;
```

**Cache Health Check:** `GET /api/cache/stats`

**Response:**
```json
{
  "ok": true,
  "data": {
    "connected": true,
    "keys": 42,
    "memoryUsed": "2.34M",
    "hits": 1234,
    "misses": 567,
    "hitRate": "68.5%"
  }
}
```

### 6.3 Verifying Application Health Post-Deploy

**Step-by-Step Health Verification:**

1. **Basic Connectivity**
   ```bash
   curl https://your-app.azurecontainerapps.io/api/health
   # Expected: {"ok": true, "status": 200, ...}
   ```

2. **Okta Integration**
   ```bash
   curl https://your-app.azurecontainerapps.io/api/okta/ping
   # Expected: {"ok": true, "connected": true, "latency": <number>}
   ```

3. **Redis Cache (if configured)**
   ```bash
   curl https://your-app.azurecontainerapps.io/api/cache/stats
   # Expected: {"ok": true, "data": {"connected": true, ...}}
   ```

4. **Search Functionality**
   ```bash
   curl "https://your-app.azurecontainerapps.io/api/okta/users?q=john"
   # Expected: {"ok": true, "data": {"users": [...], ...}}
   ```

5. **Frontend Rendering**
   - Open browser to `https://your-app.azurecontainerapps.io/`
   - Verify search interface loads
   - Perform test search
   - Check system information page: `https://your-app.azurecontainerapps.io/technical`

**Automated Health Monitoring:**

Configure Azure Container Apps health probe:
```yaml
probes:
  liveness:
    httpGet:
      path: /api/health
      port: 3000
    initialDelaySeconds: 10
    periodSeconds: 30
  readiness:
    httpGet:
      path: /api/okta/ping
      port: 3000
    initialDelaySeconds: 15
    periodSeconds: 60
```

### 6.4 Metrics & Telemetry

**Application Insights (not configured):**
- No explicit Application Insights SDK integration
- Azure Container Apps can auto-instrument Node.js apps
- Recommendation: Add `@azure/monitor-opentelemetry-exporter` for custom metrics

**Custom Metrics (available via API):**
- Search latency (client-side measurement in `lib/fetcher.ts`)
- Cache hit rate (`/api/cache/stats`)
- Okta API latency (`/api/okta/ping`)
- Node.js uptime (`/api/health`)

**Missing Metrics:**
- Request throughput (requests/second)
- Error rate by endpoint
- P50/P95/P99 latency percentiles
- Cache miss ratio over time
- Okta API rate limit remaining

---

## 7. Deployment Pipeline

### 7.1 CI/CD Overview

**Pipeline Tool:** GitHub Actions
**Workflow File:** `.github/workflows/build-and-push.yml`
**Trigger:** Push to `main` branch or manual `workflow_dispatch`

### 7.2 Pipeline Stages

```
┌─────────────────────────────────────────────────────────────┐
│ STAGE 1: Checkout Code                                      │
│ Action: actions/checkout@v4                                 │
│ Purpose: Clone repository to GitHub Actions runner         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STAGE 2: Registry Validation                                │
│ Script: Sanity check for ACR name format                   │
│ Validates: No https://, no trailing slash                  │
│ Fails: If AZURE_CONTAINER_REGISTRY format invalid          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STAGE 3: Docker Login                                       │
│ Action: docker/login-action@v3                             │
│ Registry: ${{ secrets.AZURE_CONTAINER_REGISTRY }}          │
│ Username: ${{ secrets.AZURE_CONTAINER_REGISTRY_USERNAME }} │
│ Password: ${{ secrets.AZURE_CONTAINER_REGISTRY_PASSWORD }} │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STAGE 4: Setup Docker Buildx                                │
│ Action: docker/setup-buildx-action@v3                      │
│ Purpose: Enable advanced Docker build features             │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STAGE 5: Build & Push Image                                 │
│ Action: docker/build-push-action@v6                        │
│ Build Context: Repository root                             │
│ Cache: Registry-based (buildcache tag)                     │
│ Tags: latest, ${{ github.sha }}                            │
│ Push: true (automatically pushes to ACR)                   │
│ Provenance: false (avoids attestation issues)              │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STAGE 6: Summary Output                                     │
│ Prints: Image names and tags pushed to ACR                 │
└─────────────────────────────────────────────────────────────┘
```

### 7.3 Docker Build Process

**Multi-Stage Dockerfile:**

**Stage 1: Builder**
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci                    # Clean install (production + dev dependencies)
COPY . .
RUN npm run build             # Next.js build → .next/standalone/
```

**Stage 2: Runner**
```dockerfile
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Security: Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy minimal production files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set ownership to non-root user
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000
ENV PORT=3000 HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
```

**Build Optimizations:**
- Layer caching via ACR buildcache tag
- Multi-stage build reduces final image size (~150MB)
- Standalone output includes only runtime dependencies

### 7.4 Manual Deployment Steps

**Current State:** CI/CD builds and pushes to ACR, but deployment to Azure Container Apps is **not automated**.

**Manual Steps Required After Image Push:**

1. **Azure Container Apps Deployment (Azure Portal)**
   ```
   a. Navigate to: Azure Portal → Container Apps → [Your App]
   b. Select: Containers → Edit and deploy
   c. Update image: [registry].azurecr.io/peoplepickerc21:latest
   d. Save and deploy (revision created automatically)
   ```

2. **Azure Container Apps Deployment (Azure CLI)**
   ```bash
   az containerapp update \
     --name peoplepickerc21 \
     --resource-group [your-rg] \
     --image [registry].azurecr.io/peoplepickerc21:latest
   ```

3. **Verify Environment Variables Set**
   ```bash
   az containerapp show \
     --name peoplepickerc21 \
     --resource-group [your-rg] \
     --query "properties.configuration.secrets"
   ```

**Deployment Time:**
- ACR push: ~2-3 minutes (with build cache)
- Container Apps revision deployment: ~1-2 minutes
- Total: ~3-5 minutes from push to main

### 7.5 Missing Automation

**Not Automated (Recommendations):**

1. **Deployment to Container Apps**
   - Add Azure CLI step to workflow:
   ```yaml
   - name: Deploy to Azure Container Apps
     run: |
       az containerapp update \
         --name peoplepickerc21 \
         --resource-group ${{ secrets.AZURE_RESOURCE_GROUP }} \
         --image ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
   ```

2. **Infrastructure as Code**
   - No Bicep or Terraform files found
   - Recommendation: Add `infra/` directory with Azure resources defined as code

3. **Automated Testing**
   - No test suite in pipeline
   - No integration tests
   - No smoke tests post-deploy

4. **Rollback Strategy**
   - Manual revision rollback via Azure Portal
   - Recommendation: Automate rollback on health check failure

5. **Secrets Rotation**
   - No automated secret rotation
   - Recommendation: Integrate Azure Key Vault with auto-rotation

### 7.6 GitHub Secrets Required

| Secret Name | Purpose | Example Value |
|-------------|---------|---------------|
| `AZURE_CONTAINER_REGISTRY` | ACR hostname | `peoplepickerc21acr.azurecr.io` |
| `AZURE_CONTAINER_REGISTRY_USERNAME` | ACR login username | `peoplepickerc21acr` |
| `AZURE_CONTAINER_REGISTRY_PASSWORD` | ACR access token | `••••••••••••••••` |

**Note:** If using managed identity, username/password can be eliminated.

---

## 8. Architecture Diagrams

### 8.1 System Context Diagram

```mermaid
graph TB
    subgraph "Users"
        Employee[Employee Browser]
        Admin[System Administrator]
    end

    subgraph "Azure Cloud"
        subgraph "Azure Container Apps"
            App[PeoplePickerc21<br/>Next.js App<br/>Port 3000]
        end

        subgraph "Azure Container Registry"
            ACR[Container Images<br/>peoplepickerc21:latest]
        end

        subgraph "Azure Cache for Redis"
            Redis[Redis Cache<br/>Optional]
        end
    end

    subgraph "External Services"
        Okta[Okta Directory<br/>Users API v1]
        Teams[Microsoft Teams]
        Outlook[Outlook Email]
    end

    subgraph "CI/CD"
        GitHub[GitHub Actions<br/>Build & Push]
    end

    Employee -->|HTTPS| App
    Admin -->|HTTPS| App
    App -->|SSWS Token| Okta
    App -.->|Optional Caching| Redis
    App -->|Deep Links| Teams
    App -->|Mailto Links| Outlook
    GitHub -->|Push Image| ACR
    ACR -->|Pull Image| App

    style App fill:#0066cc,stroke:#333,stroke-width:2px,color:#fff
    style Okta fill:#007dc1,stroke:#333,stroke-width:2px,color:#fff
    style Redis fill:#dc382d,stroke:#333,stroke-width:2px,color:#fff
```

### 8.2 Request Flow Diagram

```mermaid
sequenceDiagram
    autonumber
    participant User as Employee Browser
    participant Next as Next.js App
    participant Redis as Redis Cache
    participant Okta as Okta Users API

    User->>Next: GET /?q=john
    Next->>Next: Debounce 300ms

    User->>Next: GET /api/okta/users?q=john
    Next->>Next: Validate query length >= 2

    Next->>Redis: cacheGet('search:john:first')
    alt Cache HIT
        Redis-->>Next: Return cached result
        Next-->>User: 200 OK (cached: true)
    else Cache MISS
        Redis-->>Next: null
        Next->>Okta: GET /api/v1/users?q=john
        Note over Next,Okta: Authorization: SSWS {token}<br/>Timeout: 10 seconds

        alt Success
            Okta-->>Next: 200 OK + users array
            Next->>Next: normalizeUser() & sort
            Next->>Redis: cacheSet(key, result, TTL=3600)
            Next-->>User: 200 OK (cached: false)
        else Rate Limited (429)
            Okta-->>Next: 429 Too Many Requests
            Next->>Next: Exponential backoff (1s, 2s, 4s)
            Next->>Okta: Retry GET /api/v1/users?q=john
            Okta-->>Next: 200 OK + users array
            Next-->>User: 200 OK
        else Error
            Okta-->>Next: 500 Server Error
            Next-->>User: 500 Internal Server Error
        end
    end

    User->>Next: Click user card
    User->>Next: GET /user/{id}
    Next->>Okta: GET /api/v1/users/{id}
    Okta-->>Next: User object
    Next-->>User: Rendered profile page
```

### 8.3 Component & Module Dependency Graph

```mermaid
graph LR
    subgraph "Client Components"
        SearchInterface[SearchInterface.tsx]
        SearchResults[SearchResults.tsx]
        UserCard[UserCard.tsx]
        Diagnostics[DiagnosticsClient.tsx]
        HealthMetrics[HealthMetrics.tsx]
    end

    subgraph "Server Components & Routes"
        HomePage[app/page.tsx]
        UserPage[app/user/[id]/page.tsx]
        HealthRoute[api/health/route.ts]
        UsersRoute[api/okta/users/route.ts]
        UserRoute[api/okta/users/[id]/route.ts]
        PingRoute[api/okta/ping/route.ts]
        CacheRoute[api/cache/stats/route.ts]
    end

    subgraph "Shared Libraries"
        OktaClient[lib/okta.ts]
        RedisClient[lib/redis.ts]
        Types[lib/types.ts]
        useSearch[lib/hooks/useSearch.ts]
        useHealth[lib/hooks/useHealth.ts]
        useDebounce[lib/hooks/useDebounce.ts]
    end

    HomePage --> SearchInterface
    SearchInterface --> SearchResults
    SearchInterface --> useSearch
    SearchInterface --> useDebounce
    SearchResults --> UserCard
    Diagnostics --> useHealth
    Diagnostics --> HealthMetrics

    useSearch --> UsersRoute
    useHealth --> HealthRoute
    useHealth --> PingRoute

    UsersRoute --> OktaClient
    UsersRoute --> RedisClient
    UserRoute --> OktaClient
    UserRoute --> RedisClient
    PingRoute --> OktaClient
    CacheRoute --> RedisClient
    UserPage --> OktaClient

    OktaClient --> Types
    RedisClient --> Types
    UsersRoute --> Types

    style OktaClient fill:#f9a825,stroke:#333,stroke-width:2px
    style RedisClient fill:#dc382d,stroke:#333,stroke-width:2px,color:#fff
    style Types fill:#42a5f5,stroke:#333,stroke-width:2px,color:#fff
```

### 8.4 Deployment Pipeline Diagram

```mermaid
graph LR
    subgraph "Developer Workflow"
        Dev[Developer]
        LocalTest[Local Testing<br/>npm run dev]
        Commit[Git Commit]
    end

    subgraph "GitHub"
        MainBranch[main branch]
        Actions[GitHub Actions<br/>build-and-push.yml]
    end

    subgraph "Azure Container Registry"
        ACR[peoplepickerc21acr.azurecr.io<br/>Image: latest + SHA tags]
    end

    subgraph "Azure Container Apps"
        ContainerApp[Container App<br/>peoplepickerc21]
        Revision[Active Revision]
    end

    subgraph "Production"
        Users[End Users]
    end

    Dev --> LocalTest
    LocalTest --> Commit
    Commit --> MainBranch
    MainBranch -->|Trigger| Actions
    Actions -->|Build & Push| ACR
    ACR -.->|Manual Step| ContainerApp
    ContainerApp --> Revision
    Revision --> Users

    style Actions fill:#2088ff,stroke:#333,stroke-width:2px,color:#fff
    style ACR fill:#0066cc,stroke:#333,stroke-width:2px,color:#fff
    style ContainerApp fill:#00a4ef,stroke:#333,stroke-width:2px,color:#fff
```

---

## 9. Risks & Technical Debt

### 9.1 Security Risks

| Risk | Severity | Impact | Remediation |
|------|----------|--------|-------------|
| **No user authentication** | 🔴 High | Anyone with network access can query all Okta users | Implement Azure AD authentication with RBAC |
| **Secrets in App Settings (not Key Vault)** | 🟡 Medium | Secrets visible to all app contributors | Migrate to Azure Key Vault with managed identity |
| **No CORS policy** | 🟡 Medium | API could be called from unauthorized origins | Add CORS headers to API routes |
| **No rate limiting** | 🟡 Medium | Single user could exhaust Okta API quota | Implement rate limiting middleware (e.g., next-rate-limit) |
| **No input validation on pagination cursors** | 🟢 Low | Potential SSRF if Okta Link header compromised | Validate cursor format before using in requests |
| **Missing security headers** | 🟡 Medium | XSS, clickjacking vulnerabilities | Add CSP, X-Frame-Options, HSTS headers |

### 9.2 Reliability Risks

| Risk | Severity | Impact | Remediation |
|------|----------|--------|-------------|
| **Single point of failure (Okta API)** | 🔴 High | App unusable if Okta unavailable | Implement circuit breaker pattern + fallback data |
| **No health check before traffic** | 🟡 Medium | Failed deployments serve 500 errors | Configure liveness/readiness probes in Container Apps |
| **Redis failure cascades to app** | 🟢 Low | Cache errors logged but don't block (graceful degradation) | Current implementation is acceptable |
| **No retry on transient errors** | 🟡 Medium | Network blips cause user-facing errors | Add retry logic for network timeouts |
| **Unbounded search results** | 🟡 Medium | Large result sets cause memory issues | Enforce pagination (currently configurable but not enforced) |

### 9.3 Operational Risks

| Risk | Severity | Impact | Remediation |
|------|----------|--------|-------------|
| **Manual deployment to Container Apps** | 🟡 Medium | Human error, slow rollouts | Automate deployment in GitHub Actions |
| **No infrastructure as code** | 🟡 Medium | Environment drift, difficult disaster recovery | Add Bicep/Terraform for Azure resources |
| **Unstructured logging** | 🟡 Medium | Difficult debugging in production | Implement structured logging (JSON format with correlation IDs) |
| **No alerting on failures** | 🔴 High | Outages go unnoticed | Configure Azure Monitor alerts for error rates, latency |
| **No automated testing** | 🟡 Medium | Regressions deployed to production | Add unit tests, integration tests, E2E tests |
| **No rollback strategy** | 🟡 Medium | Bad deploys require manual intervention | Automate rollback on health check failures |

### 9.4 Performance Risks

| Risk | Severity | Impact | Remediation |
|------|----------|--------|-------------|
| **Cold start latency** | 🟢 Low | First request after idle takes 2-3 seconds | Configure minimum replicas in Container Apps |
| **Cache stampede** | 🟡 Medium | Multiple requests fetch same data if cache expires | Implement cache warming + request coalescing |
| **Unbounded Redis memory** | 🟡 Medium | Redis could run out of memory with many searches | Set Redis maxmemory policy (allkeys-lru) |
| **No CDN for static assets** | 🟢 Low | Slower page loads globally | Use Azure CDN or Vercel Edge Network |
| **Large user result sets** | 🟡 Medium | Parsing 100+ users slows down response | Implement virtual scrolling on frontend |

### 9.5 Technical Debt

| Debt Item | Effort | Priority | Description |
|-----------|--------|----------|-------------|
| **Add TypeScript strict null checks** | Medium | Low | Enable `strictNullChecks` in tsconfig.json (currently disabled) |
| **Centralize error handling** | Small | Medium | Create error handler middleware for consistent error responses |
| **Add API versioning** | Small | Low | Prefix routes with `/api/v1/` for future compatibility |
| **Implement request correlation IDs** | Medium | High | Add request ID to logs for tracing across services |
| **Add Okta webhook support** | Large | Low | Invalidate cache on user updates via Okta webhooks |
| **Migrate to App Router data fetching** | Large | Low | Use Next.js 15 `use()` hook instead of useEffect in hooks |
| **Add E2E tests** | Large | High | Playwright tests for critical user flows |
| **Implement feature flags** | Medium | Low | Use Azure App Configuration for gradual rollouts |
| **Add OpenTelemetry** | Medium | High | Structured telemetry for distributed tracing |
| **User avatar support** | Medium | Low | Fetch and cache user photos from Okta |

### 9.6 Compliance & Privacy Risks

| Risk | Severity | Impact | Remediation |
|------|----------|--------|-------------|
| **No audit logging** | 🟡 Medium | Cannot track who searched for whom | Add audit log table (database or Azure Storage) |
| **No data residency controls** | 🟡 Medium | Data may cross geographic boundaries | Ensure Azure resources in required regions |
| **No GDPR right-to-be-forgotten** | 🟢 Low | Cached data persists after user deletion | Implement cache invalidation on user deletion events |
| **No terms of use** | 🟢 Low | Users unaware of acceptable use policy | Add ToS banner + acceptance tracking |

---

## Appendix A: Quick Reference

### API Endpoints Summary

| Endpoint | Method | Purpose | Cache TTL |
|----------|--------|---------|-----------|
| `/api/health` | GET | System health status | No cache |
| `/api/okta/ping` | GET | Okta connectivity test | No cache |
| `/api/okta/users?q={query}` | GET | Search users | 1 hour |
| `/api/okta/users/{id}` | GET | Get user by ID | 4 hours |
| `/api/okta/users/sample` | GET | Sample users | No cache |
| `/api/cache/stats` | GET | Cache performance | No cache |

### Environment Variables Checklist

**Required:**
- [ ] `okta-org-url`
- [ ] `okta-api-token`

**Optional:**
- [ ] `redis-connection-string`
- [ ] `search-results-limit`

### Deployment Checklist

**Pre-Deployment:**
- [ ] Set environment variables in Azure App Settings
- [ ] Verify ACR credentials in GitHub Secrets
- [ ] Test Okta API token locally
- [ ] Review Docker build logs for errors

**Post-Deployment:**
- [ ] Verify `/api/health` returns 200
- [ ] Verify `/api/okta/ping` shows `connected: true`
- [ ] Test search functionality with known user
- [ ] Check `/technical` page for errors
- [ ] Monitor Azure Container Apps logs for exceptions

### Common Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| "okta-org-url environment variable is required" | Missing env var | Set in Azure App Settings |
| "Okta API error: 401" | Invalid API token | Regenerate token in Okta Admin |
| Search returns empty results | Okta API rate limit | Wait 1 minute, check diagnostics |
| "Redis connection string not found" | Missing Redis config | Add `redis-connection-string` (optional) |
| Cache stats show "connected: false" | Redis network issue | Check Azure Cache firewall rules |
| Container fails to start | Image pull error | Verify ACR credentials in Container App |

---

## Appendix B: Related Documentation

- **Next.js Documentation:** https://nextjs.org/docs
- **Okta Users API:** https://developer.okta.com/docs/reference/api/users/
- **ioredis Documentation:** https://github.com/redis/ioredis
- **Azure Container Apps:** https://learn.microsoft.com/azure/container-apps/
- **Docker Multi-Stage Builds:** https://docs.docker.com/build/building/multi-stage/

---

**Document End**

*This architecture document is accurate to the codebase as of 2025-10-29. For updates or questions, contact the development team.*
