# Step 1: Build the React app
FROM node:20-slim AS build
WORKDIR /app

# Copy dependency files
COPY package*.json ./

# DEEP FIX: Remove package-lock.json to avoid the "Invalid Native Binding" bug
# which happens when a lockfile generated on Windows is used in Linux Docker.
# Then install dependencies including optional native binaries.
RUN rm -f package-lock.json && \
    npm install --include=optional

# Copy the rest of the source code
COPY . .

# Build the application
RUN npm run build

# Step 2: Serve the app with Nginx (Alpine is fine for the final image)
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

# nginx config for SPA routing
RUN echo 'server { \
  listen 80; \
  location / { \
    root /usr/share/nginx/html; \
    index index.html; \
    try_files $uri $uri/ /index.html; \
  } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
