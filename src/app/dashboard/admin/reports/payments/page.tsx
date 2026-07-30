'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { FileSpreadsheet, FileText, Download, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { getPaidRequestsReport, getRequestersWithPaidRequests, PaidRequestReportItem } from '@/app/actions/report-actions'
import { getAllCategories } from '@/app/actions/admin-actions'
import { formatCurrency, formatCPF, formatDate } from '@/lib/format-utils'
import { generatePaidRequestsPDF } from '@/lib/pdf/paid-requests-pdf'

function MultiSelect({
    label,
    items,
    selected,
    onToggle,
    isOpen,
    setOpen,
    getId,
    getLabel,
}: {
    label: string
    items: { id: any; nome?: string; nome_categoria?: string }[]
    selected: string[]
    onToggle: (id: string) => void
    isOpen: boolean
    setOpen: (v: boolean) => void
    getId: (item: any) => string
    getLabel: (item: any) => string
}) {
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!isOpen) return
        function handleClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isOpen, setOpen])

    return (
        <div ref={containerRef} className="relative flex-1 h-10">
            <button
                type="button"
                onClick={() => setOpen(!isOpen)}
                className="flex items-center justify-between w-full h-full bg-white border border-gray-300 rounded-md px-3 text-sm text-left hover:border-gray-400 transition-colors"
            >
                <span className="truncate text-gray-700">
                    {selected.length === 0
                        ? `Todas ${label.toLowerCase()}`
                        : `${selected.length} selecionado(s)`}
                </span>
                {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
            </button>
            {isOpen && (
                <div
                    className="absolute left-0 right-0 top-full mt-1 z-50 border border-gray-200 rounded-lg bg-white shadow-lg max-h-56 overflow-y-auto"
                    onMouseDown={e => e.stopPropagation()}
                >
                    {items.length === 0 ? (
                        <p className="p-3 text-sm text-gray-400">Nenhum item disponível</p>
                    ) : (
                        items.map(item => {
                            const id = getId(item)
                            const checked = selected.includes(id)
                            return (
                                <label
                                    key={id}
                                    className={`flex items-center gap-4 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 transition-colors ${checked ? 'bg-yellow-50 font-medium text-yellow-900' : 'text-gray-700'}`}
                                >
<input
    type="checkbox"
    checked={checked}
    onChange={() => onToggle(id)}
    className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
/>
<span className="truncate">{getLabel(item)}</span>
                                </label>
                            )
                        })
                    )}
                </div>
            )}
        </div>
    )
}

export default function PaymentsReportPage() {
    const [startDate, setStartDate] = useState<string>('')
    const [endDate, setEndDate] = useState<string>('')

    const [categories, setCategories] = useState<{ id: number; nome_categoria: string }[]>([])
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])
    const [categoryOpen, setCategoryOpen] = useState(false)

    const [requesters, setRequesters] = useState<{ id: string; nome: string }[]>([])
    const [selectedRequesterCpfs, setSelectedRequesterCpfs] = useState<string[]>([])
    const [requesterOpen, setRequesterOpen] = useState(false)

    const [isLoading, setIsLoading] = useState(false)
    const [reportData, setReportData] = useState<PaidRequestReportItem[]>([])

    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

    useEffect(() => {
        const now = new Date()
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)

        setStartDate(firstDay.toISOString().split('T')[0])
        setEndDate(lastDay.toISOString().split('T')[0])

        Promise.all([
            getAllCategories().then(setCategories).catch(() => {}),
            getRequestersWithPaidRequests().then(d => setRequesters(d as any[])).catch(() => {}),
        ])
    }, [])

    function toggleCategory(id: string) {
        setSelectedCategoryIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        )
    }

    function toggleRequester(id: string) {
        setSelectedRequesterCpfs(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        )
    }

    async function handleGeneratePreview() {
        setIsLoading(true)
        setFeedback(null)
        try {
            const data = await getPaidRequestsReport(
                startDate,
                endDate,
                selectedCategoryIds,
                selectedRequesterCpfs,
            )
            setReportData(data)
            if (data.length === 0) {
                setFeedback({ type: 'error', message: 'Nenhum registro encontrado para os filtros selecionados.' })
            }
        } catch (error: any) {
            console.error('Failed to generate report', error)
            setFeedback({ type: 'error', message: error?.message || 'Erro ao gerar relatório.' })
        } finally {
            setIsLoading(false)
        }
    }

    function calculateTotal() {
        return reportData.reduce((acc, curr) => acc + curr.valor_pago, 0)
    }

    async function generatePDF() {
        try {
            await generatePaidRequestsPDF(reportData, startDate, endDate, selectedRequesterCpfs, requesters, categories, selectedCategoryIds, calculateTotal)
            setFeedback({ type: 'success', message: 'PDF gerado com sucesso.' })
        } catch {
            setFeedback({ type: 'error', message: 'Erro ao gerar PDF.' })
        }
    }

    async function generateSpreadsheet(format: 'xlsx' | 'ods') {
        const XLSX = await import('xlsx')
        const data = reportData.map(item => ({
            'CPF/CNPJ': formatCPF(item.solicitante.cpf),
            'Solicitante': item.solicitante.nome,
            'Categoria': item.categoria_nome || '',
            'Protocolo': item.protocolo,
            'Evento': item.nome_evento,
            'Valor Pago (R$)': item.valor_pago,
            'Data Pagamento': item.data_pagamento !== '-' ? formatDate(item.data_pagamento) : '-'
        }))

        const total = calculateTotal()
        data.push({
            'CPF/CNPJ': '',
            'Solicitante': '',
            'Categoria': '',
            'Protocolo': '',
            'Evento': 'TOTAL',
            'Valor Pago (R$)': total,
            'Data Pagamento': ''
        })

        const wb = XLSX.utils.book_new()
        const ws = XLSX.utils.json_to_sheet(data)

        ws['!cols'] = [
            { wch: 18 },
            { wch: 28 },
            { wch: 20 },
            { wch: 14 },
            { wch: 28 },
            { wch: 14 },
            { wch: 14 },
        ]

        XLSX.utils.book_append_sheet(wb, ws, 'Relatório')
        const fileName = `relatorio_pagamentos_${startDate}_${endDate}.${format}`
        XLSX.writeFile(wb, fileName)
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Relatório de Solicitações Pagas</h1>

            <Card className="border-yellow-100" style={{ backgroundColor: '#fefce8' }}>
                <CardContent className="pt-6">
                    <h3 className="text-lg font-semibold text-yellow-900 mb-2">Filtros do Relatório</h3>
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col md:flex-row gap-3 items-end">
                            <div className="flex gap-2">
                                <div className="flex flex-col">
                                    <Label className="text-xs text-yellow-700 mb-1">De</Label>
                                    <Input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="bg-white h-10 w-36"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <Label className="text-xs text-yellow-700 mb-1">Até</Label>
                                    <Input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="bg-white h-10 w-36"
                                    />
                                </div>
                            </div>

                            <MultiSelect
                                label="Categorias"
                                items={categories}
                                selected={selectedCategoryIds}
                                onToggle={toggleCategory}
                                isOpen={categoryOpen}
                                setOpen={setCategoryOpen}
                                getId={item => String(item.id)}
                                getLabel={item => item.nome_categoria || ''}
                            />

                            <MultiSelect
                                label="Solicitantes"
                                items={requesters}
                                selected={selectedRequesterCpfs}
                                onToggle={toggleRequester}
                                isOpen={requesterOpen}
                                setOpen={setRequesterOpen}
                                getId={item => item.id}
                                getLabel={item => item.nome || ''}
                            />
                        </div>

                        <div className="flex gap-2">
                            <Button className="h-10 px-6 flex items-center justify-center gap-2" onClick={handleGeneratePreview} disabled={isLoading}>
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                                Carregar
                            </Button>
                            <Button variant="ghost" className="h-10 w-24 shrink-0 gap-2 bg-gray-100 hover:bg-gray-300 text-gray-900" onClick={() => generatePDF()} disabled={reportData.length === 0 || isLoading} title="Exportar PDF">
                                <Download className="w-4 h-4 text-red-600" />
                                PDF
                            </Button>
                            <Button variant="ghost" className="h-10 w-24 shrink-0 gap-2 bg-gray-100 hover:bg-gray-300 text-gray-900" onClick={() => generateSpreadsheet('xlsx')} disabled={reportData.length === 0 || isLoading} title="Exportar Excel">
                                <FileSpreadsheet className="w-4 h-4 text-green-600" />
                                XLSX
                            </Button>
                            <Button variant="ghost" className="h-10 w-24 shrink-0 gap-2 bg-gray-100 hover:bg-gray-200 text-gray-900" onClick={() => generateSpreadsheet('ods')} disabled={reportData.length === 0 || isLoading} title="Exportar ODS">
                                <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                                ODS
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {feedback && (
                <div className={`px-4 py-3 rounded-md text-sm ${feedback.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    {feedback.message}
                </div>
            )}

            {reportData.length > 0 ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Card>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-gray-500">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                                        <tr>
                                            <th className="px-6 py-3">CPF/CNPJ</th>
                                            <th className="px-6 py-3">Solicitante</th>
                                            <th className="px-6 py-3">Categoria</th>
                                            <th className="px-6 py-3">Protocolo</th>
                                            <th className="px-6 py-3">Evento</th>
                                            <th className="px-6 py-3 text-right">Valor (R$)</th>
                                            <th className="px-6 py-3 text-center">Data Pagamento</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.map((item) => (
                                            <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                                                <td className="px-6 py-3 font-mono">{formatCPF(item.solicitante.cpf)}</td>
                                                <td className="px-6 py-3 font-medium text-gray-900">{item.solicitante.nome}</td>
                                                <td className="px-6 py-3 text-gray-600">{item.categoria_nome || '-'}</td>
                                                <td className="px-6 py-3 font-mono text-center">{item.protocolo}</td>
                                                <td className="px-6 py-3 break-words max-w-xs" title={item.nome_evento}>{item.nome_evento}</td>
                                                <td className="px-6 py-3 text-right font-medium text-green-600">
                                                    {formatCurrency(item.valor_pago)}
                                                </td>
                                                <td className="px-6 py-3 text-center">
                                                    {item.data_pagamento !== '-' ? formatDate(item.data_pagamento) : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-gray-100 font-bold text-gray-900">
                                            <td colSpan={5} className="px-6 py-3 text-right">Total:</td>
                                            <td className="px-6 py-3 text-right">{formatCurrency(calculateTotal())}</td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                !isLoading && (
                    <Card className="bg-gray-50 border-dashed py-8 text-center text-gray-500">
                        <p>Nenhum registro encontrado para os filtros selecionados.</p>
                        <p className="text-xs mt-1">Selecione um período e clique em "Carregar".</p>
                    </Card>
                )
            )}
        </div>
    )
}
