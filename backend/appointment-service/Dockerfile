FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY . .

RUN rm -f .env

EXPOSE 3004

CMD ["node", "index.js"]