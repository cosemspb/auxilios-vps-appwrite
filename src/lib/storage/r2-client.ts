import 'server-only'
import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3'

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID!
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!
const BUCKET_NAME = process.env.R2_BUCKET_NAME!

let client: S3Client | null = null

function getClient(): S3Client {
    if (!client) {
        client = new S3Client({
            region: 'auto',
            endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: ACCESS_KEY_ID,
                secretAccessKey: SECRET_ACCESS_KEY,
            },
        })
    }
    return client
}

async function uploadToR2(key: string, body: Buffer | Uint8Array | Blob | File, contentType: string) {
    await getClient().send(
        new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            Body: body,
            ContentType: contentType,
        })
    )

    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`
    return { url: publicUrl, key }
}

export async function uploadFile(key: string, file: File | Blob | Uint8Array, contentType?: string) {
    const buffer = file instanceof Uint8Array ? file : Buffer.from(await file.arrayBuffer())
    const ct = contentType || (file instanceof File ? file.type : 'application/octet-stream')
    return uploadToR2(key, buffer, ct)
}

export async function uploadBuffer(key: string, buffer: Buffer, contentType: string) {
    return uploadToR2(key, buffer, contentType)
}

export async function deleteFile(key: string) {
    await getClient().send(
        new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        })
    )
}

export async function listObjects() {
    const result = await getClient().send(
        new ListObjectsV2Command({ Bucket: BUCKET_NAME })
    )
    return {
        objects: result.Contents || [],
        count: result.KeyCount || 0,
    }
}

export function extractKeyFromUrl(url: string): string | null {
    const prefix = process.env.R2_PUBLIC_URL!
    if (url.startsWith(prefix)) {
        return url.slice(prefix.length + 1)
    }
    return null
}
