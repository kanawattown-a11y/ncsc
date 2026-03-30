import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;

export async function getPresignedUploadUrl(nationalId: string, fileName: string, fileType: string) {
  // Store files in a unique folder per citizen: persons/{nationalId}/{timestamp}-{fileName}
  const key = `persons/${nationalId}/${Date.now()}-${fileName}`;
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: fileType,
  });

  // URL valid for 5 minutes only
  const url = await getSignedUrl(s3Client, command, { expiresIn: 300 });

  return { url, key };
}

export async function getPresignedViewUrl(key: string) {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  // URL valid for 15 minutes only to ensure high security
  const url = await getSignedUrl(s3Client, command, { expiresIn: 900 });

  return url;
}
