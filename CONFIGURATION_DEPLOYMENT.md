# Configuration System Deployment Guide

**Date:** November 7, 2025  
**Feature:** Database-backed Configuration Management  
**Status:** Ready for Testing

---

## What Was Built

### 1. Database Schema ✅
- **Configuration** table - Key-value config storage with encryption support
- **OfficeTenancy** table - Future multi-tenancy support (structure only)
- **SmtpDomain** table - Future domain routing (structure only)

### 2. Backend Infrastructure ✅
- **`lib/config.ts`** - Configuration management with DB-first, env-var fallback
- **`lib/okta.ts`** - Updated to use new config system (no more hardcoded env vars!)
- Simple encryption/decryption for sensitive values

### 3. API Routes ✅
- **GET `/api/admin/config/okta`** - Read current Okta config
- **POST `/api/admin/config/okta`** - Save Okta config to database
- **POST `/api/admin/config/okta/test`** - Test Okta connection

### 4. Admin UI ✅
- **Configuration page** at `/admin/configuration`
- **Okta section** - Fully functional (read, update, test, save)
- **Office 365 section** - UI shell (grayed out, "Coming Soon")
- **SMTP section** - UI shell (grayed out, "Coming Soon")
- Navigation link added to admin sidebar

---

## Deployment Steps

### Step 1: Database Migration (5 minutes)

```bash
# Option A: Using Prisma CLI (recommended)
npx prisma migrate deploy

# Option B: Run migration manually (if Prisma not available)
# Execute the SQL in: prisma/migrations/20251107160000_add_configuration_system/migration.sql
```

**Verify migration:**
```sql
-- Check if tables exist
SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_NAME IN ('configurations', 'office_tenancies', 'smtp_domains');
```

### Step 2: Generate Prisma Client (2 minutes)

```bash
npx prisma generate
```

### Step 3: Build and Deploy (10 minutes)

```bash
# Local testing
npm run build
npm run dev

# Production deployment (GitHub Actions will handle this)
git add .
git commit -m "feat: Add database-backed configuration system"
git push origin main
```

### Step 4: Migrate Okta Config to Database (5 minutes)

1. Log into admin panel: `https://your-app/admin/dashboard`
2. Click **Configuration** in the sidebar
3. You'll see your current env var config loaded
4. Click **Test Connection** to verify it works
5. Click **Save Changes** to store in database
6. Verify config now loads from database (refresh page)

---

## Testing Checklist

### ✅ Phase 1: Database Migration
- [ ] Migration runs without errors
- [ ] Three new tables created: `configurations`, `office_tenancies`, `smtp_domains`
- [ ] All indexes created successfully

### ✅ Phase 2: Admin UI
- [ ] Configuration link appears in admin sidebar
- [ ] Configuration page loads without errors
- [ ] Okta section shows "ACTIVE" badge
- [ ] Office 365 section shows "COMING SOON" badge (grayed out)
- [ ] SMTP section shows "COMING SOON" badge (grayed out)

### ✅ Phase 3: Okta Config (DB Storage)
- [ ] Existing Okta config loads from environment variables
- [ ] API token is masked in UI (`••••••••xxxx`)
- [ ] Can update Org URL
- [ ] Can update API Token (show/hide toggle works)
- [ ] "Test Connection" button works
- [ ] Test succeeds with valid credentials
- [ ] "Save Changes" button appears when config changes
- [ ] Config saves to database successfully
- [ ] After save, page reload shows config from database

### ✅ Phase 4: User Search (Integration Test)
- [ ] Navigate to home page
- [ ] Search for a user (e.g., "evans")
- [ ] Results appear (config now loaded from database)
- [ ] **The `okta-org-url environment variable is required` error is GONE**

### ✅ Phase 5: Fallback Behavior
- [ ] With config in DB, app uses database config
- [ ] Delete database config, app falls back to env vars
- [ ] Set config in DB again, app switches back to database

---

## What's Different Now

### Before (Broken State):
```typescript
// lib/okta.ts
const OKTA_ORG_URL = process.env['okta-org-url'];  // ❌ Undefined!
const OKTA_API_TOKEN = process.env['okta-api-token'];  // ❌ Undefined!

// Error: 'okta-org-url' environment variable is required
```

### After (Working State):
```typescript
// lib/okta.ts
const config = await getOktaConfig();  // ✅ Reads from DB first
// Falls back to env vars if DB empty
// Supports both OKTA_ORG_URL and okta-org-url naming

// Result: Always works, regardless of env var naming
```

---

## Configuration Priority

The system now follows this order:

1. **Database** (preferred) - Check `configurations` table
2. **Environment Variables** (fallback) - Supports multiple naming conventions:
   - `OKTA_ORG_URL` / `OKTA_API_TOKEN` (uppercase with underscore)
   - `okta-org-url` / `okta-api-token` (lowercase with hyphen)
   - `OKTA-ORG-URL` / `OKTA-API-TOKEN` (uppercase with hyphen)

---

## Security Features

### Encryption
- API tokens automatically encrypted before storage
- Uses XOR cipher with `CONFIG_ENCRYPTION_KEY` env var
- For production, consider upgrading to AES-256

### Audit Trail
- All config changes logged in `audit_logs` table
- Records: admin email, timestamp, action details

### Access Control
- Only admins can view/modify configuration
- Admin authentication required for all config API endpoints

---

## Troubleshooting

### Migration Fails
**Issue:** Migration SQL errors  
**Fix:** Check if tables already exist. Drop them manually if needed:
```sql
DROP TABLE IF EXISTS smtp_domains;
DROP TABLE IF EXISTS office_tenancies;
DROP TABLE IF EXISTS configurations;
```

### Config Not Saving
**Issue:** "Failed to save Okta configuration"  
**Fix:** Check:
1. Admin authentication working
2. Database connection healthy
3. Browser console for detailed error messages

### User Search Still Broken
**Issue:** Still seeing `okta-org-url environment variable is required`  
**Fix:**
1. Verify config saved to database: `SELECT * FROM configurations WHERE category = 'okta'`
2. Check app logs for config loading errors
3. Restart container to clear any cached config

### Test Connection Fails
**Issue:** "Okta API returned 401: Unauthorized"  
**Fix:**
1. Verify Org URL format: `https://dev-xxxxx.okta.com` (no trailing slash)
2. Verify API token is valid (not masked)
3. Check Okta API token permissions

---

## Next Steps (Future Development)

### Phase 2: Office 365 Multi-Tenancy
1. Wire up Office 365 section in UI
2. Create API routes for tenant management
3. Implement Graph API integration per tenant
4. Add tenant selection logic

### Phase 3: SMTP Domain Routing
1. Wire up SMTP section in UI
2. Create domain-to-tenant mapping logic
3. Implement automatic tenant detection based on email domain
4. Add priority-based routing

### Phase 4: Additional Config
1. Cache TTL settings
2. Feature flags
3. Email notification settings
4. Rate limiting configuration

---

## Rollback Plan

If something goes wrong:

### Revert Code Changes
```bash
git revert HEAD
git push origin main
```

### Drop Migration (if needed)
```sql
-- Manually drop tables
DROP TABLE IF EXISTS smtp_domains;
DROP TABLE IF EXISTS office_tenancies;
DROP TABLE IF EXISTS configurations;
```

### Fallback to Environment Variables
- Config system automatically falls back to env vars if DB is empty
- No code changes needed for rollback

---

## Success Criteria

✅ Migration completes successfully  
✅ Configuration page loads and is functional  
✅ Can save Okta config to database  
✅ **User search works again (main goal!)**  
✅ Admin panel shows config management UI  
✅ Environment variable fallback works  
✅ Office 365 and SMTP sections visible (grayed out)  

---

## Summary

**What we fixed:**
- The `okta-org-url` vs `OKTA_ORG_URL` environment variable naming disaster

**What we built:**
- Database-backed configuration system
- Full Okta config management UI
- Infrastructure for future multi-tenancy
- Audit trail for config changes
- Encryption for sensitive values

**What's ready:**
- Okta configuration (fully functional)
- Office 365 tenancies (structure ready, UI present)
- SMTP domain routing (structure ready, UI present)

**Status:** Ready to deploy and test! 🚀
