'use server'

import { createClient, createAdminClient } from '@/lib/appwrite/server'
import { revalidatePath } from 'next/cache'
import { validateFile } from '@/lib/storage/validate-file'
import { updateProfileSchema, changePasswordSchema } from '@/lib/schemas'
import { ID, Query } from 'node-appwrite'

export interface ProfileState {
    error?: string
    success?: string
}

export async function updateProfile(prevState: ProfileState, formData: FormData): Promise<ProfileState> {
    const { account, databases } = await createClient()

    let user
    try {
        user = await account.get()
    } catch {
        return { error: 'Usuário não autenticado.' }
    }

    if (!user) {
        return { error: 'Usuário não autenticado.' }
    }

    const nome = formData.get('nome') as string
    const banco = formData.get('banco') as string
    const agencia = formData.get('agencia') as string
    const conta = formData.get('conta') as string
    const pix = formData.get('pix') as string
    const necessidades_especiais = formData.get('necessidades_especiais') as string
    const categoria_id = formData.get('categoria_id') as string
    const avatarFile = formData.get('avatar') as File

    try {
        updateProfileSchema.parse({
            nome,
            categoria_id: categoria_id ? parseInt(categoria_id) : null,
            necessidades_especiais,
        })
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Dados inválidos'
        return { error: msg }
    }

    let avatar_url: string | undefined

    if (avatarFile && avatarFile.size > 0) {
        const validation = validateFile(avatarFile, 'avatar')
        if (validation) return { error: validation.message }

        const { storage } = createAdminClient()
        const fileExt = avatarFile.name.split('.').pop()
        const filePath = `${user.$id}-${Math.random()}.${fileExt}`

        try {
            await storage.createFile('avatars', ID.unique(), avatarFile)
            const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT
            const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID
            avatar_url = `${endpoint}/storage/buckets/avatars/files/${filePath}/view?project=${projectId}`
        } catch (err: any) {
            console.error('Upload error:', err)
            return { error: `Erro ao fazer upload: ${err?.message || 'Erro desconhecido'}` }
        }
    }

    const dbId = process.env.APPWRITE_DATABASE_ID!

    let profileDoc: any = null
    try {
        const { documents } = await databases.listDocuments(dbId, 'usuarios', [])
        profileDoc = documents.find(d => d.auth_id === user.$id) || null
    } catch {
        return { error: 'Erro ao buscar perfil.' }
    }

    if (!profileDoc) {
        return { error: 'Perfil não encontrado.' }
    }

    const updateData: any = {
        nome,
        dados_bancarios: JSON.stringify({ banco, agencia, conta, pix }),
        necessidades_especiais,
        categoria_id: parseInt(categoria_id),
    }

    if (avatar_url) {
        updateData.avatar_url = avatar_url
    }

    try {
        await databases.updateDocument(dbId, 'usuarios', profileDoc.$id, updateData)
    } catch (err: any) {
        console.error('Profile update error:', err)
        return { error: 'Erro ao atualizar perfil.' }
    }

    revalidatePath('/dashboard/profile')
    revalidatePath('/dashboard')
    return { success: 'Perfil atualizado com sucesso!' }
}

export interface ChangePasswordState {
    error?: string
    success?: string
}

export async function changePassword(prevState: ChangePasswordState, formData: FormData): Promise<ChangePasswordState> {
    const { account } = await createClient()

    let user
    try {
        user = await account.get()
    } catch {
        return { error: 'Usuário não autenticado.' }
    }

    if (!user || !user.email) {
        return { error: 'Usuário não autenticado.' }
    }

    const currentPassword = formData.get('current_password') as string
    const newPassword = formData.get('new_password') as string
    const confirmPassword = formData.get('confirm_password') as string

    try {
        changePasswordSchema.parse({ currentPassword, newPassword, confirmPassword })
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Dados inválidos'
        return { error: msg }
    }

    if (newPassword !== confirmPassword) {
        return { error: 'A confirmação da nova senha não coincide.' }
    }

    try {
        await account.updatePassword(newPassword, currentPassword)
    } catch {
        return { error: 'Senha atual incorreta.' }
    }

    return { success: 'Senha alterada com sucesso!' }
}
