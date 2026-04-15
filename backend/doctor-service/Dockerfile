FROM node:18-alpine

WORKDIR /app

# Install production dependencies first for better Docker layer caching
COPY package*.json ./
RUN npm install --production

# Copy source code
COPY . .

EXPOSE 5001

CMD ["node", "index.js"]
