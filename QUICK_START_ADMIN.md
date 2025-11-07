# Quick Start: Admin System

## 🚀 5-Minute Setup

### 1. Install Dependencies (Already Done)
```bash
npm install
```

### 2. Configure Environment Variables

Add these to your `.env.local`:

```bash
# Generate these with:
# JWT_SECRET: openssl rand -base64 32
# BREAK_GLASS_URL_TOKEN: openssl rand -hex 32

JWT_SECRET=your-generated-secret-here
BREAK_GLASS_URL_TOKEN=your-generated-token-here
BREAK_GLASS_EMAIL=admin@yourdomain.com
BREAK_GLASS_PASSWORD=your-secure-password
```

### 3. Run Database Migration

```bash
# Apply the audit_logs migration
npx prisma db push
```

### 4. Add Your First Admin

Connect to your SQL Server database and run:

```sql
INSERT INTO admins (id, email, created_by)
VALUES (NEWID(), 'your-email@yourdomain.com', 'system');
```

Or use `sqlcmd`:
```bash
sqlcmd -S your-server.database.windows.net -d peoplepicker -U sqladmin -P "<YourPassword>" -Q "INSERT INTO admins (id, email, created_by) VALUES (NEWID(), 'your-email@yourdomain.com', 'system');"
```

> **Note:** Audit log metadata is stored as serialized text (for example, JSON) within SQL Server to support flexible event details.

### 5. Start the Application

```bash
npm run dev
```

### 6. Access Admin Panel

**Normal Access:**
- Navigate to: `http://localhost:3000/admin`
- You'll be redirected to the dashboard if you're authenticated

**Emergency Access:**
- Navigate to: `http://localhost:3000/admin/emergency?token={YOUR_BREAK_GLASS_URL_TOKEN}`
- Enter your emergency credentials
- Session valid for 1 hour

## 🎯 Common URLs

| Page | URL |
|------|-----|
| Dashboard | `/admin/dashboard` |
| User Management | `/admin/users` |
| Audit Logs | `/admin/audit` |
| Emergency Access | `/admin/emergency?token={token}` |

## 🔑 Emergency Access Example

If your `BREAK_GLASS_URL_TOKEN` is `abc123def456`:

```
http://localhost:3000/admin/emergency?token=abc123def456
```

Then enter your `BREAK_GLASS_EMAIL` and `BREAK_GLASS_PASSWORD`.

## 📊 Features Available

### Dashboard
- View total admins
- See recent audit logs
- Monitor emergency access attempts
- Track login statistics

### User Management
- Add new administrators
- Remove existing administrators
- View admin creation history

### Audit Logs
- View all security events
- Filter by action type
- See IP addresses and user agents
- Export for compliance

## 🔒 Security Notes

1. **Keep `.env.local` secure** - Never commit it to git
2. **Use strong passwords** - For emergency access
3. **Rotate credentials regularly** - Every 90 days recommended
4. **Monitor audit logs** - Check weekly for suspicious activity
5. **Limit admin access** - Only grant when necessary

## 🆘 Troubleshooting

**Can't access admin panel?**
- Use emergency access URL
- Check if your email is in the `admins` table
- Verify environment variables are set

**Session expired?**
- Normal sessions: 24 hours
- Emergency sessions: 1 hour
- Just log in again

**Database migration failed?**
- Try: `npx prisma migrate reset` (⚠️ This will clear your database!)
- Or manually create the tables (see ADMIN_SYSTEM.md)

## 📖 Full Documentation

For complete documentation, see [ADMIN_SYSTEM.md](./ADMIN_SYSTEM.md)
