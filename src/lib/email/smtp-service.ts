import nodemailer from 'nodemailer'
import { createAdminClient } from '@/lib/appwrite/server'
import { Query } from 'node-appwrite'

export interface SmtpConfig {
    smtp_host: string
    smtp_port: number
    smtp_user: string
    smtp_password: string
    smtp_from_email: string
    smtp_from_name: string
    smtp_secure: boolean
    ativo: boolean
}

let smtpCache: { config: SmtpConfig; timestamp: number } | null = null
const SMTP_CACHE_TTL = 30_000

export async function getSmtpConfig(): Promise<SmtpConfig | null> {
    if (smtpCache && Date.now() - smtpCache.timestamp < SMTP_CACHE_TTL) {
        return smtpCache.config
    }

    try {
        const { databases } = createAdminClient()
        const { documents } = await databases.listDocuments(
            process.env.APPWRITE_DATABASE_ID!,
            'configuracoes_smtp',
            [Query.equal('ativo', true), Query.limit(1)]
        )

        if (documents.length === 0) return null

        const data = documents[0] as unknown as SmtpConfig
        smtpCache = { config: data, timestamp: Date.now() }
        return data
    } catch (e) {
        console.error('Erro ao buscar config SMTP:', e)
        return null
    }
}

export async function sendEmail(
    to: string,
    subject: string,
    html: string,
    solicitacaoId?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const config = await getSmtpConfig()
        if (!config) throw new Error('Configuração SMTP não encontrada')

        const transporter = nodemailer.createTransport({
            host: config.smtp_host,
            port: config.smtp_port,
            secure: config.smtp_secure,
            auth: {
                user: config.smtp_user,
                pass: config.smtp_password,
            },
        })

        await transporter.sendMail({
            from: `"${config.smtp_from_name}" <${config.smtp_from_email}>`,
            to,
            subject,
            html,
        })

        return { success: true }
    } catch (error: any) {
        console.error('Erro ao enviar e-mail:', error)
        return { success: false, error: error.message }
    }
}

export async function testSmtpConnection(): Promise<{ success: boolean; error?: string }> {
    const config = await getSmtpConfig()
    if (!config) return { success: false, error: 'Configuração SMTP não encontrada' }

    return testSmtpConnectionWithConfig({
        smtp_host: config.smtp_host,
        smtp_port: config.smtp_port,
        smtp_user: config.smtp_user,
        smtp_password: config.smtp_password,
        smtp_secure: config.smtp_secure,
    }, config.smtp_from_email)
}

export async function testSmtpConnectionWithConfig(
    config: { smtp_host: string; smtp_port: number; smtp_user: string; smtp_password: string; smtp_secure: boolean },
    to: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const transporter = nodemailer.createTransport({
            host: config.smtp_host,
            port: config.smtp_port,
            secure: config.smtp_secure,
            auth: {
                user: config.smtp_user,
                pass: config.smtp_password,
            },
        })

        await transporter.verify()
        await transporter.sendMail({
            from: `"Teste" <${to}>`,
            to,
            subject: 'Teste de Configuração SMTP',
            text: 'Este é um e-mail de teste. Sua configuração SMTP está funcionando corretamente!',
        })

        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
