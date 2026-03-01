# Deployment

## Quick start (recommended)

1. **Install Docker Desktop**  
   [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)

2. **Deploy the stack**
   ```bash
   npm run deploy
   ```
   This runs `docker compose up -d --build` (API, worker, web, Postgres, Redis, MinIO).

3. **Verify**
   ```bash
   npm run health
   ```
   Expect: JSON with `"status":"ok","db":"ok","redis":"ok"` and a final `OK` line.

4. **Open the app**  
   Web UI: [http://localhost](http://localhost)  
   API: [http://localhost:3000](http://localhost:3000) (e.g. [http://localhost:3000/health](http://localhost:3000/health))

**Product flow:** Upload a video on the web app → you’re routed to `/analysis/:assetId` → progress (Queued → Processing → Done) → results dashboard (highlights, heatmap placeholder, coaching insights). Use **/analysis/demo** for instant demo results without uploading.

---

## Test the worker queue

- **Enqueue a test job:**  
  `curl -X POST http://localhost:3000/test/enqueue`  
  Response includes `assetId` and `jobId`. The worker consumes the job and logs `Job completed: <id>`.

- **Check job status:**  
  `GET http://localhost:3000/jobs/<jobId>`

---

## Prerequisites

- **Docker** (Docker Desktop or engine + Compose)
- **Node 20** for local development and builds

## Local development (without full Compose)

- Run only infra:  
  `docker compose -f docker-compose.dev.yml up -d`  
  Then: `npm install`, copy `.env.example` to `.env`,  
  `npm run db:migrate -w @playsight/ingest`, `npm run dev:ingest`.

## Environment variables

| Variable | Description |
|----------|-------------|
| `PORT` | API port (default `3000`) |
| `DATABASE_URL` | Postgres connection string |
| `REDIS_URL` | Redis connection string |
| `S3_ENDPOINT` | Optional (e.g. MinIO at `http://minio:9000`) |
| `S3_REGION` | Default `us-east-1` |
| `S3_BUCKET` | Default `playsight` |
| `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | For S3/MinIO |
| `S3_USE_SSL` | `true` or `false` |

See `.env.example` for the full list.

## Production

1. Build and run with your own Postgres, Redis, and S3 (or compatible storage).
2. Put the API behind a reverse proxy and TLS.
3. Use `docker compose build --no-cache api worker web` and your chosen orchestrator.
