FROM node:14-alpine
# FROM rickydunlop/nodejs-ffmpeg

WORKDIR /usr/src/app

ARG NODE_ENV
ENV NODE_ENV $NODE_ENV

COPY package*.json /usr/src/app/
RUN npm install
RUN apk update
RUN apk add
RUN apk add ffmpeg

COPY . /usr/src/app/

CMD ["node", "index.js"]

### ffmpeg

# FROM jrottenberg/ffmpeg:3.4-alpine AS ffmpeg

# COPY --from=jrottenberg/ffmpeg:3.4-alpine / /