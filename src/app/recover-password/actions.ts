'use server'

import { createClient, createAdminClient } from '@/lib/appwrite/server'
import { recoverPasswordSchema } from '@/lib/schemas'
import { Query } from 'node-appwrite'

export interface State {
    error?: string
    success?: string
}

export async function recoverPassword(prevState: State, formData: FormData): Promise<State> {
    const rawCpf = formData.get('cpf') as string
    const cpf = rawCpf.replace(/\D/g, '')

    const parsed = recoverPasswordSchema.safeParse({ cpf })
    if (!parsed.success) {
        return { error: parsed.error.issues[0].message }
    }

    try {
        // 1. Lookup email by CPF in usuarios collection
        const { databases } = createAdminClient()
        const { documents } = await databases.listDocuments(
            process.env.APPWRITE_DATABASE_ID!,
            'usuarios',
            [Query.equal('cpf', cpf), Query.limit(1)]
        )

        if (documents.length === 0) {
            return { error: 'Usuário não encontrado.' }
        }

        const user = documents[0] as any

        // 2. Send password reset via Appwrite recovery
        const { account } = await createClient()
        const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback?type=recovery`

        await account.createRecovery(user.email, redirectUrl)

        return { success: 'E-mail de recuperação enviado com sucesso! Verifique sua caixa de entrada.' }
    } catch (err: any) {
        console.error('Recover password error:', err?.message || 'Unknown error')
        return { error: 'Erro ao enviar e-mail de recuperação.' }
    }
}
