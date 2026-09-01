FROM node:22-alpine AS base

FROM base AS builder
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Enable corepack for pnpm
RUN corepack enable pnpm

# First install the dependencies (as they change less often)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/merchant-dashboard/package.json ./apps/merchant-dashboard/
COPY apps/frostrek-dashboard/package.json ./apps/frostrek-dashboard/
COPY apps/widget/package.json ./apps/widget/
COPY apps/qa-panel/package.json ./apps/qa-panel/

RUN pnpm install --frozen-lockfile

# Copy source code (host .next / node_modules are excluded via .dockerignore)
COPY . .

# Add build-time arguments for Next.js public variables
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WIDGET_HOST
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_DEMO_API_URL=/demo-api
ARG NEXT_PUBLIC_META_APP_ID=4348632945374978
ARG NEXT_PUBLIC_META_CONFIG_ID=1061344189819875
ARG SITEGUIDE_UPSTREAM=http://127.0.0.1:8002
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WIDGET_HOST=$NEXT_PUBLIC_WIDGET_HOST
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_DEMO_API_URL=$NEXT_PUBLIC_DEMO_API_URL
ENV NEXT_PUBLIC_META_APP_ID=$NEXT_PUBLIC_META_APP_ID
ENV NEXT_PUBLIC_META_CONFIG_ID=$NEXT_PUBLIC_META_CONFIG_ID
ENV SITEGUIDE_UPSTREAM=$SITEGUIDE_UPSTREAM
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS=--max-old-space-size=2048

# Drop any leftover Next cache, then build. `output: "standalone"` writes
# apps/merchant-dashboard/.next/standalone; tracing-root layouts nest server.js.
RUN rm -rf apps/merchant-dashboard/.next \
  && pnpm --filter @frosty/merchant-dashboard build \
  && if [ ! -d apps/merchant-dashboard/.next/standalone ]; then \
       echo "ERROR: .next/standalone missing after next build"; \
       ls -la apps/merchant-dashboard/.next || true; \
       find /app -type d -name standalone 2>/dev/null | head -20 || true; \
       exit 1; \
     fi \
  && SERVER="$(find apps/merchant-dashboard/.next/standalone -name server.js | head -n1)" \
  && echo "standalone server.js -> ${SERVER}" \
  && test -n "$SERVER" \
  && test -f "$SERVER"

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Standalone layout varies: nested (apps/merchant-dashboard/server.js) with
# outputFileTracingRoot, or flat (server.js) without it. Normalize both.
COPY --from=builder --chown=nextjs:nodejs /app/apps/merchant-dashboard/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/merchant-dashboard/.next/static /tmp/next-static
COPY --from=builder --chown=nextjs:nodejs /app/apps/merchant-dashboard/public /tmp/next-public

USER root
RUN set -eux; \
  if [ -f ./apps/merchant-dashboard/server.js ]; then \
    mkdir -p ./apps/merchant-dashboard/.next/static ./apps/merchant-dashboard/public; \
    cp -a /tmp/next-static/. ./apps/merchant-dashboard/.next/static/; \
    cp -a /tmp/next-public/. ./apps/merchant-dashboard/public/; \
    printf '%s\n' '#!/bin/sh' 'exec node apps/merchant-dashboard/server.js' > /app/start.sh; \
  elif [ -f ./server.js ]; then \
    mkdir -p ./.next/static ./public; \
    cp -a /tmp/next-static/. ./.next/static/; \
    cp -a /tmp/next-public/. ./public/; \
    printf '%s\n' '#!/bin/sh' 'exec node server.js' > /app/start.sh; \
  else \
    echo "ERROR: server.js missing from standalone output"; \
    find . -maxdepth 6 \( -type f -o -type d \) | head -120; \
    exit 1; \
  fi; \
  chmod +x /app/start.sh; \
  chown -R nextjs:nodejs /app; \
  rm -rf /tmp/next-static /tmp/next-public

USER nextjs

EXPOSE 3000

ENV PORT=3000
# set hostname to localhost
ENV HOSTNAME="0.0.0.0"

CMD ["sh", "/app/start.sh"]
