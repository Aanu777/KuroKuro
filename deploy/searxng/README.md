---
title: KUROKURO Search Backend
emoji: 🔎
colorFrom: gray
colorTo: purple
sdk: docker
app_port: 7860
---

# KUROKURO protected SearXNG backend

This container runs the existing SearXNG search engine behind an authenticated HTTP proxy.

## Hosting target

The image is designed for a small public Docker host such as [blitz.cloud](https://blitz.cloud/), which currently offers a no-card free tier. Free apps sleep after 30 minutes without browser visits, so the first request after idle may need a wake-up/retry. See [free Docker hosting requirements](https://blitz.cloud/docs/deploy-docker-image/).

## Secrets to set in the hosting dashboard

Set both as **secrets**, never as public variables:

- `KUROKURO_API_TOKEN`: at least 48 hexadecimal characters.
- `SEARXNG_SECRET`: a separate random secret for SearXNG.

Example token generation in PowerShell (run locally; do not commit the result):

```powershell
$bytes = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
$KUROKURO_API_TOKEN = -join ($bytes | ForEach-Object { $_.ToString("x2") })
$KUROKURO_API_TOKEN
```

Generate the SearXNG secret separately:

```powershell
$bytes = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
$SEARXNG_SECRET = -join ($bytes | ForEach-Object { $_.ToString("x2") })
$SEARXNG_SECRET
```

## Security behavior

- Only port 7860 is intended to be exposed.
- The public `/healthz` endpoint returns a simple status and does not run a search.
- All other requests require `X-Kurokuro-Token`.
- Requests are rate-limited by nginx.
- SearXNG's internal HTTP service is not the exposed container port.
- SearXNG image proxying is disabled so the public endpoint cannot be used as an unauthenticated arbitrary-image proxy. Search result thumbnails may load directly from their source websites.

## Build and publish

The GitHub Actions workflow builds an amd64 image and publishes it to GitHub Container Registry (GHCR) using the repository's built-in `GITHUB_TOKEN`. After the first successful run, open the package settings and change its visibility to **Public** so the free host can pull it. Do not put either runtime secret in GitHub or the image.
