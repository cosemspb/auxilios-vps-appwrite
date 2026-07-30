import type { jsPDF } from 'jspdf'
import { AllRequestsReportItem } from '@/app/actions/report-actions'
import { formatCurrency, formatDate } from '@/lib/format-utils'

export async function generateRequestsReportPDF(
    data: AllRequestsReportItem[],
    filters: { email?: string; situacao?: string; protocolo?: string; startDate?: string; endDate?: string }
): Promise<void> {
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable')
    ])
    const doc = new jsPDF({ orientation: 'landscape' })

    await addLogo(doc)
    addTitle(doc)
    addFiltersInfo(doc, filters)
    addDataTable(doc, data, autoTable)

    doc.save('relatorio_solicitacoes.pdf')
}

async function addLogo(doc: jsPDF): Promise<void> {
    try {
        const logoUrl = window.location.origin + '/cosemspb_logo2024.png'
        const img = new Image()
        img.src = logoUrl
        await new Promise<void>((resolve) => {
            img.onload = () => resolve()
            img.onerror = () => resolve()
        })
        if (img.width > 0) {
            const maxWidth = 40
            const aspectRatio = img.height / img.width
            doc.addImage(img, 'PNG', 15, 10, maxWidth, maxWidth * aspectRatio)
        }
    } catch {
        // Silently skip logo on failure
    }
}

function addTitle(doc: jsPDF): void {
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('Relatório de Solicitações', 148.5, 20, { align: 'center' })
}

function addFiltersInfo(doc: jsPDF, filters: { email?: string; situacao?: string; protocolo?: string; startDate?: string; endDate?: string }): void {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')

    const lines: string[] = []
    if (filters.email) lines.push(`Email: ${filters.email}`)
    if (filters.situacao) lines.push(`Situação: ${filters.situacao}`)
    if (filters.protocolo) lines.push(`Protocolo: ${filters.protocolo}`)
    if (filters.startDate && filters.endDate) {
        const fmt = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR')
        lines.push(`Período: ${fmt(filters.startDate)} a ${fmt(filters.endDate)}`)
    } else if (filters.startDate) {
        lines.push(`A partir de: ${new Date(filters.startDate + 'T12:00:00').toLocaleDateString('pt-BR')}`)
    } else if (filters.endDate) {
        lines.push(`Até: ${new Date(filters.endDate + 'T12:00:00').toLocaleDateString('pt-BR')}`)
    }

    if (lines.length > 0) {
        doc.text(lines.join(' | '), 148.5, 28, { align: 'center', maxWidth: 260 })
    }
}

function getStatusLabel(status: string): string {
    const map: Record<string, string> = {
        pendente: 'Pendente',
        pre_aprovada: 'Pré-aprovada',
        autorizada: 'Autorizada',
        em_avaliacao: 'Em Avaliação',
        rejeitada: 'Rejeitada',
        retificada: 'Retificada',
        em_retificacao: 'Em Retificação',
        paga_nao_comprovada: 'Paga não Comp.',
        paga_comprovada: 'Paga Comp.',
        paga: 'Paga',
        cancelada: 'Cancelada',
        concluida: 'Concluída',
    }
    return map[status] || status
}

function addDataTable(
    doc: jsPDF,
    data: AllRequestsReportItem[],
    autoTable: any
): void {
    const tableData = data.map(item => [
        item.protocolo,
        item.solicitante.nome,
        item.solicitante.email,
        item.nome_evento,
        getStatusLabel(item.situacao),
        item.valor_a_pagar ? formatCurrency(item.valor_a_pagar) : '-',
        formatDate(item.data_criacao),
    ])

    autoTable(doc, {
        startY: 35,
        head: [['Protocolo', 'Solicitante', 'Email', 'Evento', 'Situação', 'Valor (R$)', 'Data Criação']],
        body: tableData,
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
        columnStyles: {
            0: { cellWidth: 22 },
            1: { cellWidth: 42 },
            2: { cellWidth: 50 },
            3: { cellWidth: 'auto' },
            4: { cellWidth: 28 },
            5: { cellWidth: 22, halign: 'right' },
            6: { cellWidth: 22, halign: 'center' },
        },
        theme: 'grid',
        styles: { fontSize: 7.5, cellPadding: 2 },
        didDrawPage: function () {
            addPageNumber(doc)
        }
    })
}

function addPageNumber(doc: jsPDF): void {
    const pageCount = doc.getNumberOfPages()
    doc.setFontSize(8)
    doc.text(
        'Página ' + (doc.internal as any).getCurrentPageInfo().pageNumber + ' de ' + pageCount,
        doc.internal.pageSize.width - 15,
        doc.internal.pageSize.height - 10,
        { align: 'right' }
    )
}
