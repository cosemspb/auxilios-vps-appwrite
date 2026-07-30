import type { RequestData } from '@/components/accountability/accountability-form'
import { formatDate } from '@/lib/format-utils'

const MARGIN = 14
const PAGE_W = 210
const PAGE_H = 297
const CONTENT_W = PAGE_W - MARGIN * 2
const BOTTOM_MARGIN = 20

export interface UserData {
    nome: string
    cpf: string
    categoria: {
        nome_categoria: string
    }
}

async function loadImageAsBase64(url: string): Promise<string | null> {
    try {
        const res = await fetch(url)
        const blob = await res.blob()
        return new Promise((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result as string)
            reader.readAsDataURL(blob)
        })
    } catch {
        return null
    }
}

async function buildHeader(doc: any, nomeSolicitante: string, dataAutorizacao: string | null): Promise<number> {
    const logoBase64 = await loadImageAsBase64('/cosemspb_logo2024.png')
    const authSealBase64 = await loadImageAsBase64('/autorizado.jpg')

    const logoW = 39.2
    let logoBottom = 10

    if (logoBase64) {
        try {
            const logoProps = doc.getImageProperties(logoBase64)
            const logoH = (logoW / logoProps.width) * logoProps.height
            doc.addImage(logoBase64, 'PNG', MARGIN, 10, logoW, logoH)
            logoBottom = 10 + logoH + 2
        } catch {
            doc.setFontSize(12)
            doc.text('COSEMS-PB', MARGIN, 20)
            doc.setFontSize(8)
            doc.text('Conselho de Secretarias Municipais de Saúde da Paraíba', MARGIN, 26)
            logoBottom = 36
        }
    } else {
        doc.setFontSize(12)
        doc.text('COSEMS-PB', MARGIN, 20)
        doc.setFontSize(8)
        doc.text('Conselho de Secretarias Municipais de Saúde da Paraíba', MARGIN, 26)
        logoBottom = 36
    }

    const titleY = logoBottom + 6
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text('Prestação de Contas - Auxílios', MARGIN, titleY)
    doc.setFont('helvetica', 'normal')

    let rightBottom = 10
    if (authSealBase64) {
        try {
            const imgProps = doc.getImageProperties(authSealBase64)
            const sealW = imgProps.width / 4
            const sealH = imgProps.height / 4
            const sealX = PAGE_W - MARGIN - sealW

            doc.addImage(authSealBase64, 'JPEG', sealX, 10, sealW, sealH)

            doc.setFont('helvetica', 'normal')
            doc.setFontSize(7)
            doc.setTextColor(80, 80, 80)

            const dataStr = dataAutorizacao
                ? new Date(dataAutorizacao).toLocaleString('pt-BR')
                : new Date().toLocaleString('pt-BR')
            const [dataA, horaA] = dataStr.split(', ')

            const textLines = [
                'Por Soraya Galdino,',
                'Presidente do COSEMS-PB',
                `em ${dataA}, às ${horaA}.`
            ]

            let textY = 10 + sealH + 2
            for (const line of textLines) {
                doc.text(line, sealX + sealW / 2, textY, { align: 'center' })
                textY += 3.2
            }

            doc.setTextColor(0, 0, 0)
            rightBottom = textY
        } catch {
            // fallback: silent
        }
    }

    const headerEnd = Math.max(titleY + 3, rightBottom)
    return headerEnd + 2
}

function drawField(doc: any, label: string, value: string, x: number, y: number): void {
    doc.setFont('helvetica', 'bold')
    doc.text(`${label}: `, x, y)
    const labelW = doc.getTextWidth(`${label}: `)
    doc.setFont('helvetica', 'normal')
    doc.text(value, x + labelW, y)
}

function buildInfoFields(doc: any, startY: number, request: RequestData, userData: UserData | null): number {
    let y = startY
    doc.setFontSize(10)

    const deslocAereo = Array.isArray(request.deslocamentos)
        ? request.deslocamentos.some((d: any) => d.modalidade_aereo)
        : false

    drawField(doc, 'Protocolo', request.protocolo || request.id.slice(0, 8).toUpperCase(), MARGIN, y)
    drawField(doc, 'Categoria', (userData?.categoria as any)?.nome_categoria || 'N/A', MARGIN + 100, y)
    y += 6

    drawField(doc, 'Nome', userData?.nome || 'N/A', MARGIN, y)

    const eventoLabel = 'Evento: '
    const eventoValue = request.nome_evento || 'N/A'
    const eventoX = MARGIN + 100
    doc.setFont('helvetica', 'bold')
    doc.text(eventoLabel, eventoX, y)
    const eventoLabelW = doc.getTextWidth(eventoLabel)
    doc.setFont('helvetica', 'normal')
    const eventoMaxW = PAGE_W - MARGIN - eventoX - eventoLabelW
    const eventoBeforeY = y
    y = writeWrapped(doc, eventoValue, eventoX + eventoLabelW, y, eventoMaxW, 4.5)
    if (y - eventoBeforeY < 6) y = eventoBeforeY + 6

    const periodoInicio = request.data_periodo_inicio ? formatDate(request.data_periodo_inicio) : 'N/A'
    const periodoFim = request.data_periodo_fim ? formatDate(request.data_periodo_fim) : 'N/A'
    drawField(doc, 'Período', `${periodoInicio} - ${periodoFim}`, MARGIN + 100, y)
    y += 6

    drawField(doc, 'Instituição Executora', request.instituicao_executora || 'N/A', MARGIN, y)
    y += 6

    drawField(doc, 'Deslocamento aéreo', deslocAereo ? 'Sim' : 'Não', MARGIN, y)
    y += 6

    return y
}

function buildDadosSolicitacao(doc: any, startY: number, request: RequestData): number {
    let curY = startY + 4

    if (availableOnPage(curY) < 70) {
        doc.addPage()
        curY = MARGIN + 10
    }

    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('Dados da Solicitação', MARGIN, curY)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)

    curY += 7

    if (request.tipo_evento) {
        drawField(doc, 'Tipo de Evento', request.tipo_evento, MARGIN, curY)
        curY += 6
    }
    if (request.local_evento) {
        drawField(doc, 'Local do Evento', request.local_evento, MARGIN, curY)
        curY += 6
    }
    if (request.cidade_origem) {
        drawField(doc, 'Cidade de Origem', request.cidade_origem, MARGIN, curY)
        if (request.cidade_destino) {
            drawField(doc, 'Cidade de Destino', request.cidade_destino, MARGIN + 100, curY)
        }
        curY += 6
    }
    if (request.data_partida) {
        drawField(doc, 'Data Partida', formatDate(request.data_partida), MARGIN, curY)
        if (request.data_retorno) {
            drawField(doc, 'Data Retorno', formatDate(request.data_retorno), MARGIN + 100, curY)
        }
        curY += 6
    }
    if (request.observacoes) {
        doc.setFont('helvetica', 'bold')
        doc.text('Observações:', MARGIN, curY)
        doc.setFont('helvetica', 'normal')
        curY += 5
        curY = writeWrapped(doc, request.observacoes, MARGIN + 2, curY, CONTENT_W - 4, 4.5)
        curY += 2
    }

    return curY
}

function buildValoresCalculados(doc: any, startY: number, request: RequestData): number {
    let curY = startY + 2

    if (availableOnPage(curY) < 50) {
        doc.addPage()
        curY = MARGIN + 10
    }

    doc.setDrawColor(180, 180, 180)
    doc.setLineWidth(0.5)
    doc.line(MARGIN, curY, PAGE_W - MARGIN, curY)
    curY += 4

    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('Valores Calculados', MARGIN, curY)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)

    curY += 7

    const distanciaValor = typeof request.distancias === 'object' && request.distancias !== null
        ? (request.distancias as any).valor ?? ''
        : ''
    if (distanciaValor !== '') {
        const distKm = typeof distanciaValor === 'number'
            ? Number(distanciaValor).toFixed(2).replace('.', ',')
            : String(distanciaValor)
        drawField(doc, 'Distância total (km)', `${distKm} km`, MARGIN, curY)
        curY += 6
    }

    drawField(doc, 'Redução de 50%', request.reducao_diarias_50 ? 'Sim' : 'Não', MARGIN, curY)
    curY += 6

    if (request.ajuda_custo_extraordinaria !== undefined && request.ajuda_custo_extraordinaria !== null) {
        drawField(doc, 'Ajuda de Custo Extraordinária',
            `R$ ${Number(request.ajuda_custo_extraordinaria).toFixed(2).replace('.', ',')}`, MARGIN, curY)
        curY += 6
    }

    if (request.desconto_outros_auxilios !== undefined && request.desconto_outros_auxilios !== null) {
        drawField(doc, 'Desconto Outros Auxílios',
            `R$ ${Number(request.desconto_outros_auxilios).toFixed(2).replace('.', ',')}`, MARGIN, curY)
        curY += 6
    }

    return curY
}

function buildAjustes(doc: any, startY: number, request: RequestData): number {
    let curY = startY + 2

    if (availableOnPage(curY) < 50) {
        doc.addPage()
        curY = MARGIN + 10
    }

    doc.setDrawColor(180, 180, 180)
    doc.setLineWidth(0.5)
    doc.line(MARGIN, curY, PAGE_W - MARGIN, curY)
    curY += 4

    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('Ajustes', MARGIN, curY)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)

    curY += 7

    if (request.valor_a_pagar !== undefined && request.valor_a_pagar !== null) {
        drawField(doc, 'Valor a Pagar',
            `R$ ${Number(request.valor_a_pagar).toFixed(2).replace('.', ',')}`, MARGIN, curY)
        curY += 6
    }

    if (request.valor_pago !== undefined && request.valor_pago !== null) {
        drawField(doc, 'Valor Pago',
            `R$ ${Number(request.valor_pago).toFixed(2).replace('.', ',')}`, MARGIN, curY)
        curY += 6
    }

    if (request.data_pagamento) {
        drawField(doc, 'Data de Pagamento', formatDate(request.data_pagamento), MARGIN, curY)
        curY += 6
    }

    if (request.situacao) {
        drawField(doc, 'Situação', request.situacao, MARGIN, curY)
        curY += 6
    }

    return curY
}

function availableOnPage(fromY: number): number {
    return PAGE_H - BOTTOM_MARGIN - fromY
}

function writeWrapped(doc: any, text: string, x: number, y: number, maxWidth: number, lineHeight: number): number {
    const lines = doc.splitTextToSize(text, maxWidth)
    const bottomLimit = PAGE_H - BOTTOM_MARGIN
    for (const line of lines) {
        if (y + lineHeight > bottomLimit) {
            doc.addPage()
            y = MARGIN + 10
        }
        doc.text(line, x, y)
        y += lineHeight
    }
    return y
}

function buildRequesterReport(doc: any, startY: number, objective: string, activities: string): number {
    const lh = 4.5
    let curY = startY + 6

    if (availableOnPage(curY) < 90) {
        doc.addPage()
        curY = MARGIN + 10
    }

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Declaração do solicitante', MARGIN, curY)
    doc.setFont('helvetica', 'normal')

    curY += 8
    doc.setFontSize(10)
    const disclaimer = 'Estou ciente que o COSEMS-PB não se responsabiliza pelo pagamento ou recebimento de diárias ' +
        'e/ou valores efetuados por outras instituições. Em caso de recebimento indevido ou em duplicidade, ' +
        'caberá exclusivamente ao beneficiário adotar as providências necessárias.'
    curY = writeWrapped(doc, disclaimer, MARGIN, curY, CONTENT_W, lh)

    curY += 4
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Objetivo de sua participação', MARGIN, curY)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)

    curY += 6
    curY = writeWrapped(doc, objective || '', MARGIN, curY, CONTENT_W, lh)

    curY += 4
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Descrição das Atividades', MARGIN, curY)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)

    curY += 6
    curY = writeWrapped(doc, activities || '', MARGIN, curY, CONTENT_W, lh)

    return curY + 2
}

function buildPdfSeal(doc: any, startY: number, nomeSolicitante: string, submissionDateTime: string | null, sealBase64: string | null): number {
    if (availableOnPage(startY) < 25) {
        doc.addPage()
        startY = MARGIN + 10
    }

    doc.setDrawColor(100, 100, 100)
    doc.setLineWidth(0.5)
    doc.line(MARGIN, startY, PAGE_W - MARGIN, startY)

    let sealY = startY + 2

    if (sealBase64) {
        try {
            const imgProps = doc.getImageProperties(sealBase64)
            const imgWidth = Math.min(imgProps.width / 4, 30)
            const scale = imgWidth / imgProps.width
            const imgHeight = imgProps.height * scale

            doc.addImage(sealBase64, 'JPEG', MARGIN, sealY, imgWidth, imgHeight)

            doc.setFont('helvetica', 'normal')
            doc.setFontSize(10)
            doc.setTextColor(55, 65, 81)

            const dataStr = submissionDateTime
                ? new Date(submissionDateTime).toLocaleString('pt-BR')
                : new Date().toLocaleString('pt-BR')
            const [dataS, horaS] = dataStr.split(', ')

            const textX = MARGIN + imgWidth + 6
            const textY = sealY + 6
            doc.text(`Documento assinado eletronicamente por ${nomeSolicitante}`, textX, textY, { align: 'left' })
            doc.text(`em ${dataS}, às ${horaS}.`, textX, textY + 6, { align: 'left' })

            doc.setTextColor(0, 0, 0)
            sealY = sealY + Math.max(imgHeight, 14)
        } catch {
            sealY = fallbackSealText(doc, sealY, nomeSolicitante, submissionDateTime)
            sealY += 14
        }
    } else {
        sealY = fallbackSealText(doc, sealY, nomeSolicitante, submissionDateTime)
        sealY += 14
    }

    doc.setDrawColor(100, 100, 100)
    doc.setLineWidth(0.5)
    doc.line(MARGIN, sealY + 2, PAGE_W - MARGIN, sealY + 2)

    return sealY + 6
}

function fallbackSealText(doc: any, y: number, nomeSolicitante: string, submissionDateTime: string | null): number {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(55, 65, 81)
    doc.text('[Selo de Autenticação Eletrônica]', MARGIN, y + 2)

    const dataStr = submissionDateTime
        ? new Date(submissionDateTime).toLocaleString('pt-BR')
        : new Date().toLocaleString('pt-BR')
    const [dataS, horaS] = dataStr.split(', ')

    doc.text(`Documento assinado eletronicamente por ${nomeSolicitante}`, MARGIN, y + 10)
    doc.text(`em ${dataS}, às ${horaS}.`, MARGIN, y + 18)
    doc.setTextColor(0, 0, 0)
    return y + 20
}

function buildPdfAttachments(doc: any, pdfImages: { base64: string }[], startY: number, reserveBottom = 0): number {
    if (pdfImages.length === 0) return startY
    const MIN_IMAGE_H = 100

    doc.addPage()
    let currentY = 30
    let headerWritten = false
    let pageNumber = 0

    for (let i = 0; i < pdfImages.length; i++) {
        const img = pdfImages[i]
        const isLast = i === pdfImages.length - 1
        try {
            const fmt = img.base64.includes('data:image/png') ? 'PNG' : 'JPEG'
            const imgProps = doc.getImageProperties(img.base64)
            const pixelToMM = 25.4 / 72
            const nativeW = imgProps.width * pixelToMM
            const nativeH = imgProps.height * pixelToMM
            const reserve = isLast ? reserveBottom + 8 : 0
            const availableH = PAGE_H - BOTTOM_MARGIN - currentY - reserve
            let scale = Math.min(1, CONTENT_W / nativeW, Math.max(0, availableH) / nativeH)
            let renderH = nativeH * scale

            if (renderH < MIN_IMAGE_H) {
                doc.addPage()
                pageNumber++
                currentY = 30
                headerWritten = false

                const newAvailableH = PAGE_H - BOTTOM_MARGIN - currentY - reserve
                scale = Math.min(1, CONTENT_W / nativeW, Math.max(0, newAvailableH) / nativeH)
                renderH = nativeH * scale
            }

            if (!headerWritten) {
                doc.setFontSize(14)
                doc.setFont('helvetica', 'bold')
                doc.text(
                    pageNumber === 0 ? 'Anexos' : 'Anexos (cont.)',
                    105, currentY - 10, { align: 'center' }
                )
                doc.setFont('helvetica', 'normal')
                headerWritten = true
            }

            const renderW = nativeW * scale
            doc.addImage(img.base64, fmt, MARGIN, currentY, renderW, renderH)
            currentY += renderH + 8
        } catch {
            // skip failed image
        }
    }

    return currentY
}

export async function generateAccountabilityPDF(
    action: 'download' | 'email',
    request: RequestData,
    userData: UserData | null,
    accountabilityId: string | null,
    objective: string,
    activities: string,
    pdfImages: { base64: string }[],
    saveDraft: () => Promise<{ data?: { id: string }; error?: string }>,
    submissionDateTime?: string | null,
    approvalDateTime?: string | null
): Promise<{ error?: string; newAccountabilityId?: string; blobUrl?: string }> {
    try {
        const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
            import('jspdf'),
            import('jspdf-autotable')
        ])

        const { data: accountability, error: saveError } = await saveDraft()
        if (saveError) return { error: saveError }

        const doc = new jsPDF()
        const nomeSolicitante = userData?.nome || 'Solicitante'

        const authDate = approvalDateTime || request.data_autorizacao || request.data_pagamento || null
        const afterHeader = await buildHeader(doc, nomeSolicitante, authDate)
        const afterInfo = buildInfoFields(doc, afterHeader, request, userData)
        const afterSolicitacao = buildDadosSolicitacao(doc, afterInfo, request)
        const afterValores = buildValoresCalculados(doc, afterSolicitacao, request)
        const afterAjustes = buildAjustes(doc, afterValores, request)
        const afterReport = buildRequesterReport(doc, afterAjustes, objective, activities)

        const sealBase64 = await loadImageAsBase64('/auxilios_assinatura_eletronica.jpg')

        const afterAttachments = buildPdfAttachments(doc, pdfImages, afterReport, 25)

        buildPdfSeal(doc, afterAttachments, nomeSolicitante, submissionDateTime || null, sealBase64)

        if (action === 'download') {
            const filename = `relatorio_auxilios_${request.protocolo || request.id.slice(0, 8)}.pdf`
            const pdfBlob = doc.output('blob')
            const url = URL.createObjectURL(pdfBlob)
            const link = document.createElement('a')
            link.href = url
            link.download = filename
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
        }

        if (action === 'email') {
            const pdfBlob = doc.output('blob')
            const blobUrl = URL.createObjectURL(pdfBlob)
            return { newAccountabilityId: accountability?.id, blobUrl }
        }

        return { newAccountabilityId: accountability?.id }
    } catch (err: any) {
        console.error('Erro ao gerar PDF:', err)
        return { error: err?.message || 'Erro ao gerar o relatório. Tente novamente.' }
    }
}
