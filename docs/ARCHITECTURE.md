# Architecture — PlaySight AI

High-level system design for the MVP and a path to the full vision.

---

## Overview

```
┌─────────────┐     ┌─────────────┐     ┌──────────────────────────────────────────┐
│   Mobile /  │────▶│   Ingest    │────▶│  Object Storage (raw video + outputs)     │
│   Web App   │     │   API       │     └──────────────────────────────────────────┘
└─────────────┘     └──────┬──────┘                          │
       │                    │                                 │
       │                    ▼                                 │
       │             ┌─────────────┐                          │
       │             │  Job Queue  │                          │
       │             │  (Redis)    │                          │
       │             └──────┬──────┘                          │
       │                    │                                 │
       │                    ▼                                 │
       │             ┌─────────────┐     ┌─────────────┐      │
       │             │  Vision     │────▶│ Analytics   │──────┘
       │             │  Worker     │     │ + Highlights│
       │             └─────────────┘     └─────────────┘
       │                    │                    │
       │                    └────────────────────┘
       │                             │
       └─────────────────────────────┴────────────▶ Results API / UI
```

---

## Components

### 1. Clients

- **Web:** Dashboard for upload, job status, viewing highlights + heatmap + key moments.
- **Mobile (later):** Record or pick from library → upload → same results view. Mobile-first long term.

### 2. Ingest API

- **Auth (post-MVP):** Optional; MVP can be unauthenticated or single API key.
- **Upload:** Presigned URL or multipart upload to object storage. Register “video asset” in DB with status `pending`.
- **Jobs:** Create a processing job linked to the asset; push to queue. Return `jobId` for polling.

### 3. Object Storage

- **Raw:** Incoming video files (key e.g. `videos/{id}/raw.{ext}`).
- **Outputs:** Highlight reel, heatmap image, optional JSON of events (key e.g. `videos/{id}/highlights.mp4`, `heatmap.png`, `events.json`).

### 4. Job Queue

- **Broker:** Redis.
- **Producer:** Ingest API enqueues one job per video.
- **Consumer:** Worker(s) run the pipeline. Idempotent job handling; retries with backoff on failure.

### 5. Vision Worker

- **Input:** Video URL or path (from storage).
- **Steps:**
  1. Download or stream video; extract frames at fixed FPS (e.g. 2–5 fps for balance of cost and accuracy).
  2. Run **detection:** players + ball (e.g. YOLOv8 or similar).
  3. Run **tracking:** assign stable IDs across frames (e.g. ByteTrack).
  4. Output: **tracks** (per-frame bounding boxes + IDs) and ball position over time.
- **Output:** Write tracks to DB or intermediate storage for analytics.

### 6. Analytics + Highlights Worker

- **Input:** Tracks + ball position + video.
- **Events:** Rule-based or small model → list of events (shot, goal, key pass, recovery) with timestamps.
- **Highlights:** Use ffmpeg to cut segments around events, concatenate into one clip; upload to storage.
- **Heatmap:** From track positions (pitch-normalized), render 2D heatmap; upload image to storage.
- **Metadata:** Write event list (and asset URLs) to DB; mark job complete.

### 7. Results API

- **Get job status:** `pending | processing | completed | failed`.
- **Get results:** When `completed`, return URLs for highlight video, heatmap, and list of key moments (time + label).

### 8. Data Model (MVP)

- **Asset:** `id`, `createdAt`, `storageKey`, `status`, `duration`, `sport` (e.g. soccer).
- **Job:** `id`, `assetId`, `status`, `createdAt`, `updatedAt`, `result` (JSON: highlight URL, heatmap URL, events[]).
- **Events (optional table or in result JSON):** `jobId`, `timestamp`, `type`, `label`, `metadata`.

---

## Scale and Cost (MVP)

- **Single worker** is enough; queue serializes work.
- **Vision:** Run on CPU or a single GPU instance; or use a serverless GPU (Lambda with container / RunPod) if preferred.
- **Storage:** Lifecycle policies to archive or delete raw video after N days to control cost; keep highlights and heatmaps longer.

---

## Security and Privacy

- **Upload:** Validate file type and size; virus scan optional for later.
- **Storage:** Private buckets; signed URLs for download with expiry.
- **Auth (post-MVP):** JWT or session; scope assets and jobs to user/org.

---

## Roadmap Alignment

| Full vision feature        | Architecture extension |
|---------------------------|------------------------|
| Mistake detection         | New analytics module consuming tracks + events; LLM or rule engine for natural-language feedback |
| Position templates         | Store “ideal” heatmaps per position; compare user heatmap to template |
| Scorecard & progression   | New service: aggregate events + heatmaps per player over time; store in DB |
| Multi-sport               | Sport-specific detection models and event definitions; config per sport |
| Recruiting / verified     | New service + public profile pages; verification via signed assertions from platform |

This doc can be updated as we add services (e.g. `mistake-detection`, `scorecard`, `recruiting`).
