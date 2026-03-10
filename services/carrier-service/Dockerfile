FROM node:20-slim
WORKDIR /app

COPY package.json ./
COPY packages/ ./packages/
COPY services/carrier-service/ ./services/carrier-service/

RUN npm install --workspace=packages/lmdr-types --workspace=packages/lmdr-db --workspace=packages/lmdr-middleware --workspace=services/carrier-service
RUN npm run build --workspace=packages/lmdr-types
RUN npm run build --workspace=packages/lmdr-db
RUN npm run build --workspace=packages/lmdr-middleware
RUN npm run build --workspace=services/carrier-service

WORKDIR /app/services/carrier-service
EXPOSE 8080
ENV PORT=8080
ENV SERVICE_NAME=lmdr-carrier-service
CMD ["node", "dist/server.js"]
