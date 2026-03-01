# MVP Scope — PlaySight AI

A focused first release to validate the core value proposition: **upload game footage → get automated highlights + basic analytics.**

---

## MVP North Star

**One athlete (or parent) uploads a full-game video from their phone and receives:**

1. An automated highlight reel (goals, shots, key moments)
2. A simple heatmap of their on-field movement
3. A short list of “key moments” with timestamps and one-line labels

No account required for the first prototype; we can add auth and persistence in v0.2.

---

## In Scope (MVP)

| Area | What we build |
|------|----------------|
| **Upload** | Mobile or web: select video file → upload to backend (presigned URL or direct multipart). Store in object storage (e.g. S3/GCS). |
| **Processing pipeline** | Job queue (e.g. BullMQ, Celery, or serverless): one job per video. Steps: extract frames → run detection/tracking → run event detection → generate clips + heatmap. |
| **Vision** | Player + ball detection and tracking (off-the-shelf model or API to start: e.g. YOLO + ByteTrack, or cloud vision API). Output: tracks over time (bounding boxes + IDs). |
| **Events** | Simple rule-based or small model: detect “shot”, “goal”, “key pass”, “recovery” from tracks + ball position. Emit events with timestamps. |
| **Highlights** | Cut segments around event timestamps (e.g. ±10s), concatenate into one “highlight reel” video. No fancy transitions for MVP. |
| **Heatmap** | From player track positions (pitch-normalized), generate a 2D heatmap image. Single player or “focus player” selection for MVP. |
| **Output** | User gets: (1) link to highlight video, (2) heatmap image, (3) JSON/list of key moments with time and label. Delivered via simple web UI or in-app view. |

---

## Out of Scope (MVP)

- Mistake detection (“you drifted too narrow at 63'”)
- Position-specific tactical templates and comparisons
- Performance scorecard and longitudinal tracking
- Multi-player comparison or team views
- Recruiting profiles and verified analytics
- Payments, subscriptions, teams, clubs
- Real-time or live streaming processing

These remain on the roadmap for post-MVP.

---

## Success Criteria

- End-to-end: upload → processed results in &lt; 30 minutes for a 90-minute game (acceptable for MVP).
- Highlight reel contains recognizable “key moments” with no/few false positives.
- Heatmap clearly reflects where the tracked player moved.

---

## Suggested Tech (MVP)

- **Frontend:** React (web) and/or React Native / Expo (mobile) for upload + results view.
- **Backend:** Node (Fastify/Express) or Python (FastAPI) for API + job enqueue.
- **Queue / Workers:** Redis + BullMQ (Node) or Redis + Celery (Python). Worker runs vision + analytics.
- **Storage:** S3 or GCS for raw video and generated assets (highlights, heatmap images).
- **Vision:** Start with existing models (e.g. YOLOv8 + ByteTrack, or Ultralytics) or a single cloud API to avoid training from scratch.
- **Video cutting:** ffmpeg in the worker (segment by timestamps, concat).

---

## Phasing (High Level)

1. **Phase 1 — Pipeline:** Upload → store → queue → frame extraction → detection/tracking → event list. No UI for results yet; inspect via API or DB.
2. **Phase 2 — Outputs:** Generate highlight reel + heatmap from pipeline output; store URLs.
3. **Phase 3 — UI:** Simple web (or mobile) flow: upload → wait → view highlights, heatmap, and key moments list.
4. **Phase 4 — Polish:** Error handling, retries, basic progress indicator, optional email/link when done.

After MVP we layer in mistake detection, scorecards, and tactical templates.
