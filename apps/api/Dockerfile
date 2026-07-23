# Build context is the monorepo root (docker build -f apps/api/Dockerfile .)
# because apps/api has no lockfile of its own — npm workspaces keeps one at the root.

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
RUN npm ci
COPY apps/api ./apps/api
WORKDIR /app/apps/api
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
# Reusing the build stage's full node_modules (including devDependencies, e.g. the
# `prisma` CLI needed at startup for migrate/seed) rather than a slimmer `npm ci --omit=dev`
# reinstall — that approach kept losing the prisma CLI's node_modules/.bin symlink.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/prisma ./apps/api/prisma
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/apps/api/tsconfig.json ./apps/api/tsconfig.json

WORKDIR /app/apps/api
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && node dist/src/main.js"]
