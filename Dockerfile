FROM opensuse/leap:15.0

RUN  zypper -n update
RUN  zypper -n install npm8

ADD . /ui
WORKDIR /ui
RUN npm install

EXPOSE 2209

CMD ["/usr/bin/npm", "start"]
