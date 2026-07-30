import type { jsPDF } from 'jspdf'
import { PaidRequestReportItem } from '@/app/actions/report-actions'
import { formatCurrency, formatCPF, formatDate } from '@/lib/format-utils'

export async function generatePaidRequestsPDF(
    reportData: PaidRequestReportItem[],
    startDate: string,
    endDate: string,
    selectedRequesterCpfs: string[],
    requesters: { id: string; nome: string }[],
    categories: { id: number; nome_categoria: string }[],
    selectedCategoryIds: string[],
    calculateTotal: () => number
): Promise<void> {
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable')
    ])
    const doc = new jsPDF({ orientation: 'landscape' })

    await addLogo(doc)
    addTitle(doc)
    addPeriod(doc, startDate, endDate, selectedRequesterCpfs, requesters, categories, selectedCategoryIds)
    addDataTable(doc, reportData, calculateTotal, autoTable)

    doc.save(`relatorio_pagamentos_${startDate}_${endDate}.pdf`)
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
    doc.text('Relatório de Auxílios Pagos', 148.5, 20, { align: 'center' })
}

function addPeriod(
    doc: jsPDF,
    startDate: string,
    endDate: string,
    selectedRequesterCpfs: string[],
    requesters: { id: string; nome: string }[],
    categories: { id: number; nome_categoria: string }[],
    selectedCategoryIds: string[]
): void {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')

    const formatLocalDate = (dateStr: string) => {
        const [year, month, day] = dateStr.split('-')
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toLocaleDateString('pt-BR')
    }

    doc.text(`Período: ${formatLocalDate(startDate)} a ${formatLocalDate(endDate)}`, 148.5, 28, { align: 'center' })

    const lines: string[] = []
    if (selectedCategoryIds.length > 0) {
        const names = selectedCategoryIds
            .map(id => categories.find(c => String(c.id) === id))
            .filter(Boolean)
            .map(c => c!.nome_categoria)
        if (names.length > 0) lines.push(`Categorias: ${names.join(', ')}`)
    }
    if (selectedRequesterCpfs.length > 0) {
        const names = selectedRequesterCpfs
            .map(cpf => requesters.find(r => r.id === cpf))
            .filter(Boolean)
            .map(r => `(${formatCPF(r!.id)}) ${r!.nome}`)
        if (names.length > 0) lines.push(`Solicitantes: ${names.join(', ')}`)
    }
    if (lines.length > 0) {
        doc.text(lines.join(' | '), 148.5, 33, { align: 'center', maxWidth: 260 })
    }
}

function addDataTable(
    doc: jsPDF,
    reportData: PaidRequestReportItem[],
    calculateTotal: () => number,
    autoTable: any
): void {
    const tableData = reportData.map(item => [
        formatCPF(item.solicitante.cpf),
        item.solicitante.nome,
        item.categoria_nome || '-',
        item.protocolo,
        item.nome_evento,
        formatCurrency(item.valor_pago),
        formatDate(item.data_pagamento)
    ])

    const totalValue = calculateTotal()

    autoTable(doc, {
        startY: 40,
        head: [['CPF/CNPJ', 'Nome', 'Categoria', 'Protocolo', 'Evento', 'Valor', 'Dt. Pagto.']],
        body: tableData,
        foot: [['', '', '', '', '', formatCurrency(totalValue), '']],
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
        footStyles: {
            fillColor: [240, 240, 240],
            textColor: 0,
            fontStyle: 'bold',
            halign: 'right'
        },
        columnStyles: {
            0: { cellWidth: 28 },
            1: { cellWidth: 50 },
            2: { cellWidth: 28 },
            3: { cellWidth: 30 },
            4: { cellWidth: 'auto' },
            5: { cellWidth: 22, halign: 'right' },
            6: { cellWidth: 20, halign: 'center' }
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
