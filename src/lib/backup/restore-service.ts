import 'server-only'
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3'
import { createAdminClient } from '@/lib/appwrite/server'
import { runFullBackup } from './backup-service'
import { ID } from 'node-appwrite'

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID!
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!
const BUCKET_NAME = process.env.R2_BUCKET_NAME!

const CONCURRENCY = 5

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

export interface BackupInfo {
    timestamp: string
    date: string
    jsonFile: string | null
    jsonSize: number
    storageBuckets: {
        bucket: string
        fileCount: number
        totalBytes: number
    }[]
}

export interface RestorePreview {
    backup: BackupInfo
    collections: { name: string; docs: number }[]
    dbWarning: string | null
}

export interface RestoreResult {
    success: boolean
    message: string
    details?: {
        db_docs_restored?: number
        storage_files_restored?: number
        storage_bytes?: number
        storage_verified?: boolean
    }
    error?: string
}

function parseBackupTimestamp(dir: string): string {
    const [datePart, timePart] = dir.split('T')
    if (!timePart) return dir
    const segments = timePart.replace(/Z$/, '').split('-')
    if (segments.length < 4) return dir
    const isoTime = `${segments[0]}:${segments[1]}:${segments[2]}.${segments[3]}Z`
    const date = new Date(`${datePart}T${isoTime}`)
    if (isNaN(date.getTime())) return dir
    return date.toLocaleString('pt-BR')
}

export async function listBackups(): Promise<BackupInfo[]> {
    const result = await getClient().send(new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: 'backups/',
        Delimiter: '/',
    }))

    const prefixes = result.CommonPrefixes || []
    const backups: BackupInfo[] = []

    for (const prefix of prefixes) {
        const dir = (prefix.Prefix || '').replace(/^backups\//, '').replace(/\/$/, '')
        if (!dir) continue

        const objects = await getClient().send(new ListObjectsV2Command({
            Bucket: BUCKET_NAME,
            Prefix: `backups/${dir}/`,
        }))

        const items = objects.Contents || []
        const jsonFile = items.find(o => o.Key?.endsWith('.json')) || null
        const storagePrefixes = new Set<string>()
        const storageBuckets: BackupInfo['storageBuckets'] = []

        for (const item of items) {
            const key = item.Key || ''
            const match = key.match(/^backups\/[^/]+\/storage\/([^/]+)\//)
            if (match) storagePrefixes.add(match[1])
        }

        for (const bucket of storagePrefixes) {
            const bucketItems = items.filter(o => o.Key?.includes(`/storage/${bucket}/`) && !o.Key?.endsWith('manifest.json'))
            const totalBytes = bucketItems.reduce((s, o) => s + (o.Size || 0), 0)
            storageBuckets.push({ bucket, fileCount: bucketItems.length, totalBytes })
        }

        backups.push({
            timestamp: dir,
            date: parseBackupTimestamp(dir),
            jsonFile: jsonFile?.Key || null,
            jsonSize: jsonFile?.Size || 0,
            storageBuckets,
        })
    }

    return backups.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
}

export async function previewRestore(timestamp: string): Promise<RestorePreview> {
    const backups = await listBackups()
    const backup = backups.find(b => b.timestamp === timestamp)
    if (!backup || !backup.jsonFile) {
        return {
            backup: backup || { timestamp, date: '', jsonFile: null, jsonSize: 0, storageBuckets: [] },
            collections: [],
            dbWarning: 'Backup não encontrado ou arquivo JSON ausente.',
        }
    }

    const result = await getClient().send(new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: backup.jsonFile,
    }))

    const stream = result.Body as import('stream').Readable
    const chunks: Buffer[] = []
    for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk))
    }
    const content = Buffer.concat(chunks).toString('utf-8')
    const backupData = JSON.parse(content)

    const collections: { name: string; docs: number }[] = []
    for (const [name, docs] of Object.entries(backupData.collections || {})) {
        collections.push({ name, docs: (docs as any[]).length })
    }

    return { backup, collections, dbWarning: null }
}

export async function runFullRestore(timestamp: string): Promise<RestoreResult> {
    const { databases } = createAdminClient()
    const dbId = process.env.APPWRITE_DATABASE_ID!

    try {
        const preBackupResult = await runFullBackup()
        if (!preBackupResult.success) {
            console.error('Auto-backup pré-restore falhou, mas continuando:', preBackupResult.error)
        }

        const preview = await previewRestore(timestamp)
        if (!preview.backup.jsonFile) {
            return { success: false, message: 'Backup inválido: arquivo JSON não encontrado.', error: 'JSON file missing' }
        }

        const result = await getClient().send(new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: preview.backup.jsonFile,
        }))

        const stream = result.Body as import('stream').Readable
        const chunks: Buffer[] = []
        for await (const chunk of stream) {
            chunks.push(Buffer.from(chunk))
        }
        const content = Buffer.concat(chunks).toString('utf-8')
        const backupData = JSON.parse(content)

        let totalDocsRestored = 0

        for (const [collectionKey, docs] of Object.entries(backupData.collections || {})) {
            const documents = docs as any[]
            for (const doc of documents) {
                try {
                    await databases.createDocument(
                        dbId,
                        collectionKey,
                        ID.unique(),
                        doc
                    )
                    totalDocsRestored++
                } catch (e: any) {
                    console.error(`Erro ao restaurar documento em ${collectionKey}:`, e?.message || e)
                }
            }
        }

        return {
            success: true,
            message: `Banco: ${totalDocsRestored} documentos em ${Object.keys(backupData.collections || {}).length} coleções.`,
            details: {
                db_docs_restored: totalDocsRestored,
            },
        }
    } catch (e: any) {
        return { success: false, message: 'Erro durante a restauração', error: e.message || String(e) }
    }
}
