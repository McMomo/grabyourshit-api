FROM node:12-slim

# Create an app directory in the docker
WORKDIR /app

# Copy the package.json and package-lock.json. 
COPY package.json yarn.lock ./
COPY tsconfig.json ./

# Install production dependencies.
RUN yarn && yarn cache clean

# Copy local code to the container image.
COPY . ./

# Run the server
CMD yarn start