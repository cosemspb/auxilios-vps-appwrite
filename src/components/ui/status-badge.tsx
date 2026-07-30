import { memo } from 'react'
import { ThumbsUp, ThumbsDown, Clock, AlertCircle, CheckCircle, FileText, Receipt, XCircle } from 'lucide-react'

interface StatusBadgeProps {
    status: string
    className?: string
}

export const StatusBadge = memo(function StatusBadge({ status, className }: StatusBadgeProps) {
    const getStatusConfig = (status: string) => {
        const normalizedStatus = status?.toLowerCase() || ''

        switch (normalizedStatus) {
            case 'autorizada':
            case 'aprovada':
                return {
                    bgColor: '#dcfce7',
                    textColor: '#166534',
                    iconColor: '#16a34a',
                    borderColor: '#bbf7d0',
                    icon: ThumbsUp,
                    label: 'AUTORIZADA'
                }
            case 'retificada':
                return {
                    bgColor: '#fef3c7',
                    textColor: '#92400e',
                    iconColor: '#d97706',
                    borderColor: '#fde68a',
                    icon: Clock,
                    label: 'RETIFICADA'
                }
            case 'rejeitada':
            case 'recusada':
                return {
                    bgColor: '#fee2e2',
                    textColor: '#991b1b',
                    iconColor: '#dc2626',
                    borderColor: '#fecaca',
                    icon: ThumbsDown,
                    label: 'REJEITADA'
                }
            case 'pendente':
            case 'em_analise':
                return {
                    bgColor: '#fef9c3',
                    textColor: '#854d0e',
                    iconColor: '#ca8a04',
                    borderColor: '#fef08a',
                    icon: Clock,
                    label: 'PENDENTE'
                }
            case 'pendente_prestacao':
            case 'aguardando_prestacao':
                return {
                    bgColor: '#ffedd5',
                    textColor: '#9a3412',
                    iconColor: '#ea580c',
                    borderColor: '#fed7aa',
                    icon: AlertCircle,
                    label: 'PENDENTE DE PRESTAÇÃO'
                }
            case 'prestacao_comprovada':
            case 'concluida':
                return {
                    bgColor: '#dbeafe',
                    textColor: '#1e40af',
                    iconColor: '#3b82f6',
                    borderColor: '#bfdbfe',
                    icon: CheckCircle,
                    label: 'COMPROVADA'
                }
            case 'em_retificacao':
                return {
                    bgColor: '#ffedd5',
                    textColor: '#9a3412',
                    iconColor: '#ea580c',
                    borderColor: '#fed7aa',
                    icon: AlertCircle,
                    label: 'EM RETIFICAÇÃO'
                }
            case 'pre_aprovada':
                return {
                    bgColor: '#e0f2fe',
                    textColor: '#075985',
                    iconColor: '#38bdf8',
                    borderColor: '#bae6fd',
                    icon: Clock,
                    label: 'PRÉ-APROVADA'
                }
            case 'paga_nao_comprovada':
                return {
                    bgColor: '#ffedd5',
                    textColor: '#9a3412',
                    iconColor: '#ea580c',
                    borderColor: '#fed7aa',
                    icon: AlertCircle,
                    label: 'PAGA NÃO COMPROVADA'
                }
            case 'paga_comprovada':
                return {
                    bgColor: '#dbeafe',
                    textColor: '#1e40af',
                    iconColor: '#3b82f6',
                    borderColor: '#bfdbfe',
                    icon: CheckCircle,
                    label: 'PAGA COMPROVADA'
                }
            case 'paga':
                return {
                    bgColor: '#dcfce7',
                    textColor: '#166534',
                    iconColor: '#16a34a',
                    borderColor: '#bbf7d0',
                    icon: CheckCircle,
                    label: 'PAGA'
                }
            case 'cancelada':
                return {
                    bgColor: '#fef2f2',
                    textColor: '#991b1b',
                    iconColor: '#dc2626',
                    borderColor: '#fecaca',
                    icon: XCircle,
                    label: 'CANCELADA'
                }
            case 'em_avaliacao':
                return {
                    bgColor: '#e9d5ff',
                    textColor: '#6b21a8',
                    iconColor: '#a855f7',
                    borderColor: '#d8b4fe',
                    icon: Clock,
                    label: 'EM AVALIAÇÃO'
                }
            case 'sucesso':
                return {
                    bgColor: '#dcfce7',
                    textColor: '#166534',
                    iconColor: '#16a34a',
                    borderColor: '#bbf7d0',
                    icon: CheckCircle,
                    label: 'SUCESSO'
                }
            case 'falha':
                return {
                    bgColor: '#fee2e2',
                    textColor: '#991b1b',
                    iconColor: '#dc2626',
                    borderColor: '#fecaca',
                    icon: XCircle,
                    label: 'FALHA'
                }
            case 'solicitacao':
                return {
                    bgColor: '#dbeafe',
                    textColor: '#1e40af',
                    iconColor: '#2563eb',
                    borderColor: '#bfdbfe',
                    icon: FileText,
                    label: 'SOLICITAÇÃO'
                }
            case 'prestacao_contas':
                return {
                    bgColor: '#f3e8ff',
                    textColor: '#6b21a8',
                    iconColor: '#9333ea',
                    borderColor: '#d8b4fe',
                    icon: Receipt,
                    label: 'PRESTAÇÃO DE CONTAS'
                }
            default:
                return {
                    bgColor: '#f3f4f6',
                    textColor: '#1f2937',
                    iconColor: '#6b7280',
                    borderColor: '#e5e7eb',
                    icon: Clock,
                    label: status?.toUpperCase() || 'DESCONHECIDO'
                }
        }
    }

    const config = getStatusConfig(status)
    const Icon = config.icon

    return (
        <div
            className={className || ''}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <Icon style={{ width: '14px', height: '14px', color: config.iconColor }} />
            </div>
            <span
                style={{
                    backgroundColor: config.bgColor,
                    color: config.textColor,
                    borderColor: config.borderColor,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderRadius: '9999px',
                    padding: '4px 14px',
                    fontSize: '12px',
                    fontWeight: '500',
                    lineHeight: '16px',
                    display: 'inline-block'
                }}
            >
                {config.label}
            </span>
        </div>
    )
})
