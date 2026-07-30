# ============================================
# BUILD STAGE
# ============================================
FROM node:22-alpine AS builder

WORKDIR /app

# Install necessary build deps
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source
COPY . .

# Build-time vars
ARG NEXT_PUBLIC_APPWRITE_ENDPOINT
ENV NEXT_PUBLIC_APPWRITE_ENDPOINT=$NEXT_PUBLIC_APPWRITE_ENDPOINT
ARG NEXT_PUBLIC_APPWRITE_PROJECT_ID
ENV NEXT_PUBLIC_APPWRITE_PROJECT_ID=$NEXT_PUBLIC_APPWRITE_PROJECT_ID
ARG APPWRITE_API_KEY
ENV APPWRITE_API_KEY=$APPWRITE_API_KEY
ARG SMTP_ENCRYPTION_KEY
ENV SMTP_ENCRYPTION_KEY=$SMTP_ENCRYPTION_KEY
ARG GIT_COMMIT
ENV NEXT_PUBLIC_GIT_COMMIT=$GIT_COMMIT

# Build
RUN npm run build

# ============================================
# PRODUCTION STAGE
# ============================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Runtime env vars (set via Easypanel environment — do NOT hardcode secrets here)
ENV NEXT_PUBLIC_APPWRITE_ENDPOINT=""
ENV NEXT_PUBLIC_APPWRITE_PROJECT_ID=""
ENV APPWRITE_API_KEY=""
ENV APPWRITE_DATABASE_ID=""
ENV NEXT_PUBLIC_APP_URL=""

ENV ALLOW_DB_RESET=false

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone output
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/scripts ./scripts

RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
