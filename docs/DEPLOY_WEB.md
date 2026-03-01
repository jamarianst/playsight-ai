# Deploy PlaySight AI to the web

Get **PlaySight AI** live at a public URL (e.g. **playsight.ai** or your Render/Railway URL).

---

## Option 1: Render (recommended)

[Render](https://render.com) offers a free tier and supports Docker, Postgres, and Redis.

### One-click with Blueprint

1. Push your code to GitHub (see step 1 below).
2. **Render Dashboard → New → Blueprint** → connect the repo and select **render.yaml**.
3. Render creates Postgres, Redis, API (web), and worker. Add env vars for storage (S3 or leave default).
4. Create the **Static Site** manually (New → Static Site): build `npm ci && npm run build -w @playsight/web`, publish `apps/web/dist`, set **VITE_API_URL** to your API URL.
5. Optional: add a custom domain to the static site and CORS for the API (see sections 7–8 below).

### Manual setup (step-by-step)

### 1. Push your code to GitHub

```bash
git init
git add .
git commit -m "PlaySight AI — initial release"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/playsight-ai.git
git push -u origin main
```

### 2. Create a Render account and connect the repo

1. Go to [render.com](https://render.com) and sign up.
2. **New → Blueprint** and connect your GitHub repo, or create each service manually as below.

### 3. Create Postgres and Redis

- **Dashboard → New → PostgreSQL.** Create a database; note the **Internal Database URL**.
- **Dashboard → New → Redis.** Create a Redis instance; note the **Internal Redis URL**.

### 4. Deploy the API

- **New → Web Service.**
- Connect the same GitHub repo.
- **Build:** Docker; **Dockerfile path:** `docker/api.Dockerfile`.
- **Root directory:** leave blank (repo root).
- **Environment:**
  - `NODE_ENV` = `production`
  - `PORT` = `3000`
  - `DATABASE_URL` = *(paste Internal Database URL from Postgres)*
  - `REDIS_URL` = *(paste Internal Redis URL from Redis)*
  - For S3: use **Render Disk** or an S3 bucket. For MVP you can use a **Render Disk** mounted at `/data` and configure the API to use local file storage, or add **AWS S3** (or Backblaze B2) env vars: `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_REGION`. Leave `S3_ENDPOINT` empty for AWS.
- **Save.** Note the API URL (e.g. `https://playsight-api.onrender.com`).

### 5. Deploy the worker

- **New → Background Worker.**
- Same repo.
- **Build:** Docker; **Dockerfile path:** `docker/worker.Dockerfile`.
- **Environment:** Same as API (`DATABASE_URL`, `REDIS_URL`, and S3 vars if used).
- **Save.**

### 6. Deploy the web app (frontend)

- **New → Static Site.**
- Same repo.
- **Build command:** `npm ci && npm run build -w @playsight/web`
- **Publish directory:** `apps/web/dist`
- **Environment:** Add variable `VITE_API_URL` = your API URL (e.g. `https://playsight-api.onrender.com`) — **no trailing slash**.
- **Save.** Note the static site URL (e.g. `https://playsight-ai.onrender.com`).

### 7. Custom domain (optional)

- On the **Static Site** service → **Settings → Custom Domain** → add **playsight.ai** (or your domain) and follow the DNS instructions.
- For the **API**, add a custom domain (e.g. `api.playsight.ai`) and set CORS on the API to allow your frontend origin.

### 8. CORS

The API uses `cors({ origin: true })` which allows any origin. For production you may want to restrict: set `origin: ['https://playsight.ai', 'https://playsight-ai.onrender.com']` in the API code or via an env var.

---

## Option 2: Railway

1. Go to [railway.app](https://railway.app) and create a project.
2. **New → Database → PostgreSQL**, then **New → Database → Redis**.
3. **New → GitHub Repo** and select your repo.
4. Add **api** (Dockerfile `docker/api.Dockerfile`), **worker** (Dockerfile `docker/worker.Dockerfile`), and **web** (static: build `npm run build -w @playsight/web`, root `apps/web/dist`). Or deploy with **Docker Compose** if Railway supports it.
5. Set env vars for API and worker from the Postgres and Redis service URLs.
6. Set `VITE_API_URL` for the web build to your Railway API URL.

---

## Option 3: VPS (DigitalOcean, Fly.io, etc.) with Docker

On a VPS with Docker and Docker Compose installed:

```bash
git clone https://github.com/YOUR_USERNAME/playsight-ai.git
cd playsight-ai
cp .env.example .env
# Edit .env: set DATABASE_URL, REDIS_URL, and S3 or MinIO vars for production
docker compose up -d --build
```

- Point your domain’s **A record** to the VPS IP.
- Put a reverse proxy (e.g. **Caddy** or **nginx**) in front: HTTPS and route `/` to the web container (port 80) and `/api` to the API (port 3000) if you want a single domain. Or expose port 80 (web) and 3000 (API) and use two subdomains (e.g. **playsight.ai** → web, **api.playsight.ai** → API). Then set **VITE_API_URL** when building the web image to `https://api.playsight.ai`.

---

## Build the web app with the production API URL

The frontend is built with `VITE_API_URL` baked in. So:

- **Docker:** Build the web image with `--build-arg VITE_API_URL=https://your-api-url.com`.
- **Render Static Site:** Set **Environment** `VITE_API_URL` to your API URL before the first build.
- **VPS:** When building locally for production: `VITE_API_URL=https://api.playsight.ai npm run build -w @playsight/web`, then serve `apps/web/dist` or build the web Docker image with that arg.

---

## After deploy

- Open your **web URL** (e.g. https://playsight.ai or https://playsight-ai.onrender.com).
- Upload a video or open **/analysis/demo**.
- Check **API URL/health** (e.g. https://your-api.onrender.com/health) for status.

You’re live as **PlaySight AI**.
