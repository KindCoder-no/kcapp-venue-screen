# Docker Deployment Guide

This document describes how to deploy kcapp-venue-screen using the published container image:

- `emresanden/kcapp-venue-screen`

## Prerequisites

- Docker 20+
- Docker Compose v2+ (optional)

## Quick Start

### Docker Run

```bash
docker pull emresanden/kcapp-venue-screen:latest

docker run -d \
  --name kcapp-venue-screen \
  -p 3000:3000 \
  --restart unless-stopped \
  emresanden/kcapp-venue-screen:latest
```

Open `http://localhost:3000`.

### Docker Compose

Use this as your deployment compose file:

```yaml
version: '3.8'

services:
  kcapp-venue-screen:
    image: emresanden/kcapp-venue-screen:latest
    container_name: kcapp-venue-screen
    ports:
      - "3000:3000"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000', (res) => { if (res.statusCode !== 200) throw new Error(res.statusCode) })"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 10s
```

Start and manage:

```bash
docker compose up -d
docker compose logs -f kcapp-venue-screen
docker compose pull
docker compose up -d
```

## Version Pinning

For stable deployments, pin a version tag instead of `latest`:

```yaml
image: emresanden/kcapp-venue-screen:1.0.0
```

## Production Deployment

### Behind Reverse Proxy

If you already use nginx, Traefik, or HAProxy outside Docker, forward traffic to:

- `http://kcapp-venue-screen:3000` (same Docker network)
- or `http://host-ip:3000` (host-level mapping)

Typical responsibilities of your reverse proxy:

- TLS termination
- domain routing
- optional API proxy rules

### Updating to New Image

```bash
docker compose pull
docker compose up -d
docker image prune -f
```

## Configuration Notes

This image serves the built frontend on port `3000`.

Vite environment variables are build-time values. If you need different backend URLs per environment, publish environment-specific image tags or deploy behind a reverse proxy that provides stable public endpoints.

## Troubleshooting

### Container Not Starting

```bash
docker ps -a
docker logs kcapp-venue-screen
```

### Port Already In Use

Change host port mapping:

```yaml
ports:
  - "3001:3000"
```

Then access `http://localhost:3001`.

### Healthcheck Shows Unhealthy

Check logs and connectivity:

```bash
docker logs kcapp-venue-screen
docker exec -it kcapp-venue-screen node -e "require('http').get('http://localhost:3000', r => console.log(r.statusCode))"
```

## Related Files

- `docker-compose.yml` (local/example compose setup)
- `Dockerfile` (image build source)
