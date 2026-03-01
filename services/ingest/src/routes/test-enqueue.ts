import type { FastifyPluginAsync } from "fastify";
import { randomUUID } from "node:crypto";
import type { Db } from "../db/index.js";
import { assets, jobs } from "../db/schema.js";
import { enqueueProcess, type ProcessQueue } from "../queue.js";

interface TestEnqueueDeps {
  db: Db;
  processQueue: ProcessQueue;
}

const testEnqueuePlugin: FastifyPluginAsync<TestEnqueueDeps> = async (app, opts) => {
  const { db, processQueue } = opts;

  app.post("/test/enqueue", async (_request, reply) => {
    const assetId = randomUUID();
    const storageKey = `videos/${assetId}/raw.mp4`;

    await db.insert(assets).values({
      id: assetId,
      storageKey,
      status: "pending",
    });

    const [job] = await db
      .insert(jobs)
      .values({ assetId, status: "pending" })
      .returning({ id: jobs.id });
    const jobId = job?.id;
    if (!jobId) {
      return reply.status(500).send({ error: "Failed to create job" });
    }

    await enqueueProcess(processQueue, assetId);

    return reply.send({ assetId, jobId, message: "Job enqueued; worker will process it." });
  });
};

export default testEnqueuePlugin;
