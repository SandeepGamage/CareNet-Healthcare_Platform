FROM node:18-alpine

WORKDIR /app

# Install all dependencies (including nodemon for dev)
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

EXPOSE 3003

# Default command (can be overridden by docker-compose)
CMD ["npm", "start"]
