FROM node:20-slim
WORKDIR /app

COPY package.json ./
COPY packages/ ./packages/
COPY services/ai-service/ ./services/ai-service/

RUN npm install --workspace=packages/lmdr-types --workspace=packages/lmdr-db --workspace=packages/lmdr-middleware --workspace=services/ai-service
RUN npm run build --workspace=packages/lmdr-types
RUN npm run build --workspace=packages/lmdr-db
RUN npm run build --workspace=packages/lmdr-middleware
RUN npm run build --workspace=services/ai-service

WORKDIR /app/services/ai-service
EXPOSE 8080
ENV PORT=8080
ENV SERVICE_NAME=lmdr-ai-service
CMD ["node", "dist/server.js"]
