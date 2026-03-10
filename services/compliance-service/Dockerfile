FROM node:20-slim
WORKDIR /app

COPY package.json ./
COPY packages/ ./packages/
COPY services/compliance-service/ ./services/compliance-service/

RUN npm install --workspace=packages/lmdr-types --workspace=packages/lmdr-db --workspace=packages/lmdr-middleware --workspace=services/compliance-service
RUN npm run build --workspace=packages/lmdr-types
RUN npm run build --workspace=packages/lmdr-db
RUN npm run build --workspace=packages/lmdr-middleware
RUN npm run build --workspace=services/compliance-service

WORKDIR /app/services/compliance-service
EXPOSE 8080
ENV PORT=8080
ENV SERVICE_NAME=lmdr-compliance-service
CMD ["node", "dist/server.js"]
