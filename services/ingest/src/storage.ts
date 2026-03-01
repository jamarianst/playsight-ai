import type { S3ClientConfig } from "@aws-sdk/client-s3";
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  HeadBucketCommand,
  CreateBucketCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { Readable } from "node:stream";
import type { Config } from "./config.js";

export function createS3Client(config: Config): S3Client {
  const base: S3ClientConfig = {
    region: config.S3_REGION,
  };
  if (config.S3_ENDPOINT) {
    base.endpoint = config.S3_ENDPOINT;
    base.forcePathStyle = true;
    base.tls = config.S3_USE_SSL;
  }
  if (config.S3_ACCESS_KEY_ID && config.S3_SECRET_ACCESS_KEY) {
    base.credentials = {
      accessKeyId: config.S3_ACCESS_KEY_ID,
      secretAccessKey: config.S3_SECRET_ACCESS_KEY,
    };
  }
  return new S3Client(base);
}

export async function getUploadUrl(
  client: S3Client,
  bucket: string,
  key: string,
  expiresIn = 3600
): Promise<string> {
  const command = new PutObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(client, command, { expiresIn });
}

export async function getDownloadUrl(
  client: S3Client,
  bucket: string,
  key: string,
  expiresIn = 3600
): Promise<string> {
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(client, command, { expiresIn });
}

export async function ensureBucket(client: S3Client, bucket: string): Promise<void> {
  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
  } catch {
    await client.send(new CreateBucketCommand({ Bucket: bucket }));
  }
}

export async function uploadStream(
  client: S3Client,
  bucket: string,
  key: string,
  body: Readable,
  contentType?: string
): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
  });
  await client.send(command);
}
