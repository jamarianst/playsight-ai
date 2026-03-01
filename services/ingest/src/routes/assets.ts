import type { FastifyPluginAsync } from "fastify";
import { eq, desc } from "drizzle-orm";
import type { S3Client } from "@aws-sdk/client-s3";
import type { Db } from "../db/index.js";
import { assets, jobs } from "../db/schema.js";
import { getDownloadUrl } from "../storage.js";
import type { Config } from "../config.js";

interface AssetsDeps {
  db: Db;
  s3: S3Client;
  config: Config;
}

const EXPIRES_IN = 3600;

const assetsPlugin: FastifyPluginAsync<AssetsDeps> = async (app, opts) => {
  const { db, s3, config } = opts;

  app.get<{ Params: { assetId: string } }>("/assets/:assetId", async (request, reply) => {
    const { assetId } = request.params;
    const [asset] = await db
      .select()
      .from(assets)
      .where(eq(assets.id, assetId))
      .limit(1);
    if (!asset) {
      return reply.status(404).send({ error: "Asset not found" });
    }

    const [job] = await db
      .select()
      .from(jobs)
      .where(eq(jobs.assetId, assetId))
      .orderBy(desc(jobs.createdAt))
      .limit(1);
    if (!job) {
      return reply.send({
        asset: {
          id: asset.id,
          status: asset.status,
          storageKey: asset.storageKey,
          durationSeconds: asset.durationSeconds ?? undefined,
          sport: asset.sport ?? undefined,
          createdAt: asset.createdAt,
        },
        job: null,
      });
    }

    const result: {
      asset: {
        id: string;
        status: string;
        storageKey: string;
        durationSeconds?: number;
        sport?: string | null;
        createdAt: Date;
      };
      job: {
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        result?: unknown;
        errorMessage?: string | null;
      };
    } = {
      asset: {
        id: asset.id,
        status: asset.status,
        storageKey: asset.storageKey,
        durationSeconds: asset.durationSeconds ?? undefined,
        sport: asset.sport ?? undefined,
        createdAt: asset.createdAt,
      },
      job: {
        id: job.id,
        status: job.status,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        result: job.result ?? undefined,
        errorMessage: job.errorMessage ?? undefined,
      },
    };

    if (job.status === "completed" && job.result && typeof job.result === "object" && "highlight" in job.result) {
      const r = job.result as { highlight?: string; heatmap?: string; keyMoments?: unknown };
      const signed: Record<string, unknown> = { ...r };
      if (r.highlight && typeof r.highlight === "string") {
        signed.highlight = await getDownloadUrl(s3, config.S3_BUCKET, r.highlight, EXPIRES_IN);
      }
      if (r.heatmap && typeof r.heatmap === "string") {
        signed.heatmap = await getDownloadUrl(s3, config.S3_BUCKET, r.heatmap, EXPIRES_IN);
      }
      result.job.result = signed;
    }

    return reply.send(result);
  });
};

export default assetsPlugin;
