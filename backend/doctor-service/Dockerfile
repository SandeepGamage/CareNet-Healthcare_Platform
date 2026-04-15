FROM node:18-alpine

WORKDIR /app

# Install production dependencies first for better Docker layer caching
COPY package*.json ./
RUN npm install --production

# Copy source code
COPY . .

EXPOSE 3003

CMD ["node", "index.js"]
