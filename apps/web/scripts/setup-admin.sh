#!/bin/bash

# Admin System Setup Script
# This script helps set up the admin authentication system

set -e

echo "🔐 Admin System Setup"
echo "===================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}⚠️  .env.local not found${NC}"
    echo "Creating from .env.local.example..."
    cp .env.local.example .env.local
    echo -e "${GREEN}✓ Created .env.local${NC}"
fi

echo ""
echo "Generating secure tokens..."
echo ""

# Generate JWT secret
JWT_SECRET=$(openssl rand -base64 32)
echo -e "${GREEN}✓ Generated JWT_SECRET${NC}"

# Generate break glass URL token
BREAK_GLASS_URL_TOKEN=$(openssl rand -hex 32)
echo -e "${GREEN}✓ Generated BREAK_GLASS_URL_TOKEN${NC}"

# Prompt for break glass credentials
echo ""
echo "Enter emergency access credentials:"
read -p "Emergency admin email: " BREAK_GLASS_EMAIL
read -sp "Emergency admin password: " BREAK_GLASS_PASSWORD
echo ""

# Update .env.local
echo ""
echo "Updating .env.local with generated values..."

# Check if values already exist and update them
if grep -q "^JWT_SECRET=" .env.local; then
    sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" .env.local
else
    echo "JWT_SECRET=$JWT_SECRET" >> .env.local
fi

if grep -q "^BREAK_GLASS_URL_TOKEN=" .env.local; then
    sed -i "s|^BREAK_GLASS_URL_TOKEN=.*|BREAK_GLASS_URL_TOKEN=$BREAK_GLASS_URL_TOKEN|" .env.local
else
    echo "BREAK_GLASS_URL_TOKEN=$BREAK_GLASS_URL_TOKEN" >> .env.local
fi

if grep -q "^BREAK_GLASS_EMAIL=" .env.local; then
    sed -i "s|^BREAK_GLASS_EMAIL=.*|BREAK_GLASS_EMAIL=$BREAK_GLASS_EMAIL|" .env.local
else
    echo "BREAK_GLASS_EMAIL=$BREAK_GLASS_EMAIL" >> .env.local
fi

if grep -q "^BREAK_GLASS_PASSWORD=" .env.local; then
    sed -i "s|^BREAK_GLASS_PASSWORD=.*|BREAK_GLASS_PASSWORD=$BREAK_GLASS_PASSWORD|" .env.local
else
    echo "BREAK_GLASS_PASSWORD=$BREAK_GLASS_PASSWORD" >> .env.local
fi

echo -e "${GREEN}✓ Updated .env.local${NC}"

echo ""
echo "Running database migrations..."
npx prisma migrate deploy || npx prisma db push

echo ""
echo -e "${GREEN}✓ Database migrations complete${NC}"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✓ Admin system setup complete!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Add your first admin to your SQL Server database:"
echo "   sqlcmd -S your-server.database.windows.net -d peoplepicker -U sqladmin -P \"<YourPassword>\" -Q \"INSERT INTO admins (id, email, created_by) VALUES (NEWID(), 'your-email@domain.com', 'system');\""
echo ""
echo "   # Or execute with Prisma CLI:"
echo "   npx prisma db execute --url \"\$DATABASE_URL\" --script \"INSERT INTO admins (id, email, created_by) VALUES (NEWID(), 'your-email@domain.com', 'system');\""
echo ""
echo "2. Access the admin panel:"
echo "   - Normal access: http://localhost:3000/admin"
echo "   - Emergency access: http://localhost:3000/admin/emergency?token=$BREAK_GLASS_URL_TOKEN"
echo ""
echo "3. Save your emergency access URL securely!"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Keep your .env.local file secure and never commit it to version control${NC}"
echo ""
