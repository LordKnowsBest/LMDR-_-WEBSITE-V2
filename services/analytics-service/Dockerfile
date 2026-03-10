FROM node:20-slim
WORKDIR /app

COPY package.json ./
COPY packages/ ./packages/
COPY services/analytics-service/ ./services/analytics-service/

RUN npm install --workspace=packages/lmdr-types --workspace=packages/lmdr-db --workspace=packages/lmdr-middleware --workspace=services/analytics-service
RUN npm run build --workspace=packages/lmdr-types
RUN npm run build --workspace=packages/lmdr-db
RUN npm run build --workspace=packages/lmdr-middleware
RUN npm run build --workspace=services/analytics-service

WORKDIR /app/services/analytics-service
EXPOSE 8080
ENV PORT=8080
ENV SERVICE_NAME=lmdr-analytics-service
CMD ["node", "dist/server.js"]
