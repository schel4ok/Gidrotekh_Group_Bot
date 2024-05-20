FROM node:current-alpine3.19

WORKDIR /app

COPY package*.json .

RUN npm i --legacy-peer-deps

COPY . . 

RUN npm run build

CMD [ "npm", "run", "start" ]