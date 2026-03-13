FROM node:20-slim

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY server.js ./
COPY routes/ ./routes/
COPY runtime/ ./runtime/
COPY lib/ ./lib/
COPY jobs/ ./jobs/

EXPOSE 3000

CMD ["node", "server.js"]
