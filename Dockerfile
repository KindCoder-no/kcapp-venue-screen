FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./

# Install dependencies
RUN npm ci || npm install

# Install serve package for static file serving
RUN npm install -g serve

# Copy source code
COPY . .

# Build-time variables used by Vite
ARG VITE_APP_BASE_PATH
ENV VITE_APP_BASE_PATH=$VITE_APP_BASE_PATH

# Build the app
RUN npm run build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (res) => {if (res.statusCode !== 200) throw new Error(res.statusCode)})" || exit 1

# Serve the built app
CMD ["serve", "-s", "dist", "-l", "3000"]
