# Use Node.js LTS version
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Ensure logs directory exists
RUN mkdir -p logs

# Expose the port the app runs on
EXPOSE 5004

# Command to run the application
CMD ["npm", "start"]
