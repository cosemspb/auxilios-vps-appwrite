'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Search, Eye, Loader2, FileText, FileSpreadsheet, Download } from 'lucide-react'
import { QuickPDFViewer } from '@/components/accountability/quick-pdf-viewer'
import { getAllRequestsReport, AllRequestsReportItem } from '@/app/actions/report-actions'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatCurrency, formatDate } from '@/lib/format-utils'
import { generateRequestsReportPDF } from '@/lib/pdf/requests-report-pdf'

const STATUS_LIST = [
    { value: '', label: 'Todos os status' },
    { value: 'pendente', label: 'Pendente' },
    { value: 'pre_aprovada', label: 'Pré-aprovada' },
    { value: 'autorizada', label: 'Autorizada' },
    { value: 'em_avaliacao', label: 'Em Avaliação' },
    { value: 'rejeitada', label: 'Rejeitada' },
    { value: 'retificada', label: 'Retificada' },
    { value: 'em_retificacao', label: 'Em Retificação' },
    { value: 'paga_nao_comprovada', label: 'Paga não Comprovada' },
    { value: 'paga_comprovada', label: 'Paga Comprovada' },
    { value: 'paga', label: 'Paga' },
    { value: 'cancelada', label: 'Cancelada' },
    { value: 'concluida', label: 'Concluída' },
]

export default function RequestsReportPage() {
    const [email, setEmail] = useState('')
    const [situacao, setSituacao] = useState('')
    const [protocolo, setProtocolo] = useState('')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')

    const [data, setData] = useState<AllRequestsReportItem[]>([])
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [hasSearched, setHasSearched] = useState(false)
    const totalPages = Math.ceil(total / 10)

    const [mounted, setMounted] = useState(false)
    useEffect(() => { setMounted(true) }, [])

    const currentFilters = { email: email || undefined, situacao: situacao || undefined, protocolo: protocolo || undefined, startDate: startDate || undefined, endDate: endDate || undefined }

    const search = useCallback(async (p: number) => {
        setIsLoading(true)
        setError('')
        setHasSearched(true)
        try {
            const result = await getAllRequestsReport(p, currentFilters)
            setData(result.data)
            setTotal(result.total)
            setPage(p)
        } catch (err: any) {
            setError(err.message || 'Erro ao buscar solicitações')
            setData([])
            setTotal(0)
        } finally {
            setIsLoading(false)
        }
    }, [email, situacao, protocolo, startDate, endDate])

    async function generatePDF() {
        try {
            await generateRequestsReportPDF(data, currentFilters)
        } catch {
            setError('Erro ao gerar PDF')
        }
    }

    async function generateXLSX() {
        try {
            const XLSX = await import('xlsx')
            const rows = data.map(item => ({
                Protocolo: item.protocolo,
                Solicitante: item.solicitante.nome,
                Email: item.solicitante.email,
                Evento: item.nome_evento,
                Situação: item.situacao,
                'Valor (R$)': item.valor_a_pagar || 0,
                'Data Criação': formatDate(item.data_criacao),
            }))
            const wb = XLSX.utils.book_new()
            const ws = XLSX.utils.json_to_sheet(rows)
            ws['!cols'] = [
                { wch: 14 }, { wch: 28 }, { wch: 30 },
                { wch: 32 }, { wch: 16 }, { wch: 12 }, { wch: 14 },
            ]
            XLSX.utils.book_append_sheet(wb, ws, 'Solicitações')
            XLSX.writeFile(wb, 'relatorio_solicitacoes.xlsx')
        } catch {
            setError('Erro ao gerar XLSX')
        }
    }

    if (!mounted) return null

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Relatório de Solicitações</h1>

            <Card className="border-blue-100" style={{ backgroundColor: '#eff6ff' }}>
                <CardContent className="pt-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">Filtros</h3>
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col md:flex-row gap-3 items-end">
                            <div className="flex flex-col flex-[3]">
                                <Label className="text-xs text-blue-700 mb-1">Email do Solicitante</Label>
                                <Input
                                    type="text"
                                    placeholder="qualquer@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="bg-white h-10"
                                />
                            </div>
                            <div className="flex flex-col flex-[2]">
                                <Label className="text-xs text-blue-700 mb-1">Situação</Label>
                                <select
                                    value={situacao}
                                    onChange={(e) => setSituacao(e.target.value)}
                                    className="bg-white border border-gray-300 rounded-md px-3 h-10 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    {STATUS_LIST.map((s) => (
                                        <option key={s.value} value={s.value}>{s.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex flex-col flex-[2]">
                                <Label className="text-xs text-blue-700 mb-1">Protocolo</Label>
                                <Input
                                    type="text"
                                    placeholder="Ex: 260616"
                                    value={protocolo}
                                    onChange={(e) => setProtocolo(e.target.value)}
                                    className="bg-white h-10"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col md:flex-row gap-3 items-end">
                            <div className="flex gap-2">
                                <div className="flex flex-col">
                                    <Label className="text-xs text-blue-700 mb-1">Data Início</Label>
                                    <Input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="bg-white h-10 w-36"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <Label className="text-xs text-blue-700 mb-1">Data Fim</Label>
                                    <Input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="bg-white h-10 w-36"
                                    />
                                </div>
                            </div>
                            <Button className="h-10 px-6 flex items-center justify-center gap-2" onClick={() => search(1)} disabled={isLoading}>
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                Consultar
                            </Button>
                            <div className="flex gap-2">
                                <Button variant="ghost" className="h-10 w-24 shrink-0 gap-2 bg-gray-100 hover:bg-gray-300 text-gray-900" onClick={generatePDF} disabled={data.length === 0 || isLoading} title="Exportar PDF">
                                    <Download className="w-4 h-4 text-red-600" />
                                    PDF
                                </Button>
                                <Button variant="ghost" className="h-10 w-24 shrink-0 gap-2 bg-gray-100 hover:bg-gray-300 text-gray-900" onClick={generateXLSX} disabled={data.length === 0 || isLoading} title="Exportar Excel">
                                    <FileSpreadsheet className="w-4 h-4 text-green-600" />
                                    XLSX
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {error && (
                <div className="px-4 py-3 rounded-md text-sm bg-red-50 text-red-800">{error}</div>
            )}

            {isLoading ? (
                <Card className="bg-gray-50 border-dashed py-8 text-center text-gray-500">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                    <p>Buscando solicitações...</p>
                </Card>
            ) : !hasSearched ? (
                <Card className="bg-gray-50 border-dashed py-8 text-center text-gray-500">
                    <Search className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                    <p>Preencha os filtros e clique em "Consultar".</p>
                </Card>
            ) : data.length === 0 ? (
                <Card className="bg-gray-50 border-dashed py-8 text-center text-gray-500">
                    <p>Nenhuma solicitação encontrada com os filtros informados.</p>
                </Card>
            ) : (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Card>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-gray-500">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                                        <tr>
                                            <th className="px-4 py-3" style={{ width: '13%' }}>Protocolo</th>
                                            <th className="px-4 py-3" style={{ width: '25%' }}>Solicitante</th>
                                            <th className="px-4 py-3" style={{ width: '28%' }}>Evento</th>
                                            <th className="px-4 py-3" style={{ width: '14%' }}>Situação</th>
                                            <th className="px-4 py-3" style={{ width: '10%' }}>Data Criação</th>
                                            <th className="px-4 py-3 text-right" style={{ width: '10%' }}>Valor (R$)</th>
                                            <th className="px-4 py-3 text-center" style={{ width: '8%' }}>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.map((item) => (
                                            <tr key={item.id} className="bg-white border-b hover:bg-blue-50 transition-colors">
                                                <td className="px-4 py-3 font-mono text-xs whitespace-nowrap text-center">{item.protocolo}</td>
                                                <td className="px-4 py-3 break-words" style={{ wordBreak: 'break-word' }}>
                                                    <div className="font-medium text-gray-900 truncate">{item.solicitante.nome}</div>
                                                    <div className="text-xs text-gray-400 truncate">{item.solicitante.email}</div>
                                                </td>
                                                <td className="px-4 py-3 break-words text-gray-700" style={{ wordBreak: 'break-word', maxWidth: 0 }} title={item.nome_evento}>{item.nome_evento}</td>
                                                <td className="px-4 py-3">
                                                    <StatusBadge status={item.situacao} />
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-gray-600">{formatDate(item.data_criacao)}</td>
                                                <td className="px-4 py-3 text-right font-medium text-gray-900 whitespace-nowrap">
                                                    {item.valor_a_pagar ? formatCurrency(item.valor_a_pagar) : '-'}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Link
                                                            href={`/dashboard/admin/requests/${item.id}`}
                                                            className="btn btn-primary btn-icon h-8 w-8 inline-flex items-center justify-center rounded-md"
                                                            title="Ver Solicitação"
                                                        >
                                                            <Eye className="w-5 h-5 text-white" />
                                                        </Link>
                                                        {item.accountability_id && (
                                                            <QuickPDFViewer accountabilityId={item.accountability_id} />
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                            <span className="text-sm text-gray-500">
                                {Math.min((page - 1) * 10 + 1, total)}–{Math.min(page * 10, total)} de {total}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => search(page - 1)}
                                    disabled={page <= 1}
                                    className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors bg-white"
                                >
                                    Anterior
                                </button>
                                <button
                                    onClick={() => search(page + 1)}
                                    disabled={page >= totalPages}
                                    className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors bg-white"
                                >
                                    Próximo
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
