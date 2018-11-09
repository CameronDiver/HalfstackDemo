FROM resin/raspberrypi3-node:10

RUN apt-get update && \
  apt-get install -y alsa-utils && \
  rm -rf /var/lib/apt/lists/*

RUN ln $(which node) "$(which node | xargs dirname)/nodejs"

WORKDIR /usr/src/app

COPY package.json .

RUN npm install

COPY lib/ lib/

CMD npm start
