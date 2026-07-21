# od_frontend

Front-end source code for OpenDissertation.com.

OpenDissertation is a Next.js JavaScript application that provides a guided chat interface for downloading supported PhD dissertations, creating a backend vector-store session, and asking follow-up questions about the loaded material.

## Quick Start

### Prerequisites

- Node.js 22 or newer.
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
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000 npm run dev
```

Then open <http://localhost:3000>. The backend must be available at the URL configured in `NEXT_PUBLIC_API_BASE_URL`.

### Run locally with Docker Compose

Clone the backend beside this frontend before using Compose:

```bash
git clone https://github.com/OpenDissertation/od_backend.git od_backend
OPENAI_API_KEY=your-key docker compose up --build
```

The frontend is exposed at <http://localhost:3000>, and the backend is exposed at <http://localhost:8000>.

### Build and run the production bundle locally

```bash
npm run build
npm start
```

If you run the production bundle locally, set `NEXT_PUBLIC_API_BASE_URL` before building so the client points at the correct backend.

## Production deployment

The app is configured for a standalone Next.js output, so it can be deployed as a Node.js service or as a container image.

### Container deployment

Build and run the frontend image:

```bash
docker build -t opendissertation-frontend .
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_BASE_URL=https://api.example.com \
  opendissertation-frontend
```

Deploy the backend separately, configure CORS to allow the frontend origin, and provide the backend with required secrets such as `OPENAI_API_KEY`. For managed platforms, set `NEXT_PUBLIC_API_BASE_URL` at build time and expose port `3000` from the resulting container.

### Platform deployment

You can also deploy to any platform that supports Next.js, such as Vercel, Render, Fly.io, or AWS. Configure these environment variables in the platform dashboard:

- `NEXT_PUBLIC_API_BASE_URL`: public URL of the OpenDissertation backend.
- Backend-only secrets, such as `OPENAI_API_KEY`, should be configured on the backend service only, not in this frontend app.

## Design choices

- **JavaScript-first implementation:** the repo uses plain `.jsx` files to keep the frontend approachable and match the requested JavaScript implementation.
- **Next.js App Router:** the application uses the `app/` directory for a modern, compact Next.js structure.
- **Client-side chat state machine:** the page manages the dissertation selection, download, session initialization, Q&A, follow-up confirmation, and session termination flow in one visible component.
- **Markdown rendering:** backend answers are rendered with `react-markdown` so ChatGPT-style responses display lists, emphasis, and links cleanly.
- **Configurable backend URL:** `NEXT_PUBLIC_API_BASE_URL` lets local, staging, and production deployments point at different backend services.
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
- `app/page.jsx` — main OpenDissertation chat interface and backend API integration.
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
