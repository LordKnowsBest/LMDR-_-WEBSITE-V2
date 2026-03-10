FROM node:20-slim
WORKDIR /app

# Copy monorepo root and shared packages
COPY package.json ./
COPY packages/ ./packages/

# Copy service
COPY services/matching-engine/ ./services/matching-engine/

# Install and build
RUN npm install --workspace=packages/lmdr-types --workspace=packages/lmdr-db --workspace=packages/lmdr-middleware --workspace=services/matching-engine
RUN npm run build --workspace=packages/lmdr-types
RUN npm run build --workspace=packages/lmdr-db
RUN npm run build --workspace=packages/lmdr-middleware
RUN npm run build --workspace=services/matching-engine

WORKDIR /app/services/matching-engine
EXPOSE 8080
ENV PORT=8080
ENV SERVICE_NAME=lmdr-matching-engine
CMD ["node", "dist/server.js"]
