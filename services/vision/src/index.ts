import { Worker } from "bullmq";
import { eq } from "drizzle-orm";
import { loadConfig } from "./config.js";
import { createDb } from "./db/index.js";
import { jobs } from "./db/schema.js";

const QUEUE_NAME = "playsight-process-video";

function parseRedisUrl(url: string): { host: string; port: number } {
  const u = new URL(url.replace("redis://", "http://"));
  return { host: u.hostname, port: parseInt(u.port || "6379", 10) };
}

async function main() {
  const config = loadConfig();
  const db = createDb(config.DATABASE_URL);
  const connection = parseRedisUrl(config.REDIS_URL);

  const worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      const { assetId } = job.data as { assetId: string };
      const [row] = await db.select().from(jobs).where(eq(jobs.assetId, assetId)).limit(1);
      if (!row) return;
      await db
        .update(jobs)
        .set({
          status: "completed",
          updatedAt: new Date(),
          result: {
            keyMoments: [
              { timestamp: 0, type: "other", label: "Processing complete (stub). Full vision pipeline coming next." },
            ],
          },
        })
        .where(eq(jobs.id, row.id));
    },
    { connection, concurrency: 1 }
  );

  worker.on("completed", (j) => console.log("Job completed:", j.id));
  worker.on("failed", (j, err) => console.error("Job failed:", j?.id, err));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
