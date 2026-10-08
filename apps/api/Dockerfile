FROM node:24-bookworm-slim AS build
RUN corepack enable
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile && pnpm db:generate && pnpm --filter @bloodsync/shared build && pnpm --filter @bloodsync/api build
ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "apps/api/dist/apps/api/src/main.js"]
