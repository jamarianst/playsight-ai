import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Redis } from "ioredis";
import { loadConfig } from "./config.js";
import { createDb } from "./db/index.js";
import { createRedis, createProcessQueue } from "./queue.js";
import { createS3Client, ensureBucket } from "./storage.js";
import uploadPlugin from "./routes/upload.js";
import jobsPlugin from "./routes/jobs.js";
import assetsPlugin from "./routes/assets.js";
import testEnqueuePlugin from "./routes/test-enqueue.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  const config = loadConfig();
  const db = createDb(config.DATABASE_URL);
  await migrate(db, { migrationsFolder: join(__dirname, "db", "migrations") });
  const redisConnection = createRedis(config);
  const processQueue = createProcessQueue(redisConnection);
  const redisHealth = new Redis(config.REDIS_URL, { maxRetriesPerRequest: null });
  const s3 = createS3Client(config);
  await ensureBucket(s3, config.S3_BUCKET);

  const app = Fastify({ logger: true });
  await app.register(cors, { origin: true });
  await app.register(multipart, { limits: { fileSize: 2 * 1024 * 1024 * 1024 } });

  await app.register(uploadPlugin, {
    db,
    s3,
    processQueue,
    config,
  });
  await app.register(jobsPlugin, {
    db,
    s3,
    config,
  });
  await app.register(assetsPlugin, {
    db,
    s3,
    config,
  });
  await app.register(testEnqueuePlugin, {
    db,
    processQueue,
  });

  app.get("/health", async (_request, reply) => {
    let dbOk = false;
    let redisOk = false;
    try {
      await db.execute(sql`SELECT 1`);
      dbOk = true;
    } catch {
      // ignore
    }
    try {
      await redisHealth.ping();
      redisOk = true;
    } catch {
      // ignore
    }
    return reply.send({
      status: "ok",
      db: dbOk ? "ok" : "error",
      redis: redisOk ? "ok" : "error",
    });
  });

  await app.listen({ port: config.PORT, host: "0.0.0.0" });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
