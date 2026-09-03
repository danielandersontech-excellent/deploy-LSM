# Dockerfile — WARKOP NUSANTARA (cetak biru bagian 6, pola tiga tahap)
# Custom server.js (Next.js + Socket.io) -> runtime butuh node_modules PENUH dan berkas sumber.
# JANGAN output: 'standalone' (aturan 10). proxy.js WAJIB tersalin (aturan 11).

# --- Tahap 1: dependensi ---
FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json* ./
RUN npm ci --include=dev

# --- Tahap 2: build ---
FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# HANYA variabel publik yang boleh jadi ARG. Nilai NEXT_PUBLIC_* memang
# tertanam ke berkas JavaScript saat build, jadi wajar ada di sini.
# JANGAN pernah menaruh DB_PASSWORD / JWT_SECRET / SEED_ADMIN_PASSWORD sebagai ARG
# (pelajaran Cap Jiki nomor 2: rahasia tercetak terbuka di log build).
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL
ENV NODE_ENV=production
RUN npm run build
RUN npm prune --omit=dev

# --- Tahap 3: runtime ---
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV TZ=Asia/Jakarta
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN apk add --no-cache tzdata wget && \
    cp /usr/share/zoneinfo/Asia/Jakarta /etc/localtime && \
    echo "Asia/Jakarta" > /etc/timezone

RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Custom server butuh source, bukan hanya .next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules     ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next            ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public           ./public
COPY --from=builder --chown=nextjs:nodejs /app/package.json     ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/next.config.mjs  ./next.config.mjs
COPY --from=builder --chown=nextjs:nodejs /app/server.js        ./server.js
COPY --from=builder --chown=nextjs:nodejs /app/proxy.js         ./proxy.js
COPY --from=builder --chown=nextjs:nodejs /app/lib              ./lib
COPY --from=builder --chown=nextjs:nodejs /app/database         ./database
# KEPUTUSAN BARU Tahap 3: scripts/ ikut agar `node scripts/seed.js` bisa dijalankan di container
COPY --from=builder --chown=nextjs:nodejs /app/scripts          ./scripts

# Volume unggahan dipasang di sini (Coolify: /app/public/unggahan). Folder dibuat dengan
# pemilik nextjs agar volume kosong yang baru dipasang mewarisi kepemilikannya.
RUN mkdir -p /app/public/unggahan && chown nextjs:nodejs /app/public/unggahan

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
