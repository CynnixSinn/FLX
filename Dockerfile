# Use the official Node.js 18 image
# https://hub.docker.com/_/node
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the TypeScript code
RUN npm run build

# Expose port 5000 to allow communication to/from the FLX server
EXPOSE 5000

# Run the server when the container launches
CMD ["npm", "start"]