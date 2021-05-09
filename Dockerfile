# Use the official lightweight Node.js 12 image.
# https://hub.docker.com/_/node
FROM node:12-slim

# Create and change to the app directory.
WORKDIR /usr/src/app
# Copy local code to the container image.
COPY ./app ./

RUN npm ci --prefix ./api --only=production; \
    npm install --prefix ./dashboard

RUN npm install -g @angular/cli@latest; \
    npm run build --prefix ./dashboard

# Run the web service on container startup.
CMD [ "npm", "start", "--prefix", "./api" ]