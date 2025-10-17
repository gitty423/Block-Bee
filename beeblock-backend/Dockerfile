FROM node:18-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --only=production || true
COPY . .
ENV NODE_ENV=production
CMD [ "node", "src/index.js" ]
