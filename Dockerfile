# Use Node.js base image
FROM node:18

# Set the working directory inside the container
WORKDIR /usr/src/app

# Install FFmpeg
RUN apt-get update && apt-get install -y ffmpeg

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install application dependencies
RUN npm install --force

# Copy the application code into the container
COPY . .

# Testing before we build
RUN npm test

# Build the application
RUN npm run build

# Expose the application's port
EXPOSE 3000

# Command to run the application
CMD ["npm", "run", "start:prod"]
