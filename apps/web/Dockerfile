FROM node:24-bookworm-slim AS build
RUN corepack enable
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile && pnpm --filter @bloodsync/shared build && pnpm --filter @bloodsync/web build
ENV NODE_ENV=production
EXPOSE 3000
CMD ["pnpm", "--filter", "@bloodsync/web", "start"]
