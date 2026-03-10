FROM node:20-slim
WORKDIR /app

COPY package.json ./
COPY packages/ ./packages/
COPY services/driver-service/ ./services/driver-service/

RUN npm install --workspace=packages/lmdr-types --workspace=packages/lmdr-db --workspace=packages/lmdr-middleware --workspace=services/driver-service
RUN npm run build --workspace=packages/lmdr-types
RUN npm run build --workspace=packages/lmdr-db
RUN npm run build --workspace=packages/lmdr-middleware
RUN npm run build --workspace=services/driver-service

WORKDIR /app/services/driver-service
EXPOSE 8080
ENV PORT=8080
ENV SERVICE_NAME=lmdr-driver-service
CMD ["node", "dist/server.js"]
