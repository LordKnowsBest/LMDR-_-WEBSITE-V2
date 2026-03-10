FROM node:20-slim
WORKDIR /app

COPY package.json ./
COPY packages/ ./packages/
COPY services/notifications-service/ ./services/notifications-service/

RUN npm install --workspace=packages/lmdr-types --workspace=packages/lmdr-db --workspace=packages/lmdr-middleware --workspace=services/notifications-service
RUN npm run build --workspace=packages/lmdr-types
RUN npm run build --workspace=packages/lmdr-db
RUN npm run build --workspace=packages/lmdr-middleware
RUN npm run build --workspace=services/notifications-service

WORKDIR /app/services/notifications-service
EXPOSE 8080
ENV PORT=8080
ENV SERVICE_NAME=lmdr-notifications-service
ENV SENDGRID_API_KEY=""
ENV TWILIO_ACCOUNT_SID=""
ENV TWILIO_AUTH_TOKEN=""
ENV TWILIO_PHONE_NUMBER=""
CMD ["node", "dist/server.js"]
