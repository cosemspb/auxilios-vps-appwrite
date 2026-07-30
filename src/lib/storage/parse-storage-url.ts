const BUCKET_PATTERNS = ['comprovantes', 'avatars'] as const

type BucketName = typeof BUCKET_PATTERNS[number]

interface ParsedStorageUrl {
    bucket: BucketName
    filePath: string
    fileName: string
}

export function parseStorageUrl(url: string): ParsedStorageUrl | null {
    for (const bucket of BUCKET_PATTERNS) {
        const encodedBucket = encodeURIComponent(bucket)
        const patterns = [
            new RegExp(`${bucket}\\/([^?\\s]+)`),
            new RegExp(`${encodedBucket}\\/([^?\\s]+)`),
            new RegExp(`\\/storage\\/v1\\/object\\/(?:public|sign)\\/${bucket}\\/([^?\\s]+)`),
        ]
        for (const pattern of patterns) {
            const match = url.match(pattern)
            if (match) {
                const filePath = match[1]
                const fileName = filePath.split('/').pop() || filePath
                return { bucket: bucket as BucketName, filePath, fileName }
            }
        }
    }
    return null
}
