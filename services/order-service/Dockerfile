FROM node:20-alpine

# 1. Update the global npm to the latest secure version
RUN npm install -g npm@latest

WORKDIR /app
COPY package.json ./

# 2. Install your dependencies
RUN npm install --production

COPY . .
EXPOSE 3003
CMD ["node", "src/index.js"]
