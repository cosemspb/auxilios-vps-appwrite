import 'server-only'
import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { createHash } from 'crypto'
import { createAdminClient } from '@/lib/appwrite/server'
import { Query } from 'node-appwrite'

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID!
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!
const BUCKET_NAME = process.env.R2_BUCKET_NAME!

const STORAGE_BUCKETS = ['comprovantes', 'avatars']
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

export interface BackupResult {
    success: boolean
    message: string
    details?: {
        arquivo_backup?: string
        tamanho_bytes?: number
        r2_file_count?: number
        storage?: string
    }
    error?: string
}

interface StorageFileProgress {
    bucket: string
    path: string
    size: number
    sha256?: string
    status: 'ok' | 'error'
    error?: string
}

const COLLECTIONS: Record<string, string> = {
    perfis: 'perfis',
    categorias: 'categorias',
    usuarios: 'usuarios',
    distancias: 'distancias',
    configuracoes_sistema: 'configuracoes_sistema',
    email_templates: 'email_templates',
    configuracoes_smtp: 'configuracoes_smtp',
    solicitacoes: 'solicitacoes',
    prestacao_contas: 'prestacao_contas',
    pc_arquivos: 'pc_arquivos',
    custos: 'custos',
    deslocamentos: 'deslocamentos',
    historico_solicitacoes: 'historico_solicitacoes',
    historico_backups: 'historico_backups',
    config_backup: 'config_backup',
    historico_emails: 'historico_emails',
    recuperacao_senhas: 'recuperacao_senhas',
}

export async function runFullBackup(): Promise<BackupResult> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

    const [dbResult, storageResult] = await Promise.all([
        runDatabaseBackup(timestamp),
        runStorageBackup(timestamp),
    ])

    const success = dbResult.success && storageResult.success

    const message = success
        ? `Backup concluído. ${dbResult.message}. ${storageResult.message}`
        : [
            dbResult.success ? null : `DB: ${dbResult.error}`,
            storageResult.success ? null : `Storage: ${storageResult.error}`,
        ].filter(Boolean).join(' | ')

    const { count: r2FileCount } = await listObjects()

    await logBackupResult(success, {
        arquivo_backup: dbResult.details?.arquivo_backup,
        tamanho_bytes: (dbResult.details?.tamanho_bytes || 0) + (storageResult.details?.tamanho_bytes || 0),
        r2_file_count: r2FileCount,
        storage_buckets: storageResult.details?.storage,
    })

    return {
        success,
        message,
        details: {
            arquivo_backup: dbResult.details?.arquivo_backup,
            tamanho_bytes: (dbResult.details?.tamanho_bytes || 0) + (storageResult.details?.tamanho_bytes || 0),
            r2_file_count: r2FileCount,
            storage: storageResult.details?.storage,
        },
        error: !success ? message : undefined,
    }
}

async function runDatabaseBackup(timestamp: string): Promise<BackupResult> {
    try {
        const { databases } = createAdminClient()
        const dbId = process.env.APPWRITE_DATABASE_ID!

        const filename = `backup-${timestamp}.json`
        const backupKey = `backups/${timestamp}/${filename}`

        const backupData: Record<string, any> = {
            version: '1.0',
            date: new Date().toISOString(),
            type: 'appwrite',
            collections: {} as Record<string, any[]>,
        }

        let totalDocs = 0
        const collectionIds = Object.keys(COLLECTIONS)

        for (const [collectionKey, collectionId] of Object.entries(COLLECTIONS)) {
            try {
                const allDocs: any[] = []
                let offset = 0
                const limit = 100

                while (true) {
                    const { documents } = await databases.listDocuments(
                        dbId,
                        collectionId,
                        [Query.limit(limit), Query.offset(offset)]
                    )
                    if (documents.length === 0) break
                    allDocs.push(...documents)
                    if (documents.length < limit) break
                    offset += limit
                }

                backupData.collections[collectionKey] = allDocs
                totalDocs += allDocs.length
            } catch (e: any) {
                console.error(`Erro ao ler ${collectionKey}:`, e?.message || e)
            }
        }

        const content = JSON.stringify(backupData, null, 2)
        const buffer = Buffer.from(content, 'utf-8')

        await getClient().send(new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: backupKey,
            Body: buffer,
            ContentType: 'application/json',
        }))

        return {
            success: true,
            message: `DB: ${collectionIds.length} coleções, ${totalDocs} documentos (${formatBytes(buffer.length)})`,
            details: {
                arquivo_backup: filename,
                tamanho_bytes: buffer.length,
            },
        }
    } catch (e: any) {
        return { success: false, message: 'Erro no backup do banco', error: e.message || String(e) }
    }
}

async function listStorageFiles(
    bucket: string,
    prefix = ''
): Promise<{ path: string; size: number }[]> {
    const { storage } = createAdminClient()
    const files: { path: string; size: number }[] = []

    try {
        const result = await storage.listFiles(bucket)
        for (const file of result.files) {
            files.push({ path: `${prefix}${file.name}`, size: file.sizeOriginal || 0 })
        }
    } catch (e: any) {
        console.error(`Erro ao listar ${bucket}:`, e?.message || e)
    }

    return files
}

async function streamFileToR2(
    bucket: string,
    fileId: string,
    filePath: string,
    r2Key: string
): Promise<StorageFileProgress> {
    try {
        const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT
        const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID
        const fileUrl = `${endpoint}/storage/buckets/${bucket}/files/${fileId}/view?project=${projectId}`

        const response = await fetch(fileUrl)
        if (!response.ok || !response.body) {
            return { bucket, path: filePath, size: 0, status: 'error', error: `HTTP ${response.status}` }
        }

        const contentType = response.headers.get('content-type') || 'application/octet-stream'

        const reader = response.body.getReader()
        const chunks: Uint8Array[] = []
        const hash = createHash('sha256')
        let totalSize = 0

        while (true) {
            const { done, value } = await reader.read()
            if (done) break
            hash.update(Buffer.from(value))
            chunks.push(value)
            totalSize += value.length
        }

        const sha256 = hash.digest('hex')
        const buffer = Buffer.concat(chunks.map(c => Buffer.from(c)))

        await getClient().send(new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: r2Key,
            Body: buffer,
            ContentType: contentType,
        }))

        return { bucket, path: filePath, size: totalSize, sha256, status: 'ok' }
    } catch (e: any) {
        return { bucket, path: filePath, size: 0, status: 'error', error: e.message || String(e) }
    }
}

async function runStorageBackup(timestamp: string): Promise<BackupResult> {
    try {
        const { storage } = createAdminClient()
        const results: StorageFileProgress[] = []
        const errors: string[] = []

        for (const bucket of STORAGE_BUCKETS) {
            let allFiles: { name: string; fileId: string; size: number }[] = []
            try {
                const result = await storage.listFiles(bucket)
                allFiles = result.files.map(f => ({
                    name: f.name,
                    fileId: f.$id,
                    size: f.sizeOriginal || 0,
                }))
            } catch (e) {
                console.error(`Erro ao listar bucket ${bucket}:`, e)
                continue
            }

            if (allFiles.length === 0) continue

            let index = 0
            const uploaded: StorageFileProgress[] = []

            while (index < allFiles.length) {
                const batch: Promise<StorageFileProgress>[] = []
                while (batch.length < CONCURRENCY && index < allFiles.length) {
                    const file = allFiles[index]
                    const r2Key = `backups/${timestamp}/storage/${bucket}/${file.name}`
                    batch.push(streamFileToR2(bucket, file.fileId, file.name, r2Key))
                    index++
                }

                const batchResults = await Promise.all(batch)
                uploaded.push(...batchResults)

                for (const r of batchResults) {
                    if (r.status === 'error') {
                        errors.push(`${bucket}/${r.path}: ${r.error}`)
                        console.error(`Erro ao fazer backup de ${bucket}/${r.path}:`, r.error)
                    }
                }
            }

            results.push(...uploaded)

            const okFiles = uploaded.filter(r => r.status === 'ok')
            const manifest = {
                bucket,
                backup_date: new Date().toISOString(),
                total_files: uploaded.length,
                ok_files: okFiles.length,
                total_bytes: okFiles.reduce((s, f) => s + f.size, 0),
                files: okFiles.map(f => ({
                    path: f.path,
                    size: f.size,
                    sha256: f.sha256,
                })),
            }

            const manifestKey = `backups/${timestamp}/storage/${bucket}/manifest.json`
            await getClient().send(new PutObjectCommand({
                Bucket: BUCKET_NAME,
                Key: manifestKey,
                Body: JSON.stringify(manifest, null, 2),
                ContentType: 'application/json',
            }))
        }

        const totalBytes = results.reduce((s, r) => s + r.size, 0)
        const okCount = results.filter(r => r.status === 'ok').length
        const errCount = results.filter(r => r.status === 'error').length

        const success = errCount === 0
        const bucketSummary = STORAGE_BUCKETS.join(', ')

        return {
            success,
            message: success
                ? `Storage: ${okCount} arquivos (${formatBytes(totalBytes)})`
                : `Storage: ${okCount} ok, ${errCount} erros`,
            details: {
                storage: `${bucketSummary} | ${okCount} arquivos, ${formatBytes(totalBytes)}${errCount > 0 ? `, ${errCount} erros` : ''}`,
                tamanho_bytes: totalBytes,
            },
            error: errors.length > 0 ? errors.join('; ') : undefined,
        }
    } catch (e: any) {
        return { success: false, message: 'Erro no backup do storage', error: e.message || String(e) }
    }
}

async function logBackupResult(
    success: boolean,
    details: {
        arquivo_backup?: string
        tamanho_bytes?: number
        r2_file_count?: number
        storage_buckets?: string
        erro_mensagem?: string
    }
) {
    try {
        const { databases } = createAdminClient()
        const { ID } = await import('node-appwrite')
        const logData: Record<string, any> = {
            data_execucao: new Date().toISOString(),
            status: success ? 'sucesso' : 'falha',
            nome_arquivo: details.arquivo_backup || null,
            tamanho_bytes: details.tamanho_bytes || null,
        }
        const extra: Record<string, any> = {}
        if (details.r2_file_count !== undefined) extra.r2_file_count = details.r2_file_count
        if (details.storage_buckets) extra.storage = details.storage_buckets
        if (details.erro_mensagem) extra.erro = details.erro_mensagem
        if (Object.keys(extra).length > 0) {
            logData.detalhes = JSON.stringify(extra)
        }
        await databases.createDocument(
            process.env.APPWRITE_DATABASE_ID!,
            'historico_backups',
            ID.unique(),
            logData
        )
    } catch (e) {
        console.error('Erro ao registrar log de backup:', e)
    }
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

export async function deleteFile(key: string) {
    await getClient().send(
        new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        })
    )
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}
