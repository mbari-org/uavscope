# Docker Production Setup

This directory contains the Docker configuration for running the UAVScope application in production.

## Files

- `Dockerfile` - Multi-stage production build using Node.js and Nginx
- `docker-compose.yml` - Docker Compose configuration with shared network
- `.dockerignore` - Files to exclude from Docker build context

## Prerequisites

1. Docker and Docker Compose installed
2. The `tator_private` network must exist (created by a valid Tator build)

## Usage

### Build and Run

```bash
# From the project root directory
cd docker
docker-compose up --build -d
```

### Access the Application

- **Direct access**: http://localhost:3000

### Health Check

The application includes a health check endpoint:
- http://localhost:3000/health

### Stop the Application

```bash
docker-compose down
```

### View Logs

```bash
docker-compose logs -f uavscope
```

## Network Configuration

The application connects to a single network: **tator_private** (external) - Shared network for communication with other services

## Environment Variables

### Required Environment Variables

The application requires several environment variables for TATOR API configuration. Create a `.env` file in the docker directory with the following variables:

```bash
# TATOR API Configuration
VITE_TATOR_HOST=https://your-tator-host.com
VITE_TATOR_TOKEN=your-tator-token-here
VITE_BOX_TYPE=3
VITE_PROJECT_ID=4
VITE_API_TIMEOUT=3000
VITE_MAX_RETRIES=3
```
### Other Environment Variables

- `NODE_ENV=production` (default, set automatically in container)


## Build with environment variables

   ```bash
   # The docker-compose.yml will automatically read from .env file
   docker-compose up --build -d
   ```