# Use Node.js LTS version
FROM node:20-alpine

# Install build dependencies for native modules (zeromq, bufferutil)
RUN apk add --no-cache python3 make g++ zeromq-dev

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy all source files
COPY . .

# Build the application
RUN npm run build

# Expose port 5000
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
