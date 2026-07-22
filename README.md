# od_frontend

Front-end source code for OpenDissertation.com.

OpenDissertation is a Next.js JavaScript application that provides a guided chat interface for downloading supported PhD dissertations, creating a backend vector-store session, and asking follow-up questions about the loaded material.

## Quick Start

### Prerequisites

- Node.js 24 or newer.
- npm 10 or newer.
- Docker and Docker Compose, if you want to run the app in containers.
- A running OpenDissertation backend, or a local checkout of [`OpenDissertation/od_backend`](https://github.com/OpenDissertation/od_backend) at `./od_backend` when using the included Compose file.
- An `OPENAI_API_KEY` configured for the backend.

### Install locally

```bash
npm install
```

### Run locally in development mode

```bash
BACKEND_API_BASE_URL=http://localhost:8000 npm run dev
```

Then open <http://localhost:3000>. Set `PORT` to expose a different frontend port, for example `PORT=4000 BACKEND_API_BASE_URL=http://localhost:8000 npm run dev`. The frontend proxies browser requests through its own `/api/v1/*` routes, so the backend must be available to the frontend server at the URL configured in `BACKEND_API_BASE_URL`.

### Run locally with Docker Compose

Clone the backend repo inside this frontend repo before using Compose:

```bash
git clone https://github.com/OpenDissertation/od_backend.git od_backend
PORT=3000 OPENAI_API_KEY=your-key docker compose up --build
```

The frontend is exposed at <http://localhost:3000> by default. Change `PORT` to publish a different frontend port, and keep the backend at <http://localhost:8000>.

### Build and run the production bundle locally

```bash
npm run build
npm start
```

If you run the production bundle locally, set `BACKEND_API_BASE_URL` at runtime so the Next.js proxy can reach the backend service.

## Production deployment

The app is configured for a standalone Next.js output, so it can be deployed as a Node.js service or as a container image.

### Container deployment

Build and run the frontend image:

```bash
docker build -t opendissertation-frontend .
docker run -p 3000:3000 \
  -e PORT=3000 \
  -e BACKEND_API_BASE_URL=https://api.example.com \
  opendissertation-frontend
```

Deploy the backend separately and provide it with required secrets such as `OPENAI_API_KEY`. For managed platforms such as Cloud Run, set `BACKEND_API_BASE_URL` on the frontend service at runtime and set `PORT` to the platform-provided port when required. Browser API calls stay same-origin by going through the frontend proxy, so the backend URL is not baked into the client bundle.

### Platform deployment

You can also deploy to any platform that supports Next.js, such as Vercel, Render, Fly.io, or AWS. Configure these environment variables in the platform dashboard:

- `BACKEND_API_BASE_URL`: URL of the OpenDissertation backend, read by the frontend server at runtime. `NEXT_PUBLIC_API_BASE_URL` is still accepted as a fallback for existing deployments.
- `PORT`: frontend HTTP port; defaults to `3000`.
- Backend-only secrets, such as `OPENAI_API_KEY`, should be configured on the backend service only, not in this frontend app.

## Design choices

- **JavaScript-first implementation:** the repo uses plain `.jsx` files to keep the frontend approachable and match the requested JavaScript implementation.
- **Next.js App Router:** the application uses the `app/` directory for a modern, compact Next.js structure.
- **Client-side chat state machine:** the page manages the dissertation selection, download, session initialization, Q&A, follow-up confirmation, and session termination flow in one visible component.
- **Markdown rendering:** backend answers are rendered with `react-markdown` so ChatGPT-style responses display lists, emphasis, and links cleanly.
- **Runtime backend proxy:** browser requests use same-origin `/api/v1/*` routes, and the frontend server forwards them to `BACKEND_API_BASE_URL` so container runtime environment variables work on Cloud Run.
- **Standalone container output:** `next.config.js` enables a small production image that runs with `node server.js`.
- **Space-themed responsive UI:** CSS creates the requested outer-space visual style, asteroid-like chat bubbles, and mobile-friendly layout without requiring image-heavy assets.

## Repository file guide

- `.github/workflows/ci.yml` — GitHub Actions workflow that installs dependencies, checks formatting, lints, and builds the app.
- `.gitignore` — ignores local dependencies, build outputs, environment files, and other generated artifacts.
- `Dockerfile` — multi-stage Docker build for the standalone production Next.js server.
- `LICENSE` — repository license.
- `README.md` — project overview, local setup, deployment, design notes, file guide, and contribution guidance.
- `app/globals.css` — global styles for the space-themed responsive chat UI.
- `app/layout.jsx` — root Next.js layout and site metadata.
- `app/page.jsx` — main OpenDissertation chat interface and same-origin frontend API integration.
- `app/api/v1/[...path]/route.js` — server-side proxy that forwards frontend API requests to the configured backend URL.
- `docker-compose.yml` — local orchestration for frontend plus a mounted backend checkout.
- `eslint.config.mjs` — ESLint flat configuration using Next.js core web vitals rules.
- `next.config.js` — Next.js configuration, including standalone output and backend URL exposure.
- `package.json` — npm scripts and frontend dependencies.
- `public/opendissertation-logo.svg` — SVG logo displayed in the chat header.

## Contributing

1. Create a feature branch from the latest main branch.
2. Install dependencies with `npm install`.
3. Make focused changes and keep the UI responsive across desktop and mobile widths.
4. Run checks before opening a pull request:

   ```bash
   npm run format:check
   npm run lint
   npm run build
   ```

5. If formatting fails, run `npm run prettier-format` and re-run the checks.
6. Include a clear pull request description that explains the change, any user-facing behavior, and the commands you ran to validate it.
