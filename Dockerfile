FROM node:10.12.0

LABEL maintainer="pugochukwu@vas-consulting.com"

# use changes to package.json to force Docker not to use the cache
# when we change our application's nodejs dependencies:
ADD package.json /tmp/package.json
RUN cd /tmp && npm install
RUN mkdir -p /opt/mrworking-api && cp -a /tmp/node_modules /opt/mrworking-api/

WORKDIR /opt/mrworking-api
ADD . /opt/mrworking-api

EXPOSE 9003

CMD ["npm", "start"]