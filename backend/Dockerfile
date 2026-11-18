
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY src ./src
COPY --chmod=755 start.sh ./start.sh

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

USER node

CMD ["./start.sh"]
