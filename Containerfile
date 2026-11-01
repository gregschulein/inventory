FROM node:current-alpine

USER node

RUN mkdir /home/node/app

WORKDIR /home/node/app

COPY package.json ./
RUN npm install

COPY app.js ./
COPY static/ ./static/
COPY views/ ./views/

RUN mkdir data

EXPOSE 3000

CMD [ "node", "app.js" ]
