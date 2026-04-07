import { DeleteObjectCommand, DeleteObjectsCommand, GetObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";
import { AUDIO_SIZE_ERROR_MESSAGE, MAX_AUDIO_SIZE_BYTES } from "@/lib/audio";

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function sanitizeSlug(input: string): string {
  const normalized = input.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-");
  const compact = normalized.replace(/-+/g, "-").replace(/^-|-$/g, "");
  return compact || "song";
}

function buildObjectKey(songSlug: string, extension: string): string {
  const safeSlug = sanitizeSlug(songSlug);
  const randomPart = randomUUID().replace(/-/g, "").slice(0, 12);
  return `songs/audio/${safeSlug}-${Date.now()}-${randomPart}${extension}`;
}

function getR2Client(): S3Client {
  const accountId = getRequiredEnv("R2_ACCOUNT_ID");
  const endpoint =
    process.env.R2_ENDPOINT || `https://${accountId}.r2.cloudflarestorage.com`;

  return new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId: getRequiredEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: getRequiredEnv("R2_SECRET_ACCESS_KEY"),
    },
  });
}

function detectExtension(fileName: string, mimeType: string): string {
  const lowered = fileName.toLowerCase();
  if (lowered.endsWith(".mp3") || mimeType === "audio/mpeg") return ".mp3";
  if (lowered.endsWith(".m4a") || mimeType === "audio/mp4" || mimeType === "audio/x-m4a" || mimeType === "audio/m4a") return ".m4a";
  return "";
}

function getAudioContentType(extension: ".mp3" | ".m4a") {
  return extension === ".m4a" ? "audio/mp4" : "audio/mpeg";
}

function validateSongAudioUpload(params: {
  fileName: string;
  mimeType: string;
  fileSize: number;
}) {
  const { fileName, mimeType, fileSize } = params;

  if (fileSize === 0) {
    throw new Error("Uploaded file is empty");
  }
  if (fileSize > MAX_AUDIO_SIZE_BYTES) {
    throw new Error(AUDIO_SIZE_ERROR_MESSAGE);
  }

  const extension = detectExtension(fileName, mimeType);
  if (extension !== ".mp3" && extension !== ".m4a") {
    throw new Error("Only MP3 and M4A files are supported");
  }

  return extension;
}

function getPublicR2ObjectUrl(key: string) {
  const publicBaseUrl = getRequiredEnv("R2_PUBLIC_BASE_URL").replace(/\/$/, "");
  return `${publicBaseUrl}/${key}`;
}

export async function createSongAudioUploadUrl(params: {
  fileName: string;
  mimeType: string;
  fileSize: number;
  songSlug: string;
  expiresInSeconds?: number;
}) {
  const {
    fileName,
    mimeType,
    fileSize,
    songSlug,
    expiresInSeconds = 600,
  } = params;

  const extension = validateSongAudioUpload({ fileName, mimeType, fileSize });
  const bucket = getRequiredEnv("R2_BUCKET_NAME");
  const key = buildObjectKey(songSlug, extension);
  const contentType = getAudioContentType(extension);

  const client = getR2Client();
  const uploadUrl = await getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
    { expiresIn: expiresInSeconds }
  );

  return {
    key,
    url: getPublicR2ObjectUrl(key),
    uploadUrl,
    contentType,
  };
}

export async function uploadSongAudioToR2(params: {
  fileName: string;
  mimeType: string;
  fileBytes: Uint8Array;
  songSlug: string;
}) {
  const { fileName, mimeType, fileBytes, songSlug } = params;
  const extension = validateSongAudioUpload({
    fileName,
    mimeType,
    fileSize: fileBytes.byteLength,
  });

  const bucket = getRequiredEnv("R2_BUCKET_NAME");
  const key = buildObjectKey(songSlug, extension);

  const client = getR2Client();
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: fileBytes,
      ContentType: getAudioContentType(extension),
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  const url = getPublicR2ObjectUrl(key);

  return { key, url };
}

export function extractR2ObjectKeyFromUrl(audioUrl: string): string {
  const trimmed = audioUrl.trim();
  if (!trimmed) {
    throw new Error("Audio URL is empty");
  }

  const publicBaseUrl = getRequiredEnv("R2_PUBLIC_BASE_URL").replace(/\/$/, "");
  if (trimmed.startsWith(`${publicBaseUrl}/`)) {
    return decodeURIComponent(trimmed.slice(publicBaseUrl.length + 1));
  }

  try {
    const parsed = new URL(trimmed);
    const pathname = parsed.pathname.replace(/^\//, "");
    // If the public base URL wasn't provided or matched, try to derive the key.
    // Common R2 public URL patterns:
    // - https://<public-base>/<key>
    // - https://<account>.r2.cloudflarestorage.com/<bucket>/<key>
    // If the bucket name is present as first path segment, strip it.
    const bucket = getRequiredEnv("R2_BUCKET_NAME");
    if (pathname.startsWith(`${bucket}/`)) {
      return decodeURIComponent(pathname.slice(bucket.length + 1));
    }

    if (pathname.startsWith("songs/audio/")) {
      return decodeURIComponent(pathname);
    }
  } catch {
    // fall through to error
  }

  throw new Error("Audio URL is not in expected R2 format");
}

export async function getSongAudioObjectFromR2(key: string) {
  const bucket = getRequiredEnv("R2_BUCKET_NAME");
  const client = getR2Client();

  return client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );
}

export async function deleteSongAudioFromR2(key: string) {
  const bucket = getRequiredEnv("R2_BUCKET_NAME");
  const client = getR2Client();
  // Try multiple candidate keys in case the public URL contains the bucket
  // segment or other prefixes. If any delete call succeeds (no exception),
  // consider the object deleted. Collect errors to report if all attempts fail.
  const candidates = new Set<string>();
  candidates.add(key);
  // If key starts with bucket/, also add version without bucket prefix
  if (key.startsWith(`${bucket}/`)) {
    candidates.add(key.slice(bucket.length + 1));
  } else {
    // also try with bucket prefix
    candidates.add(`${bucket}/${key}`);
  }

  // Also try decoded/encoded variants
  try {
    candidates.add(decodeURIComponent(key));
  } catch {}
  try {
    candidates.add(encodeURIComponent(key));
  } catch {}

  const errors: Array<{ key: string; err: unknown }> = [];
  for (const candidate of Array.from(candidates)) {
    try {
      await client.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: candidate,
        })
      );

      // If delete didn't throw, assume success for this candidate.
      return { success: true, key: candidate };
    } catch (err) {
      errors.push({ key: candidate, err });
    }
  }

  // If we reach here, all delete attempts failed. Throw aggregated error.
  const details = errors.map((e) => {
    let message: string;
    if (e.err && typeof e.err === "object" && "message" in e.err && typeof (e.err as { message?: unknown }).message === "string") {
      message = String((e.err as { message?: unknown }).message);
    } else {
      message = String(e.err);
    }
    return { key: e.key, message };
  });
  throw new Error(`DeleteObject failed for all candidate keys: ${JSON.stringify(details)}`);
}

export async function deleteObjectsByPrefix(songSlug: string) {
  const bucket = getRequiredEnv("R2_BUCKET_NAME");
  const client = getR2Client();
  const prefix = `songs/audio/${sanitizeSlug(songSlug)}`;

  const listed = await client.send(
    new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
    })
  );

  const toDelete = (listed.Contents ?? []).map((c) => ({ Key: c.Key! }));
  if (toDelete.length === 0) return { deleted: 0 };

  const res = await client.send(
    new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: { Objects: toDelete },
    })
  );

  const deleted = (res.Deleted ?? []).length;
  return { deleted };
}

export async function deleteObjectsMatchingSong(songSlug: string, languages?: string[], identifiers?: string[]) {
  const bucket = getRequiredEnv("R2_BUCKET_NAME");
  const client = getR2Client();
  const listPrefix = `songs/audio/`;

  const listed = await client.send(
    new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: listPrefix,
    })
  );

  const safeSlug = sanitizeSlug(songSlug);
  const langSlugs = (languages ?? []).map((l) => sanitizeSlug(`${songSlug}-${l}`));
  const idents = (identifiers ?? []).map((s) => s.toLowerCase());

  const matches = (listed.Contents ?? []).filter((c) => {
    const key = (c.Key ?? "").toLowerCase();
    if (!key) return false;
    if (key.includes(safeSlug)) return true;
    for (const ls of langSlugs) {
      if (key.includes(ls)) return true;
    }
    for (const id of idents) {
      if (!id) continue;
      if (key.includes(id)) return true;
    }
    return false;
  });

  if (matches.length === 0) return { deleted: 0 };

  const toDelete = matches.map((c) => ({ Key: c.Key! }));
  const res = await client.send(
    new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: { Objects: toDelete },
    })
  );

  const deleted = (res.Deleted ?? []).length;
  return { deleted };
}
