FROM node:20
RUN apt-get update && apt-get upgrade -y
WORKDIR /app
COPY package.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["node", "src/index.js"]
