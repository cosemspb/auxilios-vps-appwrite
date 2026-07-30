'use server'

import { createAdminClient } from '@/lib/appwrite/server'
import { revalidatePath } from 'next/cache'
import { updateSystemSettingsSchema } from '@/lib/schemas'

export type SystemSettings = {
    id: string
    fonte_padrao: string
    updated_at: string
}

export async function getSystemSettings(): Promise<SystemSettings | null> {
    const { databases } = createAdminClient()
    const dbId = process.env.APPWRITE_DATABASE_ID!

    try {
        const doc = await databases.getDocument(dbId, 'configuracoes_sistema', '1')
        return {
            id: doc.$id,
            fonte_padrao: doc.fonte_padrao,
            updated_at: doc.updated_at,
        }
    } catch {
        return null
    }
}

export async function updateSystemSettings(fontePadrao: string) {
    try {
        updateSystemSettingsSchema.parse({ fontePadrao })

        const { databases } = createAdminClient()
        const dbId = process.env.APPWRITE_DATABASE_ID!

        try {
            await databases.updateDocument(dbId, 'configuracoes_sistema', '1', {
                fonte_padrao: fontePadrao,
                updated_at: new Date().toISOString(),
            })
        } catch {
            await databases.createDocument(dbId, 'configuracoes_sistema', '1', {
                fonte_padrao: fontePadrao,
                updated_at: new Date().toISOString(),
            })
        }

        revalidatePath('/')
        return { success: true }
    } catch (error: any) {
        return { success: false, message: error?.message || 'Erro ao salvar configurações' }
    }
}
