FROM oven/bun:1-alpine AS installer
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

FROM node:22-alpine
WORKDIR /app
COPY --from=installer /app/node_modules ./node_modules
COPY . .
CMD ["npx", "tsx", "src/index.ts"]
