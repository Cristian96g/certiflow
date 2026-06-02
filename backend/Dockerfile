FROM node:20-bookworm

WORKDIR /app

RUN apt-get update && apt-get install -y libreoffice \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 4000

CMD ["npm", "start"]