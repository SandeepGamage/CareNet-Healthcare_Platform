FROM node:20-alpine

WORKDIR /app

RUN mkdir -p /keys

COPY package*.json ./
RUN npm config set registry https://registry.npmmirror.com/ \
 && npm config set fetch-retries 5 \
 && npm config set fetch-retry-factor 3 \
 && npm config set fetch-retry-mintimeout 10000 \
 && npm config set fetch-retry-maxtimeout 60000 \
 && npm ci --omit=dev --no-audit

COPY . .

EXPOSE 3007

CMD ["npm", "start"]
