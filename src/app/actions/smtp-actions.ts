'use server'

import { createAdminClient } from '@/lib/appwrite/server'
import { encryptPassword, maskPassword } from '@/lib/email/encryption'
import { testSmtpConnection } from '@/lib/email/smtp-service'
import { revalidatePath } from 'next/cache'
import { saveSmtpConfigSchema, testSmtpConfigActionSchema, toggleSmtpActiveSchema } from '@/lib/schemas'

export interface SmtpConfigInput {
    smtp_host: string
    smtp_port: number
    smtp_user: string
    smtp_password: string
    smtp_from_email: string
    smtp_from_name: string
    smtp_secure: boolean
    emails_notificacao_novos_pedidos?: string
    emails_notificacao_rede?: string
    test_email_config?: string
}

export async function saveSmtpConfig(config: SmtpConfigInput) {
    try {
        saveSmtpConfigSchema.parse(config)

        const { databases } = createAdminClient()
        const dbId = process.env.APPWRITE_DATABASE_ID!

        const { documents } = await databases.listDocuments(dbId, 'configuracoes_smtp', [])
        const existing = documents[0]

        const isPasswordMasked = config.smtp_password.includes('*')

        let encryptedPassword: string | undefined
        if (!isPasswordMasked && config.smtp_password) {
            encryptedPassword = encryptPassword(config.smtp_password)
        }

        if (existing) {
            const updateData: any = {
                smtp_host: config.smtp_host,
                smtp_port: config.smtp_port,
                smtp_user: config.smtp_user,
                smtp_from_email: config.smtp_from_email,
                smtp_from_name: config.smtp_from_name,
                smtp_secure: config.smtp_secure,
                emails_notificacao_novos_pedidos: config.emails_notificacao_novos_pedidos,
                emails_notificacao_rede: config.emails_notificacao_rede,
                test_email_config: config.test_email_config,
                data_atualizacao: new Date().toISOString(),
            }

            if (encryptedPassword) {
                updateData.smtp_password = encryptedPassword
            }

            await databases.updateDocument(dbId, 'configuracoes_smtp', existing.$id, updateData)
        } else {
            if (!encryptedPassword) {
                return { success: false, error: 'Senha é obrigatória para nova configuração' }
            }

            await databases.createDocument(dbId, 'configuracoes_smtp', 'unique()', {
                smtp_host: config.smtp_host,
                smtp_port: config.smtp_port,
                smtp_user: config.smtp_user,
                smtp_password: encryptedPassword,
                smtp_from_email: config.smtp_from_email,
                smtp_from_name: config.smtp_from_name,
                smtp_secure: config.smtp_secure,
                emails_notificacao_novos_pedidos: config.emails_notificacao_novos_pedidos,
                emails_notificacao_rede: config.emails_notificacao_rede,
                test_email_config: config.test_email_config,
                ativo: true,
            })
        }

        revalidatePath('/dashboard/admin/settings/smtp')
        return { success: true }
    } catch (error: any) {
        console.error('Erro ao salvar configuração SMTP:', error)
        return { success: false, error: error.message }
    }
}

export async function getSmtpConfigForDisplay() {
    try {
        const { databases } = createAdminClient()
        const dbId = process.env.APPWRITE_DATABASE_ID!

        const { documents } = await databases.listDocuments(dbId, 'configuracoes_smtp', [])
        const data = documents[0]

        if (!data) {
            return { success: true, data: null }
        }

        try {
            const { decryptPassword } = await import('@/lib/email/encryption')
            const decrypted = decryptPassword(data.smtp_password)
            data.smtp_password = maskPassword(decrypted)
        } catch {
            data.smtp_password = '***'
        }

        return { success: true, data }
    } catch (error: any) {
        console.error('Erro ao buscar configuração SMTP:', error)
        return { success: false, error: error.message }
    }
}

export async function testSmtpConfigAction(config?: {
    smtp_host: string
    smtp_port: number
    smtp_user: string
    smtp_password: string
    smtp_secure: boolean
}, to?: string) {
    testSmtpConfigActionSchema.parse({ config, to })

    try {
        let result

        if (config) {
            const { testSmtpConnectionWithConfig } = await import('@/lib/email/smtp-service')
            result = await testSmtpConnectionWithConfig(config, to || config.smtp_user)
        } else {
            result = await testSmtpConnection()
        }

        return result
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function toggleSmtpActive(ativo: boolean) {
    toggleSmtpActiveSchema.parse({ ativo })

    try {
        const { databases } = createAdminClient()
        const dbId = process.env.APPWRITE_DATABASE_ID!

        const { documents } = await databases.listDocuments(dbId, 'configuracoes_smtp', [])
        if (documents[0]) {
            await databases.updateDocument(dbId, 'configuracoes_smtp', documents[0].$id, {
                ativo,
                data_atualizacao: new Date().toISOString(),
            })
        }

        revalidatePath('/dashboard/admin/settings/smtp')
        return { success: true }
    } catch (error: any) {
        console.error('Erro ao alterar status SMTP:', error)
        return { success: false, error: error.message }
    }
}
