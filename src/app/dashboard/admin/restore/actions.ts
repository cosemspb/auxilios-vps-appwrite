'use server'

import { createClient, createAdminClient } from '@/lib/appwrite/server'
import { revalidatePath } from 'next/cache'
import { executeRestoreSchema, restorePreviewSchema } from '@/lib/schemas'

export async function getBackups() {
    try {
        const { listBackups } = await import('@/lib/backup/restore-service')
        return await listBackups()
    } catch (e: any) {
        console.error('Erro ao listar backups:', e)
        return []
    }
}

export async function getPreview(timestamp: string) {
    try {
        const parsed = restorePreviewSchema.safeParse({ timestamp })
        if (!parsed.success) {
            return {
                backup: { timestamp, date: '', jsonFile: null, jsonSize: 0, storageBuckets: [] },
                collections: [],
                dbWarning: parsed.error.issues[0].message,
            }
        }

        const { previewRestore } = await import('@/lib/backup/restore-service')
        return await previewRestore(timestamp)
    } catch (e: any) {
        return {
            backup: { timestamp, date: '', jsonFile: null, jsonSize: 0, storageBuckets: [] },
            collections: [],
            dbWarning: 'Erro ao carregar preview: ' + e.message,
        }
    }
}

export async function executeRestore(timestamp: string) {
    try {
        const parsed = executeRestoreSchema.safeParse({ timestamp })
        if (!parsed.success) {
            return { success: false, message: parsed.error.issues[0].message }
        }

        const { account, databases } = await createClient()

        let user
        try {
            user = await account.get()
        } catch {
            return { success: false, message: 'Não autenticado.' }
        }

        if (!user) {
            return { success: false, message: 'Não autenticado.' }
        }

        const dbId = process.env.APPWRITE_DATABASE_ID!

        let profile: any = null
        try {
            const { documents } = await databases.listDocuments(dbId, 'usuarios', [])
            profile = documents.find(d => d.auth_id === user.$id) || null
        } catch {
            // ignore
        }

        if (!profile || profile.tipo_perfil_id < 4) {
            return { success: false, message: 'Apenas administradores podem restaurar backup.' }
        }

        const { runFullRestore } = await import('@/lib/backup/restore-service')
        const result = await runFullRestore(timestamp)

        revalidatePath('/dashboard/admin/restore')
        revalidatePath('/dashboard/admin/backup')
        return result
    } catch (e: any) {
        return { success: false, message: 'Erro ao restaurar backup.', error: e.message }
    }
}
