'use server'

import { createAdminClient } from '@/lib/appwrite/server'
import { sendEmail } from '@/lib/email/smtp-service'
import { getResetPasswordTemplate, getInviteTemplate } from '@/lib/email/templates'
import { checkRateLimit, getRateLimitKey } from '@/lib/rate-limit'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { requestPasswordResetSchema, updatePasswordSchema } from '@/lib/schemas'
import { ID, Query } from 'node-appwrite'
import crypto from 'crypto'

/**
 * Solicita redefinição de senha
 */
export async function requestPasswordReset(email: string) {
    requestPasswordResetSchema.parse({ email })

    const key = getRateLimitKey(email, 'password-reset')
    const { allowed } = checkRateLimit(key, { maxRequests: 3 })
    if (!allowed) return { success: false, message: 'Muitas tentativas. Aguarde 1 minuto para tentar novamente.' }

    try {
        const headersList = await headers()
        const host = headersList.get('host') || 'auxilio.cosemspb.org'
        const proto = headersList.get('x-forwarded-proto') || 'https'
        const appUrl = `${proto}://${host}`

        // Appwrite handles recovery token generation and email sending
        // We use the SDK to create a recovery session
        const { account } = createAdminClient()

        // Verify user exists by trying to get their account
        // In Appwrite we can't list users by email easily from the client SDK,
        // but createRecovery will fail silently if email doesn't exist
        const redirectUrl = `${appUrl}/auth/callback?type=recovery`

        // Use Appwrite's built-in recovery mechanism
        try {
            await account.createRecovery(email, redirectUrl)
        } catch {
            // Appwrite may throw if email not found - we still return success
            // to avoid user enumeration
        }

        return { success: true, message: 'Se o e-mail estiver cadastrado, você receberá um link de recuperação.' }

    } catch (error) {
        console.error('Erro ao solicitar reset de senha:', error)
        return { success: false, message: 'Ocorreu um erro ao processar sua solicitação.' }
    }
}

/**
 * Atualiza a senha do usuário (requer sessão autenticada via link de recuperação)
 */
export async function updatePassword(password: string) {
    updatePasswordSchema.parse({ password })

    const key = getRateLimitKey('global', 'update-password')
    const { allowed } = checkRateLimit(key, { maxRequests: 5 })
    if (!allowed) return { success: false, message: 'Muitas tentativas. Aguarde 1 minuto.' }

    try {
        const { account } = createAdminClient()

        // Assume user is authenticated via session cookies - need current user
        // For Appwrite, we need to create a user-bound client, not admin
        // Let's create a regular server client
        const { createClient } = await import('@/lib/appwrite/server')
        const { account: userAccount } = createClient()

        await userAccount.updatePassword(password, '')

        return { success: true, message: 'Senha atualizada com sucesso!' }

    } catch (error) {
        console.error('Erro ao atualizar senha:', error)
        return { success: false, message: 'Erro ao atualizar senha. O link pode ter expirado.' }
    }
}

/**
 * Invite a new user
 */
interface InviteUserInput {
    nome: string
    email: string
    tipo_perfil_id: number
    categoria_id: number | null
}

export async function inviteUser(formData: FormData | InviteUserInput) {
    const raw = formData instanceof FormData ? {
        nome: formData.get('nome') as string,
        email: (formData.get('email') as string)?.toLowerCase().trim(),
        tipo_perfil_id: Number(formData.get('tipo_perfil_id')),
        categoria_id: formData.has('categoria_id') ? Number(formData.get('categoria_id')) : null,
    } : { ...formData, email: formData.email.toLowerCase().trim() }

    if (!raw.nome || !raw.email || !raw.tipo_perfil_id) {
        return { success: false, message: 'Preencha todos os campos obrigatórios.' }
    }

    try {
        const { users, databases } = createAdminClient()
        const tempPassword = crypto.randomBytes(4).toString('hex')

        // 1. Create the Appwrite user
        const newUser = await users.create(
            ID.unique(),
            raw.email,
            undefined,
            tempPassword,
            raw.nome
        )

        // 2. Create the user document in usuarios collection
        const userData: Record<string, any> = {
            auth_id: newUser.$id,
            nome: raw.nome,
            email: raw.email,
            tipo_perfil_id: raw.tipo_perfil_id,
            cpf: `temp_${Date.now()}`,
            status: 'pendente',
            categoria_id: raw.categoria_id || null,
            created_at: new Date().toISOString(),
        }

        await databases.createDocument(
            process.env.APPWRITE_DATABASE_ID!,
            'usuarios',
            ID.unique(),
            userData
        )

        // 3. Send invite email
        const headersList = await headers()
        const host = headersList.get('host') || 'auxilio.cosemspb.org'
        const proto = headersList.get('x-forwarded-proto') || 'https'
        const appUrl = `${proto}://${host}`

        const html = getInviteTemplate(raw.nome, raw.email, tempPassword, `${appUrl}/login`)
        await sendEmail(raw.email, 'Convite | Gestão de Auxílios', html)

        revalidatePath('/dashboard/admin/management', 'page')
        return { success: true, message: 'Usuário convidado com sucesso!' }

    } catch (error: any) {
        console.error('Erro ao convidar usuário:', error)
        return { success: false, message: error?.message || 'Erro ao convidar usuário.' }
    }
}

/**
 * List users
 */
export async function getUsersList(page = 1, pageSize = 20) {
    try {
        const { databases } = createAdminClient()

        const offset = (page - 1) * pageSize

        const { documents, total } = await databases.listDocuments(
            process.env.APPWRITE_DATABASE_ID!,
            'usuarios',
            [
                Query.limit(pageSize),
                Query.offset(offset),
                Query.orderDesc('created_at'),
            ]
        )

        return {
            success: true,
            data: documents,
            total: total as number,
            page,
            pageSize,
        }
    } catch (error: any) {
        console.error('Erro ao listar usuários:', error)
        return { success: false, message: error?.message || 'Erro ao listar usuários.' }
    }
}

/**
 * Reset user password (admin)
 */
export async function resetUserPassword(formData: FormData) {
    const userId = formData.get('userId') as string
    if (!userId) return { success: false, message: 'ID do usuário é obrigatório.' }

    try {
        const { users } = createAdminClient()
        const tempPassword = crypto.randomBytes(4).toString('hex')

        await users.updatePassword(userId, tempPassword)

        return { success: true, message: `Senha redefinida com sucesso! Nova senha: ${tempPassword}`, tempPassword }

    } catch (error: any) {
        console.error('Erro ao redefinir senha:', error)
        return { success: false, message: error?.message || 'Erro ao redefinir senha.' }
    }
}

/**
 * Update user profile (admin)
 */
export async function updateUserProfile(formData: FormData) {
    const userId = formData.get('userId') as string
    if (!userId) return { success: false, message: 'ID do usuário é obrigatório.' }

    try {
        const { databases, users } = createAdminClient()
        const updateData: Record<string, any> = {}

        const nome = formData.get('nome') as string
        const email = formData.get('email') as string
        const whatsapp = formData.get('whatsapp') as string
        const tipo_perfil_id = formData.get('tipo_perfil_id') as string
        const status = formData.get('status') as string
        const categoria_id = formData.get('categoria_id') as string

        if (nome) updateData.nome = nome
        if (whatsapp) updateData.whatsapp = whatsapp
        if (tipo_perfil_id) updateData.tipo_perfil_id = Number(tipo_perfil_id)
        if (status) updateData.status = status
        if (categoria_id) updateData.categoria_id = Number(categoria_id)

        if (nome || email) {
            try {
                if (nome) {
                    await users.updateName(userId, nome)
                }
                if (email) {
                    await users.updateEmail(userId, email)
                }
            } catch (e) {
                console.error('Error updating Appwrite user:', e)
            }
        }

        // Update the database document
        // Find document by auth_id
        const { documents } = await databases.listDocuments(
            process.env.APPWRITE_DATABASE_ID!,
            'usuarios',
            [Query.equal('auth_id', userId)]
        )

        if (documents.length > 0) {
            await databases.updateDocument(
                process.env.APPWRITE_DATABASE_ID!,
                'usuarios',
                documents[0].$id,
                updateData
            )
        }

        revalidatePath('/dashboard/admin/management', 'page')
        return { success: true, message: 'Perfil atualizado com sucesso!' }

    } catch (error: any) {
        console.error('Erro ao atualizar perfil:', error)
        return { success: false, message: error?.message || 'Erro ao atualizar perfil.' }
    }
}

export async function diagnosticLogin(email: string, password: string) {
    try {
        const { createClient } = await import('@/lib/appwrite/server')
        const { account } = createClient()
        const session = await account.createEmailPasswordSession(email, password)
        await account.deleteSession(session.$id)
        return { success: true, message: 'Login OK' }
    } catch (error: any) {
        return { success: false, message: error?.message || 'Erro de autenticação' }
    }
}
