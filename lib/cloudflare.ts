import { S3Client, PutObjectCommand, DeleteObjectsCommand } from "@aws-sdk/client-s3";

function getR2Config() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    throw new Error(
      "Missing R2 environment variables. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME in .env.local"
    );
  }

  return { accountId, accessKeyId, secretAccessKey, bucketName };
}

function createR2Client() {
  const { accountId, accessKeyId, secretAccessKey } = getR2Config();
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

/** Returns the public base URL for accessing R2 objects. */
export function getR2PublicBase(): string {
  const custom = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");
  if (custom) return custom;
  const { accountId, bucketName } = getR2Config();
  return `https://pub-${accountId}.r2.dev/${bucketName}`;
}

/** Upload a buffer to R2. Returns the public URL. */
export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<string> {
  const { bucketName } = getR2Config();
  const client = createR2Client();

  console.log(`[R2] Uploading key="${key}" bucket="${bucketName}" size=${body.length} bytes`);

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: body,
        ContentType: contentType,
      })
    );
    const url = `${getR2PublicBase()}/${key}`;
    console.log(`[R2] Upload success: ${url}`);
    return url;
  } catch (err) {
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    console.error(`[R2] Upload FAILED: ${msg}`);
    throw err;
  }
}

/** Delete one or more objects from R2 by key. No-op if `keys` is empty. */
export async function deleteFromR2(keys: string[]): Promise<void> {
  if (keys.length === 0) return;

  const { bucketName } = getR2Config();
  const client = createR2Client();

  console.log(`[R2] Deleting ${keys.length} key(s) from bucket="${bucketName}"`);

  try {
    // DeleteObjectsCommand accepts at most 1000 keys per request.
    for (let i = 0; i < keys.length; i += 1000) {
      const batch = keys.slice(i, i + 1000);
      await client.send(
        new DeleteObjectsCommand({
          Bucket: bucketName,
          Delete: { Objects: batch.map((Key) => ({ Key })) },
        })
      );
    }
    console.log(`[R2] Delete success: ${keys.length} key(s)`);
  } catch (err) {
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    console.error(`[R2] Delete FAILED: ${msg}`);
    throw err;
  }
}
