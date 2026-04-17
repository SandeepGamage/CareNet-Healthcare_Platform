FROM node:20-alpine

WORKDIR /app

RUN mkdir -p /keys

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3007

CMD ["npm", "start"]
