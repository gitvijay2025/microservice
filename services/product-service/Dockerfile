FROM node:20-alpine
RUN npm install -g npm@latest
WORKDIR /app
COPY package.json ./
RUN npm install --production
COPY . .
EXPOSE 3002
CMD ["node", "src/index.js"]