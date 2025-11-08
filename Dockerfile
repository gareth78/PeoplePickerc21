# --- builder ---
FROM node:20-bookworm-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci
# Copy prisma schema early to leverage caching for generate
COPY apps/web/prisma ./apps/web/prisma
ARG PRISMA_SCHEMA=./prisma/schema.prisma
ENV PRISMA_SCHEMA=${PRISMA_SCHEMA}
# Prisma generate does not require a live DB; it reads the schema.
WORKDIR /app/apps/web
RUN npx prisma generate --schema "$PRISMA_SCHEMA"
WORKDIR /app
# Copy rest of the source
COPY . .
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
# Copy artifacts
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
EXPOSE 3000
CMD ["npm","start"]
