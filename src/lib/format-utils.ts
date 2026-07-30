export function formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })
}

export function formatCurrencyInput(value: string): string {
    let cleaned = value.replace(/[^\d,]/g, '')
    const parts = cleaned.split(',')
    if (parts.length > 2) cleaned = parts[0] + ',' + parts.slice(1).join('')
    const [integerPart, decimalPart] = cleaned.split(',')
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    return decimalPart !== undefined ? `${formattedInteger},${decimalPart}` : formattedInteger
}

export function parseCurrencyInput(value: string): number {
    return parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0
}

export function formatCPF(cpf: string): string {
    if (!cpf) return ''
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

export function formatDocumento(doc: string): string {
    if (!doc) return ''
    const raw = doc.replace(/\D/g, '')
    if (raw.length === 14) {
        return raw.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
    }
    return formatCPF(doc)
}

export function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return 'N/A'
    const [y, m, d] = dateStr.split('T')[0].split('-').map(Number)
    if (!y || !m || !d) return 'N/A'
    return new Date(y, m - 1, d).toLocaleDateString('pt-BR')
}

export function formatDateTime(dateStr: string | null | undefined): string {
    if (!dateStr) return 'N/A'
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return 'N/A'
    return d.toLocaleDateString('pt-BR')
}

export function getDeadlineColor(daysRemaining: number): { border: string; text: string; label: string } {
    if (daysRemaining >= 5) return { border: '#16a34a', text: '#16a34a', label: `${daysRemaining} dias` }
    if (daysRemaining >= 3) return { border: '#ca8a04', text: '#ca8a04', label: `${daysRemaining} dias` }
    if (daysRemaining >= 1) return { border: '#ea580c', text: '#ea580c', label: `${daysRemaining} dias` }
    if (daysRemaining === 0) return { border: '#dc2626', text: '#dc2626', label: 'Último dia!' }
    return { border: '#991b1b', text: '#991b1b', label: `Vencido há ${Math.abs(daysRemaining)} dias` }
}

export function getDeadline(data_retorno: string | null, data_periodo_fim: string): Date | null {
    const baseDate = data_retorno || data_periodo_fim
    if (!baseDate) return null
    const [y, m, d] = baseDate.split('T')[0].split('-').map(Number)
    const date = new Date(y, m - 1, d)
    const deadline = new Date(date)
    deadline.setDate(date.getDate() + 5)
    return deadline
}

export function getDaysRemaining(deadline: Date): number {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const diff = deadline.getTime() - now.getTime()
    return Math.round(diff / (1000 * 60 * 60 * 24))
}

export function calculateEstimatedValue(req: {
    valor_a_pagar?: number
    data_partida?: string
    data_retorno?: string
    data_periodo_inicio: string
    data_periodo_fim: string
    usuarios?: {
        categorias?: {
            valor_diaria: number
        }
    }
    distancias?: {
        valor: number
    }
}): number {
    if (req.valor_a_pagar && req.valor_a_pagar > 0) return req.valor_a_pagar

    const start = new Date(req.data_partida || req.data_periodo_inicio)
    const end = new Date(req.data_retorno || req.data_periodo_fim)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const days = diffDays === 0 ? 0.5 : diffDays

    const dailyRate = req.usuarios?.categorias?.valor_diaria || 0
    const distanceValue = req.distancias?.valor || 0

    return (days * dailyRate) + distanceValue
}
