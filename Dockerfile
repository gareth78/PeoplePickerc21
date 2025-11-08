# --- builder ---
FROM node:20-bookworm-slim AS builder
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/
COPY apps/addin/package.json apps/addin/
COPY packages/sdk/package.json packages/sdk/
RUN npm ci --workspaces --include-workspace-root

COPY . .

WORKDIR /app/apps/web
RUN npx prisma generate --schema ./prisma/schema.prisma

WORKDIR /app
ARG DATABASE_URL
ARG INITIAL_ADMIN_EMAIL
ENV DATABASE_URL=${DATABASE_URL}
ENV INITIAL_ADMIN_EMAIL=${INITIAL_ADMIN_EMAIL}
RUN npm run build

# --- runner ---
FROM node:20-bookworm-slim AS runner
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app .

EXPOSE 3000
CMD ["npm","run","start","--workspace","@people-picker/web"]
