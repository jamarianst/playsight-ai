import type { FastifyPluginAsync } from "fastify";
import { randomUUID } from "node:crypto";
import type { S3Client } from "@aws-sdk/client-s3";
import type { Db } from "../db/index.js";
import { assets, jobs } from "../db/schema.js";
import { getUploadUrl, uploadStream } from "../storage.js";
import { enqueueProcess, type ProcessQueue } from "../queue.js";
import type { Config } from "../config.js";

interface UploadUrlBody {
  filename: string;
}

interface UploadDeps {
  db: Db;
  s3: S3Client;
  processQueue: ProcessQueue;
  config: Config;
}

function getExtension(filename: string): string {
  const i = filename.lastIndexOf(".");
  return i >= 0 ? filename.slice(i) : "";
}

const uploadPlugin: FastifyPluginAsync<UploadDeps> = async (app, opts) => {
  const { db, s3, processQueue, config } = opts;

  app.post<{ Body: UploadUrlBody }>("/upload/url", async (request, reply) => {
    const { filename } = request.body ?? {};
    if (!filename || typeof filename !== "string") {
      return reply.status(400).send({ error: "filename is required" });
    }
    const assetId = randomUUID();
    const ext = getExtension(filename);
    const storageKey = `videos/${assetId}/raw${ext}`;

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

    const uploadUrl = await getUploadUrl(
      s3,
      config.S3_BUCKET,
      storageKey,
      3600
    );

    await enqueueProcess(processQueue, assetId);

    return reply.send({
      assetId,
      jobId,
      uploadUrl,
      expiresIn: 3600,
    });
  });

  app.post("/upload", async (request, reply) => {
    const data = await request.file();
    if (!data) {
      return reply.status(400).send({ error: "No file in request. Use multipart/form-data with field 'file'." });
    }
    const assetId = randomUUID();
    const ext = getExtension(data.filename);
    const storageKey = `videos/${assetId}/raw${ext}`;

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

    const contentType = data.mimetype || "video/mp4";
    await uploadStream(s3, config.S3_BUCKET, storageKey, data.file, contentType);
    await enqueueProcess(processQueue, assetId);

    return reply.send({
      assetId,
      jobId,
      message: "Video uploaded; analysis queued.",
    });
  });
};

export default uploadPlugin;
