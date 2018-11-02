FROM node:8-alpine as BASE
RUN apk --no-cache add --virtual native-deps \
  g++ gcc libgcc libstdc++ linux-headers autoconf automake make nasm python git 
RUN npm install node-gyp -g --unsafe-perm=true --allow-root
WORKDIR /iforce-api-app
COPY package.json /iforce-api-app/package.json
RUN npm install 

FROM node:8-alpine as FINAL
WORKDIR /iforce-api-app
#RUN mkdir node_modules
COPY --from=BASE /iforce-api-app/node_modules node_modules/
COPY ./ ./
COPY .env.production .env


