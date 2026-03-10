FROM node:20-slim
WORKDIR /app

COPY package.json ./
COPY packages/ ./packages/
COPY services/billing-service/ ./services/billing-service/

RUN npm install --workspace=packages/lmdr-types --workspace=packages/lmdr-db --workspace=packages/lmdr-middleware --workspace=services/billing-service
RUN npm run build --workspace=packages/lmdr-types
RUN npm run build --workspace=packages/lmdr-db
RUN npm run build --workspace=packages/lmdr-middleware
RUN npm run build --workspace=services/billing-service

WORKDIR /app/services/billing-service
EXPOSE 8080
ENV PORT=8080
ENV SERVICE_NAME=lmdr-billing-service
CMD ["node", "dist/server.js"]
