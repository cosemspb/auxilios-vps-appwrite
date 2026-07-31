'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient, createAdminClient, SESSION_COOKIE_NAME } from '@/lib/appwrite/server'
import { checkRateLimit, getRateLimitKey } from '@/lib/rate-limit'
import { loginSchema, completeRegistrationSchema } from '@/lib/schemas'
import { ID, Query } from 'node-appwrite'

export interface LoginState {
    error?: string
}

export async function login(prevState: LoginState, formData: FormData): Promise<LoginState> {
    const rawEmail = (formData.get('email') as string)?.toLowerCase().trim()
    const rawPassword = formData.get('password') as string

    const parsed = loginSchema.safeParse({ email: rawEmail, password: rawPassword })
    if (!parsed.success) {
        return { error: parsed.error.issues[0].message }
    }

    const { email, password } = parsed.data

    const key = getRateLimitKey(email, 'login')
    const { allowed } = checkRateLimit(key, { maxRequests: 5 })
    if (!allowed) return { error: 'Muitas tentativas de login. Aguarde 1 minuto.' }

    const { account } = await createClient()

    let session
    try {
        session = await account.createEmailPasswordSession(email, password)
    } catch (err: any) {
        console.error('Login error:', err?.message || 'Unknown error')
        return { error: 'Falha na autenticação. Verifique suas credenciais.' }
    }

    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE_NAME, session.secret, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        expires: new Date(session.expire),
    })

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function logout() {
    const { account } = await createClient()
    try {
        await account.deleteSession('current')
    } catch {}
    const cookieStore = await cookies()
    cookieStore.delete(SESSION_COOKIE_NAME)
    revalidatePath('/', 'layout')
    redirect('/login')
}

export interface CompleteRegistrationState {
    error?: string
    success?: string
}

export async function completeRegistration(prevState: CompleteRegistrationState, formData: FormData): Promise<CompleteRegistrationState> {
    const { account, databases } = await createClient()

    let user
    try {
        user = await account.get()
    } catch {
        return { error: 'Usuário não autenticado.' }
    }

    const key = getRateLimitKey(user.$id, 'complete-registration')
    const { allowed } = checkRateLimit(key, { maxRequests: 3 })
    if (!allowed) return { error: 'Muitas tentativas. Aguarde 1 minuto.' }

    const rawForm = {
        cpf: (formData.get('cpf') as string)?.replace(/\D/g, ''),
        whatsapp: (formData.get('whatsapp') as string)?.replace(/\D/g, ''),
        password: formData.get('password') as string,
        passwordConfirm: formData.get('passwordConfirm') as string,
        categoria_id: formData.get('categoria_id') as string,
        banco: formData.get('banco') as string || null,
        agencia: formData.get('agencia') as string || null,
        conta: formData.get('conta') as string || null,
        pix: formData.get('pix') as string || null,
    }

    const parsed = completeRegistrationSchema.safeParse(rawForm)
    if (!parsed.success) {
        return { error: parsed.error.issues[0].message }
    }

    const { cpf, whatsapp: rawWhatsapp, password, categoria_id: categoriaId, banco, agencia, conta, pix } = parsed.data

    try {
        // Update user password
        await account.updatePassword(password, '')

        // Update user preferences with profile data
        const prefs = {
            cpf,
            whatsapp: rawWhatsapp,
            categoria_id: categoriaId,
            banco: banco || '',
            agencia: agencia || '',
            conta: conta || '',
            pix: pix || '',
            status: 'completo',
        }
        await account.updatePrefs(prefs)

        // Create user document in usuarios collection
        try {
            await databases.createDocument(
                process.env.APPWRITE_DATABASE_ID!,
                'usuarios',
                ID.unique(),
                {
                    auth_id: user.$id,
                    nome: user.name,
                    email: user.email,
                    cpf,
                    whatsapp: rawWhatsapp,
                    tipo_perfil_id: 1,
                    categoria_id: Number(categoriaId),
                    status: 'completo',
                    banco: banco || null,
                    agencia: agencia || null,
                    conta: conta || null,
                    pix: pix || null,
                    created_at: new Date().toISOString(),
                }
            )
        } catch (docErr) {
            console.error('Error creating user document:', docErr)
        }
    } catch (err: any) {
        console.error('Complete registration error:', err?.message || 'Unknown error')
        return { error: 'Erro ao completar cadastro. Tente novamente.' }
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}
