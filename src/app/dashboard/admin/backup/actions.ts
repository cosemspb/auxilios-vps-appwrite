'use server'

import { createClient, createAdminClient } from '@/lib/appwrite/server'
import { revalidatePath } from 'next/cache'
import { saveScheduleSchema, backupHistorySchema } from '@/lib/schemas'
import { Query } from 'node-appwrite'

export async function getBackupHistory(page = 1, limit = 10) {
    try {
        const parsed = backupHistorySchema.safeParse({ page, pageSize: limit })
        if (!parsed.success) throw new Error(parsed.error.issues[0].message)

        const { databases } = createAdminClient()
        const dbId = process.env.APPWRITE_DATABASE_ID!

        const offset = (page - 1) * limit
        const { documents, total } = await databases.listDocuments(dbId, 'historico_backups', [
            Query.limit(limit),
            Query.offset(offset),
        ])

        return {
            data: documents || [],
            total: total,
            totalPages: Math.ceil(total / limit),
        }
    } catch (e: any) {
        console.error('Erro ao buscar histórico:', e)
        return { data: [], total: 0, totalPages: 0 }
    }
}

export async function executeBackup() {
    try {
        const { account, databases } = createClient()

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
            return { success: false, message: 'Apenas administradores podem executar backup.' }
        }

        const { runFullBackup } = await import('@/lib/backup/backup-service')
        const result = await runFullBackup()

        revalidatePath('/dashboard/admin/backup')
        return result
    } catch (e: any) {
        return { success: false, message: 'Erro ao executar backup.', error: e.message }
    }
}

export async function getSchedule() {
    try {
        const { databases } = createAdminClient()
        const dbId = process.env.APPWRITE_DATABASE_ID!

        const { documents } = await databases.listDocuments(dbId, 'config_backup', [Query.limit(1)])

        if (documents.length === 0) {
            return { horario: '03:00', habilitado: false, ultima_execucao: null }
        }

        return documents[0] || { horario: '03:00', habilitado: false, ultima_execucao: null }
    } catch (e: any) {
        console.error('Erro ao buscar agendamento:', e)
        return { horario: '03:00', habilitado: false, ultima_execucao: null }
    }
}

export async function saveSchedule(horario: string, habilitado: boolean) {
    try {
        const parsed = saveScheduleSchema.safeParse({ horario, habilitado })
        if (!parsed.success) {
            return { success: false, message: parsed.error.issues[0].message }
        }

        const { account, databases } = createClient()

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
            return { success: false, message: 'Apenas administradores podem configurar o agendamento.' }
        }

        const { databases: adminDb } = createAdminClient()
        const { documents } = await adminDb.listDocuments(dbId, 'config_backup', [Query.limit(1)])

        if (documents.length > 0) {
            await adminDb.updateDocument(dbId, 'config_backup', documents[0].$id, {
                horario,
                habilitado,
                updated_at: new Date().toISOString(),
            })
        } else {
            const { ID } = await import('node-appwrite')
            await adminDb.createDocument(dbId, 'config_backup', ID.unique(), {
                horario,
                habilitado,
                updated_at: new Date().toISOString(),
            })
        }

        revalidatePath('/dashboard/admin/backup')
        return { success: true, message: 'Agendamento salvo.' }
    } catch (e: any) {
        return { success: false, message: 'Erro ao salvar agendamento.', error: e.message }
    }
}
