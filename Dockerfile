# FROM node:14

# RUN apt-get update && apt-get install -y libudev-dev libusb-1.0-0-dev libglib2.0-dev

# RUN cd /tmp && \
#     wget https://github.com/libvips/libvips/releases/download/v8.10.5/vips-8.10.5.tar.gz && \
#     tar xf vips-8.10.5.tar.gz && \
#     cd vips-8.10.5 && \
#     ./configure && \
#     make && \
#     make install && \
#     ldconfig

FROM jonahm/node-14-plus-libs

WORKDIR /usr/src/app

RUN git config --global url."https://".insteadOf ssh://

COPY package*.json ./

RUN npm ci

COPY . .

EXPOSE 3000

CMD [ "npm", "start" ]