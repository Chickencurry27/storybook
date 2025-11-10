FROM node:22-bookworm

# Set working directory
WORKDIR /usr/src/app

# Install dependencies first
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy the rest of the app
COPY . .

# Expose Storybook port
EXPOSE 6006

# Use host network for hot reload
ENV CHOKIDAR_USEPOLLING=true

# Default command
CMD ["npm", "run", "storybook"]
