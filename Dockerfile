
FROM node:12-alpine

WORKDIR /usr/viva/service

# Start with just the package files so we can install dependencies
COPY package.json package-lock.json ./

# We need node-gyp and build tools, so install them before installing dependencies
RUN apk add --no-cache g++ gcc libgcc libstdc++ linux-headers make python && \
	npm install node-gyp -g && \
	npm ci --only-production

# Next, move the built dependencies over to a fresh image to get rid of the build tools
# as they add ~225 MB of extra size to the image
FROM node:12-alpine

# Finally, move the actual app files
COPY build ./build

EXPOSE 8080

CMD [ "node", "./build/start.js" ]
