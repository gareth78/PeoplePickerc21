# Admin Authentication and Management System

A comprehensive, production-grade admin authentication and management system with Azure SQL Database (SQL Server) backing, emergency break-glass access, and professional UI.

## 🎯 Overview

This system provides secure admin authentication and management for the People Picker application with:

- **Database-backed authentication** using Azure SQL Database (SQL Server)
- **Emergency "break glass" access** via secure URL token
- **Beautiful, professional UI** for admin operations
- **Comprehensive audit logging** of all admin actions
- **User management interface** for adding/removing admins
- **Security-first design** with JWT sessions and protected routes

## 🏗 Architecture

### Authentication Flow

```
User visits /admin/dashboard
  ↓
Check 1: Valid admin session cookie?
  ↓
Check 2: Is emergency session? → Allow (no DB check)
  ↓
Check 3: Admin exists in database? → Allow
  ↓
Redirect to home with error
```

### Emergency Break Glass Flow

```
User visits /admin/emergency?token={URL_TOKEN}
  ↓
Verify URL token matches BREAK_GLASS_URL_TOKEN
  ↓
Show login form (email + password)
  ↓
Verify credentials against env vars
  ↓
Create JWT session (1 hour expiry)
  ↓
Redirect to /admin/dashboard
```

## 🚀 Quick Start

### 1. Environment Setup

Copy `.env.local.example` to `.env.local` and configure:

```bash
# Generate secure tokens
JWT_SECRET=$(openssl rand -base64 32)
BREAK_GLASS_URL_TOKEN=$(openssl rand -hex 32)

# Set emergency credentials
BREAK_GLASS_EMAIL=admin@yourdomain.com
BREAK_GLASS_PASSWORD=your-secure-password

# Azure AD configuration (optional)
AZURE_AD_ENABLED=true
NEXT_PUBLIC_AZURE_AD_CLIENT_ID=your-client-id
AZURE_AD_CLIENT_SECRET=your-client-secret
AZURE_AD_TENANT_ID=your-tenant-id
AZURE_AD_REDIRECT_URI=http://localhost:3000/api/auth/callback
```

### 2. Database Setup

Run the migrations to create the admin tables:

```bash
# Apply migrations
npx prisma migrate deploy

# Or in development
npx prisma migrate dev
```

### 3. Create Initial Admin

Connect to your SQL Server database and run:

```sql
INSERT INTO admins (id, email, created_by)
VALUES (NEWID(), 'your-email@domain.com', 'system');
```

## 📋 Database Schema

### Admins Table

```sql
CREATE TABLE admins (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  email NVARCHAR(320) UNIQUE NOT NULL,
  created_at DATETIME2 DEFAULT SYSUTCDATETIME(),
  created_by NVARCHAR(320)
);
```

### Audit Logs Table

```sql
CREATE TABLE audit_logs (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  action NVARCHAR(100) NOT NULL,
  admin_email NVARCHAR(320) NOT NULL,
  target_email NVARCHAR(320),
  ip_address NVARCHAR(100),
  user_agent NVARCHAR(400),
  metadata NVARCHAR(MAX),
  created_at DATETIME2 DEFAULT SYSUTCDATETIME()
);
```

> **Note:** The `metadata` column stores serialized text (such as JSON) for flexibility across audit events.

## 🔐 Security Features

### 1. JWT Session Management

- Sessions stored in HTTP-only cookies
- 24-hour expiry for normal sessions
- 1-hour expiry for emergency sessions
- Automatic session validation on each request

### 2. Emergency Access

Emergency access provides a secure way to access the admin panel when normal authentication is unavailable:

- **Two-factor verification**: URL token + credentials
- **Limited session duration**: 1 hour only
- **Full audit logging**: All emergency access is logged
- **Visual indicators**: Emergency sessions clearly marked in UI

To use emergency access:
```
https://your-domain.com/admin/emergency?token={BREAK_GLASS_URL_TOKEN}
```

### 3. Audit Logging

All admin actions are logged with:
- Action type (LOGIN, CREATE_ADMIN, DELETE_ADMIN, etc.)
- Admin email
- Target email (for actions on other admins)
- IP address
- User agent
- Additional metadata
- Timestamp

### 4. Protected Routes

All admin routes are protected with middleware that:
- Verifies valid JWT session
- Checks admin exists in database (for non-emergency sessions)
- Logs unauthorized access attempts
- Returns 401/403 for invalid access

## 🎨 UI Pages

### Dashboard (`/admin/dashboard`)
- Overview statistics
- Recent activity feed
- Security metrics
- Emergency access warnings

### User Management (`/admin/users`)
- List all administrators
- Add new administrators
- Remove administrators (with confirmation)
- View admin creation history

### Audit Logs (`/admin/audit`)
- View all security events
- Filter by action type
- View detailed metadata
- Export capabilities

## 🛠 API Routes

### Session Management
- `GET /api/admin/session` - Check current session
- `POST /api/admin/logout` - Logout and clear session

### Emergency Access
- `POST /api/admin/emergency/verify-token` - Verify URL token
- `POST /api/admin/emergency/login` - Emergency login

### Admin Management
- `GET /api/admin/users` - List all admins
- `POST /api/admin/users` - Create new admin
- `DELETE /api/admin/users/[id]` - Delete admin

### Statistics & Logs
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/activity/recent` - Recent activity
- `GET /api/admin/audit` - Full audit logs

## 📦 File Structure

```
lib/admin/
  ├── auth.ts          # JWT authentication utilities
  ├── audit.ts         # Audit logging utilities
  └── middleware.ts    # Route protection middleware

app/admin/
  ├── page.tsx         # Redirect to dashboard
  ├── dashboard/       # Dashboard page
  ├── users/           # User management page
  ├── audit/           # Audit logs page
  └── emergency/       # Emergency access page

app/api/admin/
  ├── session/         # Session check
  ├── logout/          # Logout endpoint
  ├── stats/           # Statistics
  ├── activity/        # Activity logs
  ├── users/           # User CRUD
  ├── audit/           # Audit logs
  └── emergency/       # Emergency access

components/admin/
  └── AdminLayout.tsx  # Shared admin layout
```

## 🔧 Utility Functions

### Authentication (`lib/admin/auth.ts`)

```typescript
// Create JWT token
await createAdminToken(email, isEmergency)

// Verify token
await verifyAdminToken(token)

// Get current session
await getAdminSession()

// Set session cookie
await setAdminSession(email, isEmergency)

// Clear session
await clearAdminSession()

// Check if user is admin
await isAdmin(email)

// Verify emergency credentials
verifyBreakGlassCredentials(email, password)

// Verify emergency URL token
verifyEmergencyToken(token)
```

### Audit Logging (`lib/admin/audit.ts`)

```typescript
// Create audit log
await createAuditLog({
  action: 'LOGIN',
  adminEmail: 'user@example.com',
  targetEmail: 'target@example.com', // optional
  metadata: { key: 'value' } // optional
})

// Get recent logs
await getRecentAuditLogs(100)

// Get logs for specific admin
await getAdminAuditLogs('user@example.com', 50)

// Get logs by action
await getAuditLogsByAction('LOGIN', 50)

// Get statistics
await getAuditStats(30) // last 30 days
```

### Route Protection (`lib/admin/middleware.ts`)

```typescript
// Protect API route
export const GET = withAdminAuth(async (request, session) => {
  // Your handler code
  // session.email, session.isEmergency available
})
```

## 🚨 Common Tasks

### Add a New Admin

1. Via UI: Go to `/admin/users` and click "Add Administrator"
2. Via Database:
   ```sql
   INSERT INTO admins (id, email, created_by)
   VALUES (NEWID(), 'new-admin@domain.com', 'existing-admin@domain.com');
   ```

### Remove an Admin

1. Via UI: Go to `/admin/users` and click "Remove" next to the admin
2. Via Database:
   ```sql
   DELETE FROM admins WHERE email = 'admin@domain.com';
   ```

### Access Emergency Portal

1. Get the URL token from your `.env.local` file
2. Visit: `https://your-domain.com/admin/emergency?token={BREAK_GLASS_URL_TOKEN}`
3. Enter emergency credentials (from `.env.local`)
4. Access granted for 1 hour

### View Audit Logs

1. Via UI: Go to `/admin/audit`
2. Via Database:
   ```sql
   SELECT TOP (100) *
   FROM audit_logs
   ORDER BY created_at DESC;
   ```

### Check Who's an Admin

```sql
SELECT email, created_at, created_by
FROM admins
ORDER BY created_at DESC;
```

## 🎯 Best Practices

1. **Rotate Emergency Credentials Regularly**
   - Change `BREAK_GLASS_PASSWORD` every 90 days
   - Update `BREAK_GLASS_URL_TOKEN` if exposed

2. **Monitor Emergency Access**
   - Review audit logs for `BREAK_GLASS_ACCESS` events
   - Investigate any unexpected emergency logins

3. **Use Strong JWT Secret**
   - Generate with: `openssl rand -base64 32`
   - Never commit to version control
   - Rotate if compromised

4. **Regular Audit Reviews**
   - Review audit logs weekly
   - Look for suspicious patterns
   - Export logs for compliance

5. **Limit Admin Access**
   - Only grant admin access when necessary
   - Remove admin access when no longer needed
   - Review admin list quarterly

## 🐛 Troubleshooting

### Can't Access Admin Panel

1. Check if you're in the admins table:
   ```sql
   SELECT * FROM admins WHERE email = 'your-email@domain.com';
   ```

2. Use emergency access if needed:
   ```
   /admin/emergency?token={BREAK_GLASS_URL_TOKEN}
   ```

3. Check browser console for errors

### Session Expired

- Normal sessions expire after 24 hours
- Emergency sessions expire after 1 hour
- Simply log in again

### Emergency Access Not Working

1. Verify `BREAK_GLASS_URL_TOKEN` in `.env.local`
2. Verify `BREAK_GLASS_EMAIL` and `BREAK_GLASS_PASSWORD`
3. Check audit logs for failed attempts
4. Ensure environment variables are loaded

### Database Connection Issues

1. Verify `DATABASE_URL` in `.env.local`
2. Confirm your Azure SQL Database (SQL Server) is reachable
3. Verify migrations are applied:
   ```bash
   npx prisma migrate status
   ```

## 📊 Monitoring

### Key Metrics to Track

1. **Failed Login Attempts**
   ```sql
   SELECT COUNT(*) FROM audit_logs
   WHERE action = 'FAILED_LOGIN'
   AND created_at > DATEADD(HOUR, -24, SYSUTCDATETIME());
   ```

2. **Emergency Access Usage**
   ```sql
   SELECT COUNT(*) FROM audit_logs
   WHERE action IN ('BREAK_GLASS_ACCESS', 'BREAK_GLASS_LOGIN')
   AND created_at > DATEADD(DAY, -30, SYSUTCDATETIME());
   ```

3. **Admin Activity**
   ```sql
   SELECT admin_email, COUNT(*) AS actions
   FROM audit_logs
   WHERE created_at > DATEADD(DAY, -7, SYSUTCDATETIME())
   GROUP BY admin_email
   ORDER BY actions DESC;
   ```

## 🔒 Security Considerations

- All passwords and tokens should be stored in environment variables
- Never commit `.env.local` to version control
- Use HTTPS in production (enforced via secure cookies)
- Regularly review and rotate credentials
- Monitor audit logs for suspicious activity
- Limit the number of admins to minimize attack surface
- Use strong, unique passwords for emergency access
- Consider implementing rate limiting on login endpoints
- Enable database backups for audit logs
- Implement log retention policies

## 📝 License

This admin system is part of the People Picker application.
