# Serve pre-built React app with nginx
FROM nginx:alpine

# Copy built dist files
COPY dist/ /usr/share/nginx/html/

# nginx config to handle React Router (SPA fallback)
RUN echo 'server { \
  listen 80; \
  location / { \
    root /usr/share/nginx/html; \
    index index.html; \
    try_files $uri $uri/ /index.html; \
  } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
