# Docker Deployment Guide

This document describes how to build, run, and deploy the kcapp-venue-screen application using Docker.

## Overview

The Docker setup uses Node.js to build and serve the app:
- Builds the React/TypeScript app with Vite
- Uses `serve` package to serve the built static files
- Lightweight and simple - no separate nginx container needed

The final image includes only the app dependencies and the production build (~300MB).

## Prerequisites

- Docker (v20+)
- Docker Compose (v2+) - optional, for easier local development

## Quick Start

### Using Docker Compose (Recommended for Development)

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f kcapp-venue-screen

# Stop
docker-compose down
```

The app will be available at `http://localhost:3000`

### Using Docker CLI

```bash
# Build the image
docker build -t kcapp-venue-screen:latest .

# Run the container
docker run -d \
  --name kcapp-venue-screen \
  -p 3000:3000 \
  kcapp-venue-screen:latest

# View logs
docker logs -f kcapp-venue-screen

# Stop the container
docker stop kcapp-venue-screen
docker rm kcapp-venue-screen
```

## Environment Variables

These variables control the app's runtime behavior:

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_KCAPP_API_BASE` | `http://localhost:3000/api` | Base URL for API calls (relative to the app host) |
| `VITE_KCAPP_SOCKET_URL` | `https://darts.sanden.cloud` | kcapp Socket.IO base URL |
| `VITE_KCAPP_VENUE_LIST_URL` | `http://localhost:3000/api/venues` | Venue list endpoint |
| `VITE_KCAPP_BASIC_AUTH_USERNAME` | `emre` | Username for basic auth (optional) |
| `VITE_KCAPP_BASIC_AUTH_PASSWORD` | (empty) | Password for basic auth (optional) |

### Custom Environment File

Create a `.env.docker` file:

```env
VITE_KCAPP_API_BASE=http://192.168.1.100:3000/api
VITE_KCAPP_SOCKET_URL=https://darts.example.com
VITE_KCAPP_VENUE_LIST_URL=http://192.168.1.100:3000/api/venues
VITE_KCAPP_BASIC_AUTH_USERNAME=user123
VITE_KCAPP_BASIC_AUTH_PASSWORD=secret_pass
```

Then load it:

```bash
docker-compose --env-file .env.docker up -d
```

## Networking

The app serves static files from the Node.js `serve` package. API requests are made directly from the browser to the kcapp backend or through your own reverse proxy/nginx setup outside of Docker.

## Production Deployment

### Building for Production

```bash
# Build with a production tag
docker build -t myregistry/kcapp-venue-screen:1.0.0 .

# Push to registry
docker push myregistry/kcapp-venue-screen:1.0.0
```

### Running Behind a Reverse Proxy

If you have an existing nginx/traefik/HAProxy instance to handle:
- SSL/TLS termination
- API proxying  
- Load balancing

Run the container on localhost only:

```bash
docker run -d \
  --name kcapp-venue-screen \
  --network my-network \
  myregistry/kcapp-venue-screen:1.0.0
```

Configure your reverse proxy to forward requests to `http://kcapp-venue-screen:3000`.

### Docker Compose for Production

Example `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  kcapp-venue-screen:
    image: myregistry/kcapp-venue-screen:1.0.0
    restart: always
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000', (res) => {if (res.statusCode !== 200) throw new Error(res.statusCode)})"]
      interval: 30s
      timeout: 3s
      retries: 3

networks:
  app-network:
    driver: bridge
```

Run with:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Health Checks

The container includes a built-in health check that verifies the app is running on port 3000. Docker will mark the container as unhealthy if it fails.

Monitor health:

```bash
docker ps
# Look for "healthy" status in the output
```

### Volume Mounts (if needed)

For logging or config persistence:

```bash
docker run -d \
  --name kcapp-venue-screen \
  -p 3000:80 \
  -v /var/log/kcapp-venue-screen:/var/log/nginx \
  kcapp-venue-screen:latest
```

## Troubleshooting

### Container exits immediately

Check logs:

```bash
docker logs kcapp-venue-screen
```

Common issues:
- Build failure → check `docker build` output
- `serve` package not found → rebuild the image
- Port already in use → use a different port: `-p 3001:3000`

### App not accessible

Verify the container is running and listening:

```bash
docker ps
docker logs kcapp-venue-screen

# Check if port 3000 is listening
netstat -an | grep 3000
# or on macOS:
lsof -i :3000
```

### Slow performance

- Check container resource limits: `docker stats`
- Increase available CPU/RAM if needed: `docker run --cpus 2 --memory 512m`
- Monitor network speed between browser and backend

## Image Size

The Node.js-based image is clean and minimal:
- Builder: Node.js Alpine + npm dependencies
- Final image: ~300-350MB (depends on node_modules)

The `node_modules` directory is kept to run `serve` in production.

## Security Considerations

1. **Credentials**: Store basic auth credentials in environment variables, not in code
2. **SSL/TLS**: Use a reverse proxy with SSL termination in production
3. **Headers**: The nginx config includes security headers (configure as needed)
4. **Updates**: Regularly rebuild images to include latest base image patches

## Related Files

- `Dockerfile` - Single-stage Node.js Docker build
- `docker-compose.yml` - Local development setup
- `.dockerignore` - Files excluded from Docker build context
