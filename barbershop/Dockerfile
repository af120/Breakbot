FROM node:18-alpine

WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy all files
COPY . .

# Build the frontend
RUN npm run build

# Expose port 3000
EXPOSE 3000

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Start the server (which now serves both API and built frontend)
CMD ["node", "server/index.js"]
