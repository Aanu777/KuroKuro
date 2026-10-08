# Kurokuro SearXNG backend

This folder is the search infrastructure for Kurokuro.

## Start

From this folder:

```bash
docker compose up -d
```

SearXNG should then be available at `http://localhost:8080`.

Before exposing this publicly, replace the secret key and review the SearXNG settings, enabled engines, rate limits, reverse proxy, and HTTPS configuration.
