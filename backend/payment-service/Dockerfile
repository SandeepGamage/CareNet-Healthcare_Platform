FROM node:20-alpine

WORKDIR /app

# Install dependencies (layer cache — copy package files first)
COPY package*.json ./
RUN npm config set registry https://registry.npmmirror.com/ \
 && npm config set fetch-retries 5 \
 && npm config set fetch-retry-factor 3 \
 && npm config set fetch-retry-mintimeout 10000 \
 && npm config set fetch-retry-maxtimeout 60000 \
 && npm ci --omit=dev --no-audit

# Copy application source
COPY . .

# Create logs directory
RUN mkdir -p logs

EXPOSE 5003

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:5003/health || exit 1

CMD ["node", "src/index.js"]
