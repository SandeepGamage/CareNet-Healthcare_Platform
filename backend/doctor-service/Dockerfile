FROM node:20-alpine

WORKDIR /app

# Install all dependencies (including nodemon for dev)
COPY package*.json ./
RUN npm config set registry https://registry.npmmirror.com/ \
 && npm config set fetch-retries 5 \
 && npm config set fetch-retry-factor 3 \
 && npm config set fetch-retry-mintimeout 10000 \
 && npm config set fetch-retry-maxtimeout 60000 \
 && npm ci --no-audit

# Copy source code
COPY . .

EXPOSE 3003

# Default command (can be overridden by docker-compose)
CMD ["npm", "start"]
