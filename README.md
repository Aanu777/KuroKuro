# KUROKURO

Search the web without the noise.

KUROKURO is an independent search interface built with Next.js, TypeScript, and SearXNG. It brings web, image, video, and news results into one focused experience, with local-first history and bookmarks.

## What it does

- Search the web, images, videos, and news
- Refine searches with pagination, language, time range, and SafeSearch options where supported
- Suggest queries and rank/clean aggregated results
- Use search operators such as `site:`, `filetype:`, quoted phrases, and excluded terms
- Keep search history and bookmarks in the browser by default
- Navigate with keyboard shortcuts and adjust basic preferences
- Install as a web app on supported mobile and desktop browsers (PWA)

## Run locally

**Requirements:** Node.js, npm, and Docker Desktop.

1. Clone the repository and enter the project folder.
2. Create your local environment file:

   ```bash
   cp .env.example .env.local
   ```

   On Windows PowerShell, use `Copy-Item .env.example .env.local`.

3. Start the local SearXNG service:

   ```bash
   cd searxng
   docker compose up -d
   cd ..
   ```

4. Install dependencies and start Next.js:

   ```bash
   npm install
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000).

The example environment points `SEARXNG_URL` to `http://localhost:8080`. Keep `.env.local` private; never commit real secrets.

## How it works

```text
Browser → KUROKURO (Next.js) → authenticated SearXNG proxy
        → SearXNG → enabled search engines
```

History and bookmarks are stored locally in the browser by default. Search queries are sent to the configured SearXNG backend, which forwards them to the external search engines enabled in its configuration. Local-first does not mean that search queries never leave your device.

## Backend image

The backend container is built and published to GitHub Container Registry:

`ghcr.io/aanu777/kurokuro-search-backend:latest`

- [Container package](https://github.com/users/Aanu777/packages/container/package/kurokuro-search-backend)
- [Backend Dockerfile](deploy/searxng/Dockerfile)
- [Backend proxy](deploy/searxng/proxy.py)
- [Build workflow](.github/workflows/publish-kurokuro-backend.yml)

The proxy listens on port `7860`. It exposes `/healthz` for health checks and requires the `X-Kurokuro-Token` header for other requests. It also applies a basic per-IP rate limit.

### Deploying the backend

The image build is automated, but a successful build alone does **not** mean the backend has been deployed or runtime-tested. Choose a Docker host that supports the image and configure these server-side environment variables:

- `KUROKURO_API_TOKEN`: a random hexadecimal secret of at least 48 characters (64 is a good target).
- `SEARXNG_SECRET`: a separate strong random secret for SearXNG.
- `PORT`: set to `7860` if your host requires an explicit port.

Do not publish or commit these values. The backend URL should use HTTPS when exposed publicly.

For the Next.js frontend deployment, configure:

- `SEARXNG_URL`: the deployed backend's base HTTPS URL.
- `KUROKURO_BACKEND_TOKEN`: the same secret as `KUROKURO_API_TOKEN`.

`KUROKURO_BACKEND_TOKEN` must remain server-side. Do not prefix it with `NEXT_PUBLIC_` or expose it in browser code.

After deployment, verify that `GET /healthz` returns `200`, and that a request to `/search` without the token returns `401`. Then test a real search through the KUROKURO frontend.

## Install on mobile

When KUROKURO is deployed over HTTPS, supported browsers can install it as a Progressive Web App:

- **Android:** open it in Chrome and choose **Install app** or **Add to Home screen**.
- **iPhone:** open it in Safari, tap **Share**, then **Add to Home Screen**.

PWA installation is not the same as publishing a native app in an app store.

## Privacy notes

KUROKURO keeps history and bookmarks in browser storage by default. Your configured search backend and the external search engines it uses still receive the queries needed to return results. Review the SearXNG configuration and the privacy policies of enabled engines before using the service for sensitive searches.

## Project

Built independently by [Aanu777](https://github.com/Aanu777). Contributions, bug reports, and practical feedback are welcome.
