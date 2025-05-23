FROM node:18-alpine
# Installing libvips-dev for sharp Compatibility
RUN apk update && apk add --no-cache build-base gcc autoconf automake zlib-dev libpng-dev nasm bash vips-dev git

# Create app directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json* ./

# Install app dependencies
RUN npm install

# Set NODE_ENV to production
ENV NODE_ENV=production

# Copy the rest of the application
COPY . .

# Build the app
RUN npm run build

# Expose the port Strapi will run on
EXPOSE 1337

# Start the application
CMD ["npm", "start"]