'use server'

import { createClient, createAdminClient } from '@/lib/appwrite/server'
import { validateFile } from '@/lib/storage/validate-file'
import { revalidatePath } from 'next/cache'
import { updateAccountabilityStatusSchema, saveAccountabilityDraftSchema, uploadAccountabilityFilesSchema } from '@/lib/schemas'
import { ID } from 'node-appwrite'

async function requireAuth() {
    const { account } = createClient()
    try {
        return await account.get()
    } catch {
        throw new Error('Usuário não autenticado')
    }
}

export async function uploadAccountabilityFiles(
    accountabilityId: string,
    requestId: string,
    formData: FormData
): Promise<{ error?: string; success?: boolean }> {
    uploadAccountabilityFilesSchema.parse({ accountabilityId, requestId })
    await requireAuth()

    const files: File[] = []
    let i = 0
    while (true) {
        const file = formData.get(`file_${i}`) as File | null
        if (!file || file.size === 0) break
        files.push(file)
        i++
    }

    if (files.length === 0) return { error: 'Nenhum arquivo enviado.' }

    for (const file of files) {
        const validation = validateFile(file, 'comprovante')
        if (validation) return { error: validation.message }
    }

    try {
        const { databases, storage } = createAdminClient()
        const dbId = process.env.APPWRITE_DATABASE_ID!
        const bucketId = 'comprovantes'

        const { documents } = await databases.listDocuments(dbId, 'solicitacoes', [])
        const solicitacao = documents.find(d => d.$id === requestId)
        const protocolo = solicitacao?.protocolo || accountabilityId.slice(0, 8)

        await Promise.all(files.map(async (file) => {
            const fileExt = file.name.split('.').pop()?.toLowerCase() || ''
            const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt)
            const prefix = isImage ? 'foto_relatorio_' : ''
            const safeName = file.name
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-zA-Z0-9._-]/g, '_')
            const fileName = `${protocolo}/${prefix}${safeName}`

            await storage.createFile(bucketId, ID.unique(), file)

            await databases.createDocument(dbId, 'pc_arquivos', ID.unique(), {
                prestacao_contas_id: accountabilityId,
                arquivo_url: fileName,
                nome_arquivo: file.name,
                tipo_arquivo: fileExt,
            })
        }))

        return { success: true }
    } catch (err: any) {
        console.error('uploadAccountabilityFiles error:', err)
        return { error: err.message || 'Erro ao fazer upload dos arquivos.' }
    }
}

export async function updateAccountabilityStatus(
    accountabilityId: string,
    requestId: string,
    status: string
): Promise<{ error?: string; success?: boolean }> {
    updateAccountabilityStatusSchema.parse({ accountabilityId, requestId, status })

    try {
        await requireAuth()
        const { databases } = createAdminClient()
        const dbId = process.env.APPWRITE_DATABASE_ID!

        const updateData: Record<string, any> = { status, data_envio: new Date().toISOString() }
        if (status === 'em_avaliacao') {
            updateData.motivo_recusa = null
        }

        await databases.updateDocument(dbId, 'prestacao_contas', accountabilityId, updateData)

        try {
            const doc = await databases.getDocument(dbId, 'solicitacoes', requestId)
            if (!['paga', 'paga_nao_comprovada', 'paga_comprovada'].includes(doc.situacao)) {
                await databases.updateDocument(dbId, 'solicitacoes', requestId, {
                    situacao: status === 'em_avaliacao' ? 'em_avaliacao' : 'pendente',
                })
            }
        } catch { /* ignore */ }

        revalidatePath('/dashboard')
        return { success: true }
    } catch (err: unknown) {
        console.error('updateAccountabilityStatus error:', err)
        const message = err instanceof Error ? err.message : 'Erro desconhecido'
        return { error: message }
    }
}

export async function saveAccountabilityDraft(params: {
    requestId: string
    accountabilityId: string | null
    objective: string
    activities: string
}): Promise<{ id?: string; error?: string }> {
    saveAccountabilityDraftSchema.parse(params)
    await requireAuth()

    const { databases } = createAdminClient()
    const dbId = process.env.APPWRITE_DATABASE_ID!

    if (params.accountabilityId) {
        await databases.updateDocument(dbId, 'prestacao_contas', params.accountabilityId, {
            objetivo_participacao: params.objective,
            atividades_realizadas: params.activities,
        })
        return { id: params.accountabilityId }
    }

    const doc = await databases.createDocument(dbId, 'prestacao_contas', ID.unique(), {
        solicitacao_id: params.requestId,
        objetivo_participacao: params.objective,
        atividades_realizadas: params.activities,
        status: 'rascunho',
    })

    return { id: doc.$id }
}

export async function getAccountabilityImages(accountabilityId: string): Promise<{ base64: string }[]> {
    const { databases, storage } = createAdminClient()
    const dbId = process.env.APPWRITE_DATABASE_ID!

    const { documents } = await databases.listDocuments(dbId, 'pc_arquivos', [])
    const files = documents.filter(f => f.prestacao_contas_id === accountabilityId)

    const imgFiles = files.filter(f => ['jpg', 'jpeg', 'png'].includes(f.tipo_arquivo?.toLowerCase?.() || ''))
    if (imgFiles.length === 0) return []

    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID

    const loaded = await Promise.all(
        imgFiles.map(async (f) => {
            try {
                const fileId = f.arquivo_url
                const url = `${endpoint}/storage/buckets/comprovantes/files/${fileId}/view?project=${projectId}`
                const resp = await fetch(url)
                if (!resp.ok) return null
                const arrayBuf = await resp.arrayBuffer()
                const mimeType = f.tipo_arquivo === 'png' ? 'image/png' : 'image/jpeg'
                const base64Buf = Buffer.from(arrayBuf).toString('base64')
                return { base64: `data:${mimeType};base64,${base64Buf}` }
            } catch {
                return null
            }
        })
    )

    return loaded.filter(Boolean) as { base64: string }[]
}
