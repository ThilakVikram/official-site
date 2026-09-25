# syntax=docker/dockerfile:1

# Debian (glibc) base: argon2 and the onnxruntime used by @chroma-core/default-embed
# ship prebuilt binaries that don't run on Alpine/musl.
ARG NODE_VERSION=24-bookworm-slim

# ---- deps: full install (dev deps are needed to build) ----
FROM node:${NODE_VERSION} AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# Clean the npm cache in the same layer so ~1 GB of tarballs isn't kept in the image.
RUN npm ci --no-audit --no-fund && npm cache clean --force

# ---- build ----
# Built on top of deps (not COPY --from) so node_modules isn't duplicated on disk.
FROM deps AS build
ENV NEXT_TELEMETRY_DISABLED=1
COPY . .
# Turbopack's externals tracing follows chromadb into default-embed's CJS type
# declarations (.d.cts) and fails on them as if they were code; they aren't
# needed to build or run (the app uses the ESM .d.ts types).
RUN rm -f node_modules/@chroma-core/default-embed/dist/cjs/*.d.cts \
 && npx prisma generate --config prisma7.config.ts \
 && npm run build

# ---- migrate: one-off job that applies Prisma migrations (keeps the prisma CLI) ----
# Needs only the prisma CLI + schema, so it doesn't wait on the app build.
FROM deps AS migrate
COPY prisma7.config.ts ./
COPY database/schema ./database/schema
COPY database/migrations ./database/migrations
CMD ["npx", "prisma", "migrate", "deploy", "--config", "prisma7.config.ts"]

# ---- prune dev deps for the runtime image ----
# Also drops binaries this image never loads: onnxruntime's GPU providers
# (CUDA/TensorRT, ~300 MB) and other-OS builds, and Next's musl compiler.
FROM build AS prune
RUN npm prune --omit=dev --no-audit --no-fund \
 && rm -rf node_modules/onnxruntime-node/bin/napi-v3/darwin \
           node_modules/onnxruntime-node/bin/napi-v3/win32 \
           node_modules/onnxruntime-node/bin/napi-v3/linux/*/libonnxruntime_providers_cuda.so \
           node_modules/onnxruntime-node/bin/napi-v3/linux/*/libonnxruntime_providers_tensorrt.so \
           node_modules/@next/swc-linux-*-musl \
 && npm cache clean --force

# ---- runtime ----
FROM node:${NODE_VERSION} AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

COPY --from=build --chown=node:node /app/package.json ./
COPY --from=build --chown=node:node /app/next.config.ts ./
COPY --from=prune --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/.next ./.next
COPY --from=build --chown=node:node /app/public ./public

USER node
EXPOSE 3000
CMD ["npx", "next", "start"]
