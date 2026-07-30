import { escapeHtml } from '@/lib/email/utils'
import { formatDate } from '@/lib/format-utils'

interface Request {
    protocolo?: string
    id: string
    nome_evento: string
    tipo_evento: string
    data_partida?: string
    data_retorno?: string
    data_periodo_inicio?: string
    data_periodo_fim?: string
    valor_a_pagar?: number
    usuarios?: {
        nome: string
        email: string
    }
}

function getBaseTemplate(content: string): string {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const year = new Date().getFullYear()

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gestão de Auxílios - COSEMS PB</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#334155;">
    <style>
        .card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .info-row { padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
        .info-label { font-weight: bold; color: #64748b; }
        .info-value { color: #1e293b; }
        .status-badge { display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 14px; font-weight: 600; margin: 10px 0; }
        .status-comprovada { background: #dbeafe; color: #1e40af; }
    </style>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f1f5f9;min-width:100%;">
        <tr>
            <td align="center" style="padding:40px 16px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1),0 2px 4px -2px rgba(0,0,0,0.1);">
                    <tr>
                        <td style="padding:32px 40px 24px 40px;border-bottom:1px solid #e2e8f0;">
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                                <tr>
                                    <td align="left">
                                        <img src="https://cosemspb.org/wp-content/uploads/2024/01/cosemspb_logo2024.png" alt="COSEMS PB" width="128" style="display:block;border:0;width:128px;" />
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:32px 40px;font-size:15px;color:#334155;">
                            ${content}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:24px 40px 32px 40px;border-top:1px solid #e2e8f0;text-align:center;font-size:12px;color:#94a3b8;">
                            <p style="margin:0 0 4px 0;">Este é um e-mail automático. Por favor, não responda.</p>
                            <p style="margin:0 0 4px 0;">&copy; ${year} COSEMS PB - Todos os direitos reservados</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim()
}

export function getAutorizadaTemplate(request: Request): string {
    const protocolo = escapeHtml(request.protocolo || request.id.slice(0, 8))
    const nome = escapeHtml(request.usuarios?.nome || 'Solicitante')
    const nomeEvento = escapeHtml(request.nome_evento)
    const tipoEvento = escapeHtml(request.tipo_evento)
    const dataPartida = request.data_partida
        ? formatDate(request.data_partida)
        : request.data_periodo_inicio
            ? formatDate(request.data_periodo_inicio)
            : 'N/A'
    const dataRetorno = request.data_retorno
        ? formatDate(request.data_retorno)
        : request.data_periodo_fim
            ? formatDate(request.data_periodo_fim)
            : 'N/A'
    const valorAprovado = request.valor_a_pagar
        ? `R$ ${request.valor_a_pagar.toFixed(2).replace('.', ',')}`
        : 'R$ 0,00'

    const content = `
        <h2>Solicitação Autorizada!</h2>
        <p>Olá, ${nome},</p>
        <p>Temos uma ótima notícia! Sua solicitação de auxílio foi <strong>AUTORIZADA</strong>.</p>
        
        <div class="card">
            <div class="info-row">
                <span class="info-label">Protocolo:</span> <span class="info-value">${protocolo}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Evento:</span> <span class="info-value">${nomeEvento}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Tipo:</span> <span class="info-value">${tipoEvento}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Data de Partida:</span> <span class="info-value">${dataPartida}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Data de Retorno:</span> <span class="info-value">${dataRetorno}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Valor Aprovado:</span> <span class="info-value" style="font-size: 18px; font-weight: bold; color: #059669;">${valorAprovado}</span>
            </div>
        </div>

        <p><strong>Próximos passos:</strong></p>
        <ul>
            <li>O valor será processado conforme os procedimentos internos</li>
            <li>Após o evento, você deverá prestar contas em até 5 dias úteis após o retorno</li>
            <li>Acesse o sistema para acompanhar o status</li>
        </ul>
    `

    return getBaseTemplate(content)
}

export function getRejeitadaTemplate(request: Request, motivo: string): string {
    const protocolo = escapeHtml(request.protocolo || request.id.slice(0, 8))
    const nome = escapeHtml(request.usuarios?.nome || 'Solicitante')
    const nomeEvento = escapeHtml(request.nome_evento)
    const motivoEscaped = escapeHtml(motivo)

    const content = `
        <h2>Solicitação Não Aprovada</h2>
        <p>Olá, ${nome},</p>
        <p>Informamos que sua solicitação de auxílio <strong>NÃO FOI APROVADA</strong>.</p>
        
        <div class="card" style="margin-bottom: 16px;">
            <div class="info-row">
                <span class="info-label">Protocolo:</span> <span class="info-value">${protocolo}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Evento:</span> <span class="info-value">${nomeEvento}</span>
            </div>
        </div>

        <div class="card" style="background: #fef2f2; border-left: 4px solid #dc2626;">
            <p style="margin: 0;"><strong>Motivo da recusa:</strong></p>
            <p style="margin: 10px 0 0 0;">${motivoEscaped}</p>
        </div>

        <p>Caso tenha dúvidas, entre em contato com o setor responsável.</p>
    `

    return getBaseTemplate(content)
}

export function getCanceladaTemplate(request: Request, motivo: string, canceladoPor: string): string {
    const protocolo = escapeHtml(request.protocolo || request.id.slice(0, 8))
    const nome = escapeHtml(request.usuarios?.nome || 'Solicitante')
    const nomeEvento = escapeHtml(request.nome_evento)
    const motivoEscaped = escapeHtml(motivo)
    const cancelador = escapeHtml(canceladoPor)

    const content = `
        <h2>Solicitação Cancelada</h2>
        <p>Olá, ${nome},</p>
        <p>Informamos que sua solicitação de auxílio foi <strong>CANCELADA</strong>.</p>
        
        <div class="card" style="margin-bottom: 16px;">
            <div class="info-row">
                <span class="info-label">Protocolo:</span> <span class="info-value">${protocolo}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Evento:</span> <span class="info-value">${nomeEvento}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Cancelado por:</span> <span class="info-value">${cancelador}</span>
            </div>
        </div>

        <div class="card" style="background: #fef2f2; border-left: 4px solid #dc2626;">
            <p style="margin: 0;"><strong>Motivo do cancelamento:</strong></p>
            <p style="margin: 10px 0 0 0;">${motivoEscaped}</p>
        </div>

        <p>Caso tenha dúvidas, entre em contato com o setor responsável.</p>
    `

    return getBaseTemplate(content)
}

export function getComprovadaTemplate(request: Request): string {
    const protocolo = escapeHtml(request.protocolo || request.id.slice(0, 8))
    const nome = escapeHtml(request.usuarios?.nome || 'Solicitante')
    const nomeEvento = escapeHtml(request.nome_evento)

    const content = `
        <h2>Prestação de Contas Aprovada!</h2>
        <p>Olá, ${nome},</p>
        <p>Sua prestação de contas foi <strong>APROVADA</strong>. O processo está concluído!</p>
        
        <div class="card">
            <div class="info-row">
                <span class="info-label">Protocolo:</span> <span class="info-value">${protocolo}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Evento:</span> <span class="info-value">${nomeEvento}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Status:</span> <span class="status-badge status-comprovada">COMPROVADA</span>
            </div>
        </div>

        <p>Agradecemos pela participação e pela prestação de contas dentro do prazo!</p>
    `

    return getBaseTemplate(content)
}

export function getPrestacaoRejeitadaTemplate(request: Request, motivo: string): string {
    const protocolo = escapeHtml(request.protocolo || request.id.slice(0, 8))
    const nome = escapeHtml(request.usuarios?.nome || 'Solicitante')
    const nomeEvento = escapeHtml(request.nome_evento)
    const motivoEscaped = escapeHtml(motivo)

    const content = `
        <h2>Prestação de Contas Necessita Retificação</h2>
        <p>Olá, ${nome},</p>
        <p>Sua prestação de contas precisa ser <strong>RETIFICADA</strong>.</p>
        
        <div class="card" style="margin-bottom: 16px;">
            <div class="info-row">
                <span class="info-label">Protocolo:</span> <span class="info-value">${protocolo}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Evento:</span> <span class="info-value">${nomeEvento}</span>
            </div>
        </div>

        <div class="card" style="background: #fef2f2; border-left: 4px solid #dc2626;">
            <p style="margin: 0;"><strong>Motivo da solicitação de retificação:</strong></p>
            <p style="margin: 10px 0 0 0;">${motivoEscaped}</p>
        </div>

        <p><strong>Próximos passos:</strong></p>
        <ul>
            <li>Acesse o sistema e corrija os pontos indicados</li>
            <li>Envie novamente a prestação de contas</li>
            <li>Aguarde nova análise</li>
        </ul>
    `

    return getBaseTemplate(content)
}

export function getPreAprovadaTemplate(request: Request): string {
    const protocolo = escapeHtml(request.protocolo || request.id.slice(0, 8))
    const nome = escapeHtml(request.usuarios?.nome || 'Solicitante')
    const nomeEvento = escapeHtml(request.nome_evento)
    const tipoEvento = escapeHtml(request.tipo_evento)

    const content = `
        <h2>Solicitação Pré-Aprovada!</h2>
        <p>Olá, ${nome},</p>
        <p>Sua solicitação de auxílio foi <strong>PRÉ-APROVADA</strong> pelo Autorizador da Rede e agora aguarda a autorização final.</p>
        
        <div class="card">
            <div class="info-row">
                <span class="info-label">Protocolo:</span> <span class="info-value">${protocolo}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Evento:</span> <span class="info-value">${nomeEvento}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Tipo:</span> <span class="info-value">${tipoEvento}</span>
            </div>
        </div>

        <p><strong>Próximos passos:</strong></p>
        <ul>
            <li>A solicitação será encaminhada para autorização final</li>
            <li>Você receberá uma notificação assim que for autorizada</li>
            <li>Acompanhe o status pelo sistema</li>
        </ul>
    `

    return getBaseTemplate(content)
}

export function getEmailSubject(protocolo: string, situacao: string): string {
    const situacaoMap: Record<string, string> = {
        'autorizada': 'Autorizada',
        'rejeitada': 'Não Aprovada',
        'pre_aprovada': 'Pré-Aprovada',
        'concluida': 'Comprovada',
        'paga_nao_comprovada': 'Paga — Aguardando Comprovação',
        'paga_comprovada': 'Paga e Comprovada',
        'em_retificacao': 'Retificação Necessária',
        'cancelada': 'Cancelada',
    }

    const situacaoTexto = situacaoMap[situacao] || situacao
    return `Solicitação de Auxílios | ${protocolo} - ${situacaoTexto}`
}

export function getNovaSolicitacaoTemplate(request: Request): string {
    const protocolo = escapeHtml(request.protocolo || request.id.slice(0, 8))
    const nomeEvento = escapeHtml(request.nome_evento)
    const tipoEvento = escapeHtml(request.tipo_evento)
    const solicitante = escapeHtml(request.usuarios?.nome || 'Usuário do Sistema')
    const emailSolicitante = escapeHtml(request.usuarios?.email || 'N/A')
    const dataPartida = request.data_partida
        ? formatDate(request.data_partida)
        : request.data_periodo_inicio
            ? formatDate(request.data_periodo_inicio)
            : 'N/A'

    const content = `
        <h2>Nova Solicitação de Auxílio</h2>
        <p>Olá,</p>
        <p>Uma nova solicitação de auxílio foi registrada no sistema e aguarda análise.</p>
        
        <div class="card">
            <div class="info-row">
                <span class="info-label">Protocolo:</span> <span class="info-value">${protocolo}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Solicitante:</span> <span class="info-value">${solicitante}</span>
            </div>
            <div class="info-row">
                <span class="info-label">E-mail:</span> <span class="info-value">${emailSolicitante}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Evento:</span> <span class="info-value">${nomeEvento}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Tipo:</span> <span class="info-value">${tipoEvento}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Início/Partida:</span> <span class="info-value">${dataPartida}</span>
            </div>
        </div>

        <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/admin/requests/${request.id}" class="button" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 6px;">Acessar para Análise</a>
        </div>

        <p>Acesse o painel administrativo para ver todos os detalhes e realizar a avaliação.</p>
    `

    return getBaseTemplate(content)
}

export function getInviteTemplate(nome: string, email: string, tempPassword: string, loginUrl: string): string {
    const content = `
        <h2>Convite para o Sistema Gestão de Auxílios</h2>
        <p>Olá, <strong>${escapeHtml(nome)}</strong>!</p>
        <p>Você foi convidado(a) a acessar o sistema <strong>Gestão de Auxílios - COSEMS PB</strong>.</p>
        <p>Utilize as credenciais abaixo para realizar seu primeiro acesso:</p>

        <div class="card">
            <div class="info-row">
                <span class="info-label">E-mail:</span>
                <span class="info-value">${escapeHtml(email)}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Senha temporária:</span>
                <span class="info-value"><strong>${escapeHtml(tempPassword)}</strong></span>
            </div>
        </div>

        <p style="color: #dc2626; font-size: 14px;"><strong>Atenção:</strong> Por segurança, você precisará criar uma nova senha e completar seu cadastro no primeiro acesso.</p>

        <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" class="button" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 6px;">Acessar Sistema</a>
        </div>
    `

    return getBaseTemplate(content)
}

export function getResetPasswordTemplate(resetLink: string): string {
    const content = `
        <h2>Recuperação de Senha</h2>
        <p>Olá,</p>
        <p>Recebemos uma solicitação para redefinir a senha da sua conta no sistema <strong>Gestão de Auxílios - COSEMS PB</strong>.</p>
        <p>Para criar uma nova senha, clique no botão abaixo:</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" class="button" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 6px;">Redefinir Minha Senha</a>
        </div>
        
        <p>Se você não solicitou esta alteração, por favor ignore este e-mail. Sua senha permanecerá a mesma.</p>
        <p style="font-size: 12px; color: #666;">Este link é válido por 1 hora.</p>
    `

    return getBaseTemplate(content)
}
