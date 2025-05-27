
FROM node:20.2.0-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./  
RUN npm install

COPY . .


RUN npm run build