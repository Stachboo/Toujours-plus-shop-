FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate
WORKDIR /app

# Install dependencies
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches/
RUN pnpm install --frozen-lockfile --prod=false

# Copy source
COPY . .

# Build backend
RUN pnpm run build

# Production stage
FROM node:20-alpine AS production
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
COPY patches ./patches/
RUN pnpm install --frozen-lockfile --prod

COPY --from=base /app/dist ./dist

EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
