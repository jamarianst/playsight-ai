import { Queue } from "bullmq";
import type { Config } from "./config.js";

function parseRedisUrl(url: string): { host: string; port: number } {
  const u = new URL(url.replace("redis://", "http://"));
  return { host: u.hostname, port: parseInt(u.port || "6379", 10) };
}

export function createRedis(config: Config) {
  const { host, port } = parseRedisUrl(config.REDIS_URL);
  return { host, port };
}

const QUEUE_NAME = "playsight-process-video";

export function createProcessQueue(connection: { host: string; port: number }) {
  return new Queue(QUEUE_NAME, {
    connection,
    defaultJobOptions: { removeOnComplete: { count: 1000 } },
  });
}

export type ProcessQueue = ReturnType<typeof createProcessQueue>;

export async function enqueueProcess(
  queue: ProcessQueue,
  assetId: string
): Promise<string> {
  const job = await queue.add("process", { assetId });
  return job.id ?? String(job.id);
}
