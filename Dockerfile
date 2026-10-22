# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npx prisma generate
ARG NEXT_PUBLIC_BUILD_ID
ARG BUILD_TIME
ENV NEXT_PUBLIC_BUILD_ID=${NEXT_PUBLIC_BUILD_ID}
ENV BUILD_TIME=${BUILD_TIME}
RUN npm run build

# Runtime stage
FROM node:20-alpine
RUN apk add --no-cache curl
WORKDIR /app
COPY --from=builder --chown=node:node /app/.next ./.next
COPY --from=builder --chown=node:node /app/public ./public
COPY --chown=node:node package*.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY --from=builder --chown=node:node /app/node_modules/.prisma ./node_modules/.prisma

USER node

HEALTHCHECK --interval=10s --timeout=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

EXPOSE 3000
CMD ["npm", "start"]
