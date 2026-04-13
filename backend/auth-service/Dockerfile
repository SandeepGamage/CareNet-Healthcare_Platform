FROM node:18-alpine

WORKDIR /app

# Install dependencies first for better caching
COPY package*.json ./
RUN npm install --production

# Copy application source code
COPY . .

# Expose port (ensure it matches your .env or the default)
EXPOSE 3001

# Start the service
CMD ["npm", "start"]
