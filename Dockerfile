FROM node:24-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev && \
    npm cache clean --force

COPY telegram-to-wa.js .

USER node

CMD ["node", "telegram-to-wa.js"]
