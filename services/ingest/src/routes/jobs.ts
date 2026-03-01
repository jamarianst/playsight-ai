import type { FastifyPluginAsync } from "fastify";
import { eq } from "drizzle-orm";
import type { S3Client } from "@aws-sdk/client-s3";
import type { Db } from "../db/index.js";
import { assets, jobs } from "../db/schema.js";
import { getDownloadUrl } from "../storage.js";
import type { Config } from "../config.js";

interface JobsDeps {
  db: Db;
  s3: S3Client;
  config: Config;
}

const EXPIRES_IN = 3600;

const jobsPlugin: FastifyPluginAsync<JobsDeps> = async (app, opts) => {
  const { db, s3, config } = opts;

  app.get<{ Params: { id: string } }>("/jobs/:id", async (request, reply) => {
    const { id } = request.params;
    const [job] = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, id))
      .limit(1);
    if (!job) {
      return reply.status(404).send({ error: "Job not found" });
    }

    const [asset] = await db
      .select()
      .from(assets)
      .where(eq(assets.id, job.assetId))
      .limit(1);
    if (!asset) {
      return reply.status(404).send({ error: "Asset not found" });
    }

    const result: {
      id: string;
      assetId: string;
      status: string;
      createdAt: Date;
      updatedAt: Date;
      result?: unknown;
      errorMessage?: string | null;
      asset: {
        id: string;
        storageKey: string;
        status: string;
        durationSeconds?: number | null;
        sport?: string | null;
        createdAt: Date;
      };
    } = {
      id: job.id,
      assetId: job.assetId,
      status: job.status,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      result: job.result ?? undefined,
      errorMessage: job.errorMessage ?? undefined,
      asset: {
        id: asset.id,
        storageKey: asset.storageKey,
        status: asset.status,
        durationSeconds: asset.durationSeconds ?? undefined,
        sport: asset.sport ?? undefined,
        createdAt: asset.createdAt,
      },
    };

    if (job.status === "completed" && job.result && typeof job.result === "object" && "highlight" in job.result) {
      const r = job.result as { highlight?: string; heatmap?: string };
      const signed: { highlight?: string; heatmap?: string } = {};
      if (r.highlight && typeof r.highlight === "string") {
        signed.highlight = await getDownloadUrl(
          s3,
          config.S3_BUCKET,
          r.highlight,
          EXPIRES_IN
        );
      }
      if (r.heatmap && typeof r.heatmap === "string") {
        signed.heatmap = await getDownloadUrl(
          s3,
          config.S3_BUCKET,
          r.heatmap,
          EXPIRES_IN
        );
      }
      result.result = { ...(job.result as object), ...signed };
    }

    return reply.send(result);
  });
};

export default jobsPlugin;
