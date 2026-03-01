# PlaySight AI

**AI-powered sports intelligence: turn game footage into highlights, heatmaps, and coaching insights — from a smartphone.**

---

## One-line pitch

Youth and amateur athletes get professional-style performance analytics, tactical insights, and automated highlight reels without expensive hardware or manual editing. Upload video → AI processes → actionable insights.

---

## Quick start

```bash
npm run deploy
npm run health
```

Then open **http://localhost** — upload a video, get routed to analysis, and see results when processing completes. Try **http://localhost/analysis/demo** for instant demo results without uploading.

---

## Product (MVP)

- **Upload:** Drag-and-drop or file picker → "Upload & Analyze" → video is stored and queued for analysis.
- **Analysis:** Progress view (Queued → Processing → Done) with polling; then a results dashboard.
- **Results:** Highlights (key moments with timestamps), heatmap placeholder, coaching insights (placeholder), and download/share CTAs (coming next).
- **Demo mode:** `/analysis/demo` shows a seeded result for demos without waiting on processing.

---

## Stack

- **Frontend:** React (Vite), React Router; upload + analysis + results flow.
- **API:** Fastify (Node), Postgres (Drizzle), Redis (BullMQ), S3-compatible storage (MinIO in dev).
- **Worker:** Vision pipeline stub (consumes queue, marks jobs complete with sample key moments); full CV pipeline next.
- **Deploy:** Docker Compose (API, worker, web, Postgres, Redis, MinIO). CI: GitHub Actions (lint + build).

---

## Venture-ready

- **Production Docker:** Multi-stage Dockerfiles for API, worker, and web; Compose for full stack.
- **CI/CD:** GitHub Actions on push/PR to `main` (lint + build all workspaces).
- **Config:** `.env.example` at repo root; [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for prerequisites and production.
- **Docs:** [MVP scope](docs/MVP_SCOPE.md), [architecture](docs/ARCHITECTURE.md), [roadmap](docs/ROADMAP.md), [security](docs/SECURITY.md).

---

## Deploy

**Local (Docker):**
```bash
cp .env.example .env   # optional: adjust for your environment
npm run deploy
npm run health
```

**To the web (PlaySight AI live):**  
See **[docs/DEPLOY_WEB.md](docs/DEPLOY_WEB.md)** for step-by-step deployment. Use the **[render.yaml](render.yaml)** blueprint on Render for one-click API + worker + Postgres + Redis; then add the static site and set `VITE_API_URL`. Alternatives: Railway or a VPS with Docker.

- **Web:** http://localhost  
- **API:** http://localhost:3000 (health: http://localhost:3000/health)  
- **MinIO console:** http://localhost:9001 (bucket `playsight` is created by API if missing)

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed steps and production.

---

## Local development

```bash
npm install
cp .env.example .env
docker compose -f docker-compose.dev.yml up -d
npm run db:migrate -w @playsight/ingest
npm run dev:ingest
```

In another terminal: `npm run dev:web` (frontend with hot reload). Set `VITE_API_URL=http://localhost:3000` if the web app talks to the local API.

---

## Vision & roadmap

- **Problem:** Current tools (Veo, Hudl) are expensive, team-focused, and hardware-heavy; parents and players are underserved.
- **Solution:** Mobile-first platform: upload → AI tracking & events → highlights, heatmaps, mistake detection, coaching feedback.
- **Business:** B2C subscription ($15–30/mo), B2B club plans, recruiting add-on. See [docs/ROADMAP.md](docs/ROADMAP.md).

---

## License

MIT — see [LICENSE](LICENSE).
