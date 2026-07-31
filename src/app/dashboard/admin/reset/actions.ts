'use server'

import { createClient, createAdminClient } from '@/lib/appwrite/server'
import { revalidatePath } from 'next/cache'
import { ID, Query } from 'node-appwrite'

const COLLECTIONS_TO_CLEAR = [
    'solicitacoes',
    'prestacao_contas',
    'pc_arquivos',
    'custos',
    'deslocamentos',
    'historico_solicitacoes',
    'historico_backups',
    'historico_emails',
    'recuperacao_senhas',
]

export async function cleanForLaunch() {
    try {
        if (process.env.ALLOW_DB_RESET !== 'true') {
            return {
                success: false,
                message: 'Limpeza desabilitada. Defina ALLOW_DB_RESET=true no .env.local para permitir.',
            }
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
            return { success: false, message: 'Apenas administradores podem limpar o banco.' }
        }

        const { databases: adminDb } = createAdminClient()

        for (const collection of COLLECTIONS_TO_CLEAR) {
            try {
                let deleted = 0
                while (true) {
                    const { documents } = await adminDb.listDocuments(dbId, collection, [Query.limit(100)])
                    if (documents.length === 0) break
                    for (const doc of documents) {
                        try {
                            await adminDb.deleteDocument(dbId, collection, doc.$id)
                            deleted++
                        } catch {
                            // continue
                        }
                    }
                }
                console.log(`Cleaned ${deleted} docs from ${collection}`)
            } catch (e) {
                console.error(`Erro ao limpar ${collection}:`, e)
            }
        }

        try {
            const { storage } = createAdminClient()
            await storage.deleteBucket('comprovantes')
        } catch {
            // bucket might not exist
        }

        revalidatePath('/', 'layout')

        return {
            success: true,
            message: 'Banco limpo para lançamento! Dados transacionais removidos, usuários e configurações preservados.',
        }
    } catch (e: any) {
        console.error('Clean error:', e)
        return {
            success: false,
            message: 'Erro interno ao limpar banco de dados.',
        }
    }
}

export async function resetDatabase() {
    try {
        if (process.env.ALLOW_DB_RESET !== 'true') {
            return {
                success: false,
                message: 'Reset de banco desabilitado. Defina ALLOW_DB_RESET=true no .env.local para permitir.',
            }
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
            return { success: false, message: 'Apenas administradores podem resetar o banco.' }
        }

        const { databases: adminDb } = createAdminClient()

        for (const collection of COLLECTIONS_TO_CLEAR) {
            try {
                while (true) {
                    const { documents } = await adminDb.listDocuments(dbId, collection, [Query.limit(100)])
                    if (documents.length === 0) break
                    for (const doc of documents) {
                        try {
                            await adminDb.deleteDocument(dbId, collection, doc.$id)
                        } catch {
                            // continue
                        }
                    }
                }
            } catch (e) {
                console.error(`Erro ao limpar ${collection}:`, e)
            }
        }

        revalidatePath('/', 'layout')

        return {
            success: true,
            message: 'Banco de dados resetado com sucesso!',
        }
    } catch (e: any) {
        console.error('Reset error:', e)
        return {
            success: false,
            message: 'Erro interno ao resetar banco de dados.',
        }
    }
}
