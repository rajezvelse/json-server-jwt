FROM node:9.11

USER root

RUN mkdir /home/app

WORKDIR /home/app

COPY . /home/app

RUN npm install

EXPOSE 3000

ENTRYPOINT ["node", "server.js"]



