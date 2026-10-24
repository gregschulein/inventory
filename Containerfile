FROM node:current-alpine

USER node

RUN mkdir /home/node/app

WORKDIR /home/node/app

COPY --exclude=Containerfile \
     --exclude=Makefile \
     --exclude=LICENSE \
     --exclude=README.md \
     . .

RUN npm install

RUN mkdir data

EXPOSE 3000

CMD [ "node", "app.js" ]
