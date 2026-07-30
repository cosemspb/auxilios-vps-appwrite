export interface TemplateMeta {
    key: string
    name: string
    description: string
    subject: string
    recipient: string
    availableFields: { key: string; label: string; example: string }[]
    sampleArgs: Record<string, string>
    templateFn: string
}

export const TEMPLATES: TemplateMeta[] = [
    {
        key: 'request_authorized',
        name: 'Solicitação Autorizada',
        description: 'Notifica o solicitante quando a solicitação é autorizada',
        subject: 'Solicitação de Auxílios | 250605-3A8F2 - Autorizada',
        recipient: 'Solicitante',
        availableFields: [
            { key: 'nome', label: 'Nome do Solicitante', example: 'João Silva' },
            { key: 'protocolo', label: 'Número do Protocolo', example: '250605-3A8F2' },
            { key: 'nome_evento', label: 'Nome do Evento', example: 'Congresso Nacional' },
            { key: 'tipo_evento', label: 'Tipo do Evento', example: 'Congresso' },
            { key: 'data_partida', label: 'Data de Partida', example: '15/06/2026' },
            { key: 'data_retorno', label: 'Data de Retorno', example: '18/06/2026' },
            { key: 'valor_aprovado', label: 'Valor Aprovado', example: 'R$ 1.500,00' },
        ],
        sampleArgs: {
            protocolo: '250605-3A8F2',
            nome: 'João Silva',
            nome_evento: 'Congresso Nacional',
            tipo_evento: 'Congresso',
            data_partida: '15/06/2026',
            data_retorno: '18/06/2026',
            valor_a_pagar: '1500.00',
        },
        templateFn: 'getAutorizadaTemplate(request)',
    },
    {
        key: 'request_rejected',
        name: 'Solicitação Rejeitada',
        description: 'Notifica o solicitante quando a solicitação é rejeitada',
        subject: 'Solicitação de Auxílios | 250605-3A8F2 - Não Aprovada',
        recipient: 'Solicitante',
        availableFields: [
            { key: 'nome', label: 'Nome do Solicitante', example: 'João Silva' },
            { key: 'protocolo', label: 'Número do Protocolo', example: '250605-3A8F2' },
            { key: 'nome_evento', label: 'Nome do Evento', example: 'Congresso Nacional' },
            { key: 'motivo', label: 'Motivo da Rejeição', example: 'Documentação incompleta' },
        ],
        sampleArgs: {
            protocolo: '250605-3A8F2',
            nome: 'João Silva',
            nome_evento: 'Congresso Nacional',
            motivo: 'Documentação incompleta. Favor anexar o comprovante de inscrição.',
        },
        templateFn: 'getRejeitadaTemplate(request, motivo)',
    },
    {
        key: 'request_cancelled',
        name: 'Solicitação Cancelada',
        description: 'Notifica o solicitante quando a solicitação é cancelada',
        subject: 'Solicitação de Auxílios | 250605-3A8F2 - Cancelada',
        recipient: 'Solicitante',
        availableFields: [
            { key: 'nome', label: 'Nome do Solicitante', example: 'João Silva' },
            { key: 'protocolo', label: 'Número do Protocolo', example: '250605-3A8F2' },
            { key: 'nome_evento', label: 'Nome do Evento', example: 'Congresso Nacional' },
            { key: 'cancelador', label: 'Nome de quem cancelou', example: 'Maria Souza' },
            { key: 'motivo', label: 'Motivo do Cancelamento', example: 'Solicitação fora do prazo' },
        ],
        sampleArgs: {
            protocolo: '250605-3A8F2',
            nome: 'João Silva',
            nome_evento: 'Congresso Nacional',
            cancelador: 'Maria Souza',
            motivo: 'Solicitação realizada fora do prazo regulamentar.',
        },
        templateFn: 'getCanceladaTemplate(request, motivo, cancelador)',
    },
    {
        key: 'accountability_approved',
        name: 'Prestação de Contas Aprovada',
        description: 'Notifica o solicitante quando a prestação de contas é aprovada',
        subject: 'Solicitação de Auxílios | 250605-3A8F2 - Comprovada',
        recipient: 'Solicitante',
        availableFields: [
            { key: 'nome', label: 'Nome do Solicitante', example: 'João Silva' },
            { key: 'protocolo', label: 'Número do Protocolo', example: '250605-3A8F2' },
            { key: 'nome_evento', label: 'Nome do Evento', example: 'Congresso Nacional' },
        ],
        sampleArgs: {
            protocolo: '250605-3A8F2',
            nome: 'João Silva',
            nome_evento: 'Congresso Nacional',
        },
        templateFn: 'getComprovadaTemplate(request)',
    },
    {
        key: 'accountability_rejected',
        name: 'Prestação de Contas Rejeitada',
        description: 'Notifica quando a prestação de contas precisa ser retificada',
        subject: 'Solicitação de Auxílios | 250605-3A8F2 - Retificação Necessária',
        recipient: 'Solicitante',
        availableFields: [
            { key: 'nome', label: 'Nome do Solicitante', example: 'João Silva' },
            { key: 'protocolo', label: 'Número do Protocolo', example: '250605-3A8F2' },
            { key: 'nome_evento', label: 'Nome do Evento', example: 'Congresso Nacional' },
            { key: 'motivo', label: 'Motivo da Rejeição', example: 'Comprovantes ilegíveis' },
        ],
        sampleArgs: {
            protocolo: '250605-3A8F2',
            nome: 'João Silva',
            nome_evento: 'Congresso Nacional',
            motivo: 'Os comprovantes enviados estão ilegíveis. Por favor, envie novamente com melhor resolução.',
        },
        templateFn: 'getPrestacaoRejeitadaTemplate(request, motivo)',
    },
    {
        key: 'request_pre_approved',
        name: 'Solicitação Pré-Aprovada',
        description: 'Notifica o solicitante quando a solicitação é pré-aprovada pelo Autorizador da Rede',
        subject: 'Solicitação de Auxílios | 250605-3A8F2 - Pré-Aprovada',
        recipient: 'Solicitante',
        availableFields: [
            { key: 'nome', label: 'Nome do Solicitante', example: 'João Silva' },
            { key: 'protocolo', label: 'Número do Protocolo', example: '250605-3A8F2' },
            { key: 'nome_evento', label: 'Nome do Evento', example: 'Congresso Nacional' },
            { key: 'tipo_evento', label: 'Tipo do Evento', example: 'Congresso' },
        ],
        sampleArgs: {
            protocolo: '250605-3A8F2',
            nome: 'João Silva',
            nome_evento: 'Congresso Nacional',
            tipo_evento: 'Congresso',
        },
        templateFn: 'getPreAprovadaTemplate(request)',
    },
    {
        key: 'new_request_notification',
        name: 'Nova Solicitação (Admin)',
        description: 'Notifica os administradores/financeiro quando há uma nova solicitação',
        subject: 'Nova Solicitação de Auxílio | 250605-3A8F2',
        recipient: 'Administrador / Financeiro',
        availableFields: [
            { key: 'protocolo', label: 'Número do Protocolo', example: '250605-3A8F2' },
            { key: 'solicitante_nome', label: 'Nome do Solicitante', example: 'João Silva' },
            { key: 'solicitante_email', label: 'E-mail do Solicitante', example: 'joao@example.com' },
            { key: 'nome_evento', label: 'Nome do Evento', example: 'Congresso Nacional' },
            { key: 'tipo_evento', label: 'Tipo do Evento', example: 'Congresso' },
            { key: 'data_inicio', label: 'Data de Início', example: '15/06/2026' },
        ],
        sampleArgs: {
            protocolo: '250605-3A8F2',
            solicitante_nome: 'João Silva',
            solicitante_email: 'joao@example.com',
            nome_evento: 'Congresso Nacional',
            tipo_evento: 'Congresso',
            data_inicio: '15/06/2026',
        },
        templateFn: 'getNovaSolicitacaoTemplate(request)',
    },
    {
        key: 'user_invite',
        name: 'Convite de Usuário',
        description: 'E-mail enviado quando um novo usuário é convidado a acessar o sistema',
        subject: 'Convite - Gestão de Auxílios COSEMS PB',
        recipient: 'Novo usuário',
        availableFields: [
            { key: 'nome', label: 'Nome do Usuário', example: 'João Silva' },
            { key: 'email', label: 'E-mail do Usuário', example: 'joao@example.com' },
            { key: 'senha_temporaria', label: 'Senha Temporária', example: 'Cosems@2026!' },
            { key: 'link_acesso', label: 'Link de Acesso', example: 'https://auxilios.cosemspb.org/login' },
        ],
        sampleArgs: {
            nome: 'João Silva',
            email: 'joao@example.com',
            senha_temporaria: 'Cosems@2026!',
            link_acesso: 'https://auxilios.cosemspb.org/login',
        },
        templateFn: 'getInviteTemplate(nome, email, senha, link)',
    },
    {
        key: 'password_reset',
        name: 'Recuperação de Senha',
        description: 'E-mail enviado para redefinição de senha',
        subject: 'Recuperação de Senha - Gestão de Auxílios',
        recipient: 'Solicitante da recuperação',
        availableFields: [
            { key: 'reset_link', label: 'Link de Redefinição', example: 'https://auxilios.cosemspb.org/auth/update-password?token=abc123' },
        ],
        sampleArgs: {
            reset_link: 'https://auxilios.cosemspb.org/auth/update-password?token=abc123',
        },
        templateFn: 'getResetPasswordTemplate(link)',
    },
]
