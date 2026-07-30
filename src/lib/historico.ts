'use server'

import { createAdminClient } from '@/lib/appwrite/server'
import { ID } from 'node-appwrite'

export async function registrarHistorico(
    solicitacaoId: string,
    statusAnterior: string | null,
    statusNovo: string,
    usuarioCpf: string,
    usuarioNome?: string,
    observacao?: string
) {
    const { databases } = createAdminClient()
    try {
        await databases.createDocument(
            process.env.APPWRITE_DATABASE_ID!,
            'historico_solicitacoes',
            ID.unique(),
            {
                solicitacao_id: solicitacaoId,
                status_anterior: statusAnterior,
                status_novo: statusNovo,
                usuario_cpf: usuarioCpf,
                usuario_nome: usuarioNome || null,
                observacao: observacao || null,
            }
        )
    } catch (error) {
        console.error('Erro ao registrar histórico:', error)
    }
}

export async function getCurrentProfile() {
    const { account, databases } = createAdminClient()
    try {
        const user = await account.get()
        if (!user) return null
        const { documents } = await databases.listDocuments(
            process.env.APPWRITE_DATABASE_ID!,
            'usuarios',
            []
        )
        const profile = documents.find(d => d.auth_id === user.$id)
        if (!profile) return null
        return { cpf: profile.cpf as string, nome: profile.nome as string }
    } catch {
        return null
    }
}
