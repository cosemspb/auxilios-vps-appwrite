'use server'

import { createClient } from '@/lib/appwrite/server'
import {
    getAutorizadaTemplate,
    getRejeitadaTemplate,
    getCanceladaTemplate,
    getComprovadaTemplate,
    getPrestacaoRejeitadaTemplate,
    getPreAprovadaTemplate,
    getNovaSolicitacaoTemplate,
    getInviteTemplate,
    getResetPasswordTemplate,
    getEmailSubject,
} from '@/lib/email/templates'
import { sendEmail as sendNotificationEmail, getSmtpConfig } from '@/lib/email/smtp-service'
import { TEMPLATES } from '@/lib/email/template-meta'
import { sendTestTemplateEmailSchema } from '@/lib/schemas'

async function getCurrentUserEmail(): Promise<string | null> {
    const { account } = createClient()
    try {
        const user = await account.get()
        return user.email || null
    } catch {
        return null
    }
}

export async function sendTestTemplateEmail(templateKey: string): Promise<{ success: boolean; error?: string }> {
    const parsed = sendTestTemplateEmailSchema.safeParse({ templateKey })
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0].message }
    }

    const email = await getCurrentUserEmail()
    if (!email) return { success: false, error: 'Usuário não autenticado.' }

    const meta = TEMPLATES.find(t => t.key === templateKey)
    if (!meta) return { success: false, error: `Template "${templateKey}" não encontrado.` }

    const sample = meta.sampleArgs

    const sampleRequest = {
        id: 'sample-00000000-0000-0000-0000-000000000000',
        protocolo: sample.protocolo || '250605-3A8F2',
        nome_evento: sample.nome_evento || 'Evento Teste',
        tipo_evento: sample.tipo_evento || 'Congresso',
        data_partida: sample.data_partida || '2026-06-15',
        data_retorno: sample.data_retorno || '2026-06-18',
        data_periodo_inicio: '2026-06-15',
        data_periodo_fim: '2026-06-18',
        valor_a_pagar: sample.valor_a_pagar ? parseFloat(sample.valor_a_pagar) : 1500,
        usuarios: {
            nome: sample.nome || 'João Silva',
            email: email,
        },
    }

    const motivo = sample.motivo || 'Motivo de exemplo para teste.'
    const cancelador = sample.cancelador || 'Maria Souza'
    const nomeConvite = sample.nome || 'João Silva'
    const emailConvite = sample.email || email
    const senhaTemp = sample.senha_temporaria || 'Cosems@2026!'
    const linkAcesso = sample.link_acesso || 'https://auxilios.cosemspb.org/login'
    const resetLink = sample.reset_link || 'https://auxilios.cosemspb.org/auth/update-password?token=test'

    let html: string
    let subject: string

    try {
        switch (templateKey) {
            case 'request_authorized':
                html = getAutorizadaTemplate(sampleRequest)
                subject = getEmailSubject(sampleRequest.protocolo, 'autorizada')
                break
            case 'request_rejected':
                html = getRejeitadaTemplate(sampleRequest, motivo)
                subject = getEmailSubject(sampleRequest.protocolo, 'rejeitada')
                break
            case 'request_cancelled':
                html = getCanceladaTemplate(sampleRequest, motivo, cancelador)
                subject = getEmailSubject(sampleRequest.protocolo, 'cancelada')
                break
            case 'accountability_approved':
                html = getComprovadaTemplate(sampleRequest)
                subject = getEmailSubject(sampleRequest.protocolo, 'concluida')
                break
            case 'accountability_rejected':
                html = getPrestacaoRejeitadaTemplate(sampleRequest, motivo)
                subject = getEmailSubject(sampleRequest.protocolo, 'em_retificacao')
                break
            case 'request_pre_approved':
                html = getPreAprovadaTemplate(sampleRequest)
                subject = getEmailSubject(sampleRequest.protocolo, 'pre_aprovada')
                break
            case 'new_request_notification':
                html = getNovaSolicitacaoTemplate(sampleRequest)
                subject = `Nova Solicitação de Auxílio | ${sampleRequest.protocolo}`
                break
            case 'user_invite':
                html = getInviteTemplate(nomeConvite, emailConvite, senhaTemp, linkAcesso)
                subject = 'Convite - Gestão de Auxílios COSEMS PB'
                break
            case 'password_reset':
                html = getResetPasswordTemplate(resetLink)
                subject = 'Recuperação de Senha - Gestão de Auxílios'
                break
            default:
                return { success: false, error: `Template "${templateKey}" não implementado.` }
        }
    } catch (err: any) {
        return { success: false, error: `Erro ao gerar template: ${err.message}` }
    }

    const smtpConfig = await getSmtpConfig()
    if (!smtpConfig?.ativo) {
        return { success: false, error: 'SMTP não configurado ou inativo. Configure o SMTP primeiro.' }
    }

    const testSubject = `[TESTE] ${subject}`
    try {
        await sendNotificationEmail(email, testSubject, html)
        return { success: true }
    } catch (err: any) {
        return { success: false, error: `Erro ao enviar e-mail de teste: ${err.message}` }
    }
}
