'use server'

import { createAdminClient } from '@/lib/appwrite/server'
import { parseStorageUrl } from './parse-storage-url'

function getFileViewUrl(bucket: string, fileId: string): string {
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID
    return `${endpoint}/storage/buckets/${bucket}/files/${fileId}/view?project=${projectId}`
}

export async function getSignedFileUrl(bucket: string, filePath: string, expirySeconds: number = 3600): Promise<string | null> {
    try {
        const fileId = filePath.split('/').pop() || filePath
        return getFileViewUrl(bucket, fileId)
    } catch (error) {
        console.error(`Erro ao gerar URL para ${bucket}/${filePath}:`, error)
        return null
    }
}

export async function getAccountabilityFileUrls(files: { id: string; arquivo_url: string }[]): Promise<Map<string, string>> {
    const urlMap = new Map<string, string>()

    for (const file of files) {
        try {
            const parsed = parseStorageUrl(file.arquivo_url)
            if (!parsed) {
                urlMap.set(file.id, file.arquivo_url)
                continue
            }
            const fileId = decodeURIComponent(parsed.filePath).split('/').pop() || decodeURIComponent(parsed.filePath)
            urlMap.set(file.id, getFileViewUrl(parsed.bucket, fileId))
        } catch {
            urlMap.set(file.id, file.arquivo_url)
        }
    }

    return urlMap
}
