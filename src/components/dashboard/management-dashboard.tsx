'use client'

import { Card } from '@/components/ui/card'
import { FileText, Clock, Eye, CheckCircle, Pencil, Banknote, CircleDollarSign, ThumbsUp, Calendar, AlertTriangle, Users, Receipt } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState, useCallback } from 'react'
import { getPendingRequests, getPendingAccountabilities, getAuthorizedRequests, getPreApprovedRequests, registerPayment, updatePaymentInfo, getPendingCorrections, getComprovadasRequests, getApprovedAccountabilitiesPendingPayment, getDashboardData } from '@/app/actions/admin-actions'
import { StatCard } from '@/components/dashboard/stat-card'
import { QuickPDFViewer } from '@/components/accountability/quick-pdf-viewer'
import { StatusBadge } from '@/components/ui/status-badge'
import { DashboardMetrics } from '@/components/dashboard/dashboard-metrics'
import { RoleSwitcherButton } from '@/components/dashboard/role-switcher-button'
import { Modal } from '@/components/ui/modal'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { formatCurrency, formatCurrencyInput, parseCurrencyInput, calculateEstimatedValue as calcEstimatedValue, formatDate, formatDateTime, formatDocumento, getDeadline, getDeadlineColor, getDaysRemaining } from '@/lib/format-utils'

interface Request {
    id: string
    protocolo: string
    situacao: string
    nome_evento: string
    local_evento: string
    data_criacao: string
    data_partida?: string
    data_retorno?: string
    data_periodo_inicio: string
    data_periodo_fim: string
    valor_a_pagar?: number
    valor_pago?: number
    data_pagamento?: string
    pre_autorizador_cpf?: string
    pre_autorizador?: { nome: string }
    distancias?: {
        valor: number
    }
    usuarios?: {
        nome: string
        categorias?: {
            nome_categoria: string
            valor_diaria: number
        }
    }
    accountability_id?: string | null
}

interface PendingCorrection {
    id: string
    type: 'solicitacao' | 'prestacao'
    protocolo: string
    solicitante: string
    evento: string
    motivo: string
    data: string
}

interface Accountability {
    id: string
    data_envio: string
    solicitacoes?: {
        id: string
        protocolo: string
        nome_evento: string
        valor_a_pagar?: number
        usuarios?: {
            nome: string
        }
    }
}

const perfilConfig: Record<number, { title: string; description: string }> = {
    2: {
        title: 'Dashboard do Autorizador da Rede',
        description: 'Pré-aprove solicitações de Apoiadores da Rede'
    },
    3: {
        title: 'Dashboard do Autorizador',
        description: 'Gerencie solicitações e prestações de contas'
    },
    4: {
        title: 'Dashboard do Administrador',
        description: 'Gerencie todas as solicitações, autorizações e prestações de contas'
    }
}

export function ManagementDashboard({
    perfilId = 4
}: {
    perfilId?: number
}) {
    const config = perfilConfig[perfilId] || perfilConfig[3]
    const isRede = perfilId === 2
    const isFull = perfilId === 3 || perfilId === 4

    const [pendingRequests, setPendingRequests] = useState<Request[]>([])
    const [preApprovedRequests, setPreApprovedRequests] = useState<Request[]>([])
    const [pendingAccountabilities, setPendingAccountabilities] = useState<Accountability[]>([])
    const [authorizedRequests, setAuthorizedRequests] = useState<Request[]>([])
    const [pendingCorrections, setPendingCorrections] = useState<PendingCorrection[]>([])
    const [comprovadasRequests, setComprovadasRequests] = useState<Request[]>([])
    const [pendingPaymentRequests, setPendingPaymentRequests] = useState<Accountability[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshKey, setRefreshKey] = useState(0)
    const [pages, setPages] = useState({ pending: 1, preApproved: 1, accountabilities: 1, authorized: 1, corrections: 1, comprovadas: 1, pendingPayment: 1 })
    const [totals, setTotals] = useState({ pending: 0, preApproved: 0, accountabilities: 0, authorized: 0, corrections: 0, comprovadas: 0, pendingPayment: 0 })
    const [paymentTarget, setPaymentTarget] = useState<Request | null>(null)
    const [dataPagamento, setDataPagamento] = useState(new Date().toISOString().split('T')[0])
    const [valorPagoInput, setValorPagoInput] = useState('')
    const [paymentLoading, setPaymentLoading] = useState(false)
    const [paymentError, setPaymentError] = useState('')

    const LIMIT = 10

    function setPage(key: string, page: number) { setPages(p => ({ ...p, [key]: page })) }

    async function loadSection(section: string, page: number) {
        switch (section) {
            case 'pending': {
                const r = await getPendingRequests(perfilId, page)
                setPendingRequests(r.data as Request[])
                setTotals(t => ({ ...t, pending: r.total }))
                break
            }
            case 'preApproved': {
                const r = await getPreApprovedRequests(page)
                setPreApprovedRequests(r.data as Request[])
                setTotals(t => ({ ...t, preApproved: r.total }))
                break
            }
            case 'accountabilities': {
                const r = await getPendingAccountabilities(page)
                setPendingAccountabilities(r.data as Accountability[])
                setTotals(t => ({ ...t, accountabilities: r.total }))
                break
            }
            case 'authorized': {
                const r = await getAuthorizedRequests(page)
                const sorted = (r.data as Request[]).sort((a, b) => {
                    const da = getDeadline(a.data_retorno || null, a.data_periodo_fim)?.getTime() || 0
                    const db = getDeadline(b.data_retorno || null, b.data_periodo_fim)?.getTime() || 0
                    return da - db
                })
                setAuthorizedRequests(sorted)
                setTotals(t => ({ ...t, authorized: r.total }))
                break
            }
            case 'corrections': {
                const r = await getPendingCorrections(page)
                setPendingCorrections(r.data as PendingCorrection[])
                setTotals(t => ({ ...t, corrections: r.total }))
                break
            }
            case 'comprovadas': {
                const r = await getComprovadasRequests(page)
                setComprovadasRequests(r.data as Request[])
                setTotals(t => ({ ...t, comprovadas: r.total }))
                break
            }
            case 'pendingPayment': {
                const r = await getApprovedAccountabilitiesPendingPayment(page)
                setPendingPaymentRequests(r.data as Accountability[])
                setTotals(t => ({ ...t, pendingPayment: r.total }))
                break
            }
        }
    }

    const loadAll = useCallback(async () => {
        setLoading(true)
        setPages({ pending: 1, preApproved: 1, accountabilities: 1, authorized: 1, corrections: 1, comprovadas: 1, pendingPayment: 1 })
        if (isRede) {
            const r = await getPendingRequests(perfilId, 1)
            setPendingRequests(r.data as Request[])
            setTotals(t => ({ ...t, pending: r.total }))
        } else {
            const sections = [
                loadSection('pending', 1),
                loadSection('preApproved', 1),
                loadSection('accountabilities', 1),
                loadSection('authorized', 1),
                loadSection('corrections', 1),
                loadSection('comprovadas', 1),
                loadSection('pendingPayment', 1),
            ]
            await Promise.all(sections)
        }
        setLoading(false)
    }, [refreshKey, perfilId, isRede])

    useEffect(() => { loadAll() }, [loadAll])

    function Pagination({ section, page, total }: { section: string; page: number; total: number }) {
        const totalPages = Math.ceil(total / LIMIT)
        if (totalPages <= 1) return null
        function goToPage(np: number) {
            setPage(section, np)
            loadSection(section, np)
            setTimeout(() => {
                document.getElementById(section)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }, 150)
        }
        return (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                <span className="text-sm text-gray-500">
                    {Math.min((page - 1) * LIMIT + 1, total)}–{Math.min(page * LIMIT, total)} de {total}
                </span>
                <div className="flex gap-2">
                    <button
                        onClick={() => goToPage(page - 1)}
                        disabled={page <= 1}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors bg-white"
                    >
                        Anterior
                    </button>
                    <button
                        onClick={() => goToPage(page + 1)}
                        disabled={page >= totalPages}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors bg-white"
                    >
                        Próximo
                    </button>
                </div>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">{config.title}</h2>
                    <p className="text-gray-500">{config.description}</p>
                </div>
                <RoleSwitcherButton target="requester" />
            </div>

            {isFull && (
                <DashboardMetrics
                    pendingRequests={totals.pending}
                    preApprovedRequests={totals.preApproved}
                    pendingAccountabilities={totals.accountabilities}
                    pendingCorrections={totals.corrections}
                    authorizedRequests={totals.authorized}
                    comprovadasRequests={totals.comprovadas}
                />
            )}

            {isRede && (
                <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                    <StatCard
                        title="Pré-Aprovações Pendentes"
                        value={pendingRequests.length}
                        icon={Clock}
                        iconColorHex="#ca8a04"
                    />
                </div>
            )}

            {isRede ? (
                <div>
                    <Card className="overflow-hidden border-0 shadow-sm">
                        <div className="card-header">
                            <h3 className="card-title" style={{ color: '#7c3aed' }}>Solicitações de Apoiadores Pendentes de Pré-Aprovação</h3>
                        </div>
                        {pendingRequests.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="table card-table">
                                    <thead>
                                        <tr>
                                            <th>Protocolo</th>
                                            <th>Solicitante</th>
                                            <th>Evento</th>
                                            <th>Local</th>
                                            <th className="text-center">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pendingRequests.map((req) => (
                                            <tr key={req.id} className="hover:bg-blue-50 transition-colors">
                                                <td className="font-mono text-xs text-gray-500 font-medium text-center">
                                                    {req.protocolo || req.id.slice(0, 8).toUpperCase()}
                                                </td>
                                                <td className="text-gray-900 break-words">
                                                    {req.usuarios?.nome}
                                                </td>
                                                <td className="text-gray-600 max-w-200px break-words" title={req.nome_evento}>{req.nome_evento}</td>
                                                <td className="text-gray-600 break-words" title={req.local_evento}>{req.local_evento}</td>
                                                <td className="text-center">
                                                    <Link
                                                        href={`/dashboard/admin/requests/${req.id}`}
                                                        className="btn btn-primary btn-icon h-8 w-8 flex items-center justify-center rounded-md mx-auto"
                                                        title="Analisar e pré-aprovar"
                                                    >
                                                        <Eye className="w-5 h-5 text-white" />
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-6 text-center">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                                    <Users className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhuma solicitação pendente de Apoiadores</h3>
                                <p className="text-gray-500">Não há solicitações da categoria Apoiador da Rede aguardando pré-aprovação.</p>
                            </div>
                        )}
                        <Pagination section="pending" page={pages.pending} total={totals.pending} />
                    </Card>
                </div>
            ) : (
                <>
                    <CollapsibleSection title="Pendentes de Autorização" defaultOpen={true} id="pending">
                        <Card className="overflow-hidden border-0 shadow-sm">
                            {pendingRequests.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="table card-table">
                                        <thead>
                                            <tr>
                                                <th>Protocolo</th>
                                                <th>Solicitante</th>
                                                <th>Evento</th>
                                                <th>Local</th>
                                                <th>Data Partida</th>
                                                <th className="text-right">Valor Total (R$)</th>
                                                <th className="text-center">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pendingRequests.map((req) => (
                                                <tr key={req.id} className="hover:bg-blue-50 transition-colors">
                                                    <td className="font-mono text-xs text-gray-500 font-medium text-center">
                                                        {req.protocolo || req.id.slice(0, 8).toUpperCase()}
                                                    </td>
                                                    <td className="text-gray-900 break-words">
                                                        {req.usuarios?.nome}
                                                    </td>
                                                    <td className="text-gray-600 max-w-200px break-words" title={req.nome_evento}>{req.nome_evento}</td>
                                                    <td className="text-gray-600 break-words" title={req.local_evento}>{req.local_evento}</td>
                                                    <td className="text-gray-600">
                                                        {req.data_partida ? formatDate(req.data_partida) :
                                                            formatDate(req.data_periodo_inicio)}
                                                    </td>
                                                    <td className="text-gray-900 font-medium text-right">
                                                        {formatCurrency(calcEstimatedValue(req))}
                                                    </td>
                                                    <td className="text-center">
                                                        <Link
                                                            href={`/dashboard/admin/requests/${req.id}`}
                                                            className="btn btn-primary btn-icon h-8 w-8 flex items-center justify-center rounded-md mx-auto"
                                                            title="Analisar solicitação"
                                                        >
                                                            <Eye className="w-5 h-5 text-white" />
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-6 text-center">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                                        <Clock className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhuma solicitação pendente</h3>
                                    <p className="text-gray-500">Todas as solicitações foram processadas.</p>
                                </div>
                            )}
                        </Card>
                    </CollapsibleSection>

                    <CollapsibleSection title="Pré-aprovadas para Autorização Final" defaultOpen={true} id="preApproved">
                        <Card className="overflow-hidden border-0 shadow-sm">
                            {preApprovedRequests.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="table card-table">
                                        <thead>
                                            <tr>
                                                <th style={{ width: '11%' }}>Protocolo</th>
                                                <th style={{ width: '18%' }}>Solicitante</th>
                                                <th style={{ width: '26%' }}>Evento</th>
                                                <th style={{ width: '26%' }}>Local</th>
                                                <th style={{ width: '11%' }}>Pré-autorizador</th>
                                                <th className="text-center" style={{ width: '8%' }}>Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {preApprovedRequests.map((req) => (
                                                <tr key={req.id} className="hover:bg-blue-50 transition-colors">
                                                    <td className="font-mono text-sm text-gray-500 font-medium whitespace-nowrap text-center">
                                                        {req.protocolo || req.id.slice(0, 8).toUpperCase()}
                                                    </td>
                                                    <td className="text-gray-900 break-words">
                                                        {req.usuarios?.nome}
                                                    </td>
                                                    <td className="text-gray-600 break-words" title={req.nome_evento}>{req.nome_evento}</td>
                                                    <td className="text-gray-600 break-words" title={req.local_evento}>{req.local_evento}</td>
                                                    <td className="text-gray-500 text-xs truncate" style={{ maxWidth: '100px' }}>{req.pre_autorizador?.nome || (req.pre_autorizador_cpf ? formatDocumento(req.pre_autorizador_cpf) : '-')}</td>
                                                    <td className="text-center">
                                                        <Link
                                                            href={`/dashboard/admin/requests/${req.id}`}
                                                            className="btn btn-primary btn-icon h-8 w-8 flex items-center justify-center rounded-md mx-auto"
                                                            title="Analisar para autorização final"
                                                        >
                                                            <Eye className="w-5 h-5 text-white" />
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-6 text-center">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                                        <ThumbsUp className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhuma solicitação pré-aprovada</h3>
                                    <p className="text-gray-500">Não há solicitações aguardando autorização final.</p>
                                </div>
                            )}
                            <Pagination section="preApproved" page={pages.preApproved} total={totals.preApproved} />
                        </Card>
                    </CollapsibleSection>

                    <CollapsibleSection title="Pendentes de Correção" defaultOpen={true} id="corrections">
                        <Card className="overflow-hidden border-0 shadow-sm">
                            {pendingCorrections.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="table card-table">
                                        <thead>
                                            <tr>
                                                <th>Protocolo</th>
                                                <th>Solicitante</th>
                                                <th>Evento</th>
                                                <th>Tipo</th>
                                                <th>Motivo da Recusa</th>
                                                <th>Data</th>
                                                <th className="text-center">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pendingCorrections.map((item) => (
                                                <tr key={`${item.type}-${item.id}`} className="hover:bg-blue-50 transition-colors">
                                                    <td className="font-mono text-xs text-gray-500 font-medium text-center">
                                                        {item.protocolo}
                                                    </td>
                                                    <td className="text-gray-900 break-words">
                                                        {item.solicitante}
                                                    </td>
                                                    <td className="text-gray-600 max-w-200px break-words" title={item.evento}>
                                                        {item.evento}
                                                    </td>
                                                    <td>
                                                        <StatusBadge status={item.type === 'solicitacao' ? 'solicitacao' : 'prestacao_contas'} />
                                                    </td>
                                                    <td className="text-gray-600 max-w-250px truncate text-sm" title={item.motivo}>
                                                        {item.motivo || '-'}
                                                    </td>
                                                    <td className="text-gray-600 text-sm">
                                                        {item.data ? formatDate(item.data) : '-'}
                                                    </td>
                                                    <td className="text-center">
                                                        {item.type === 'solicitacao' ? (
                                                            <Link
                                                                href={`/dashboard/admin/requests/${item.id}`}
                                                                className="btn btn-primary btn-icon h-8 w-8 flex items-center justify-center rounded-md mx-auto"
                                                                title="Ver solicitação"
                                                            >
                                                                <Eye className="w-5 h-5 text-white" />
                                                            </Link>
                                                        ) : (
                                                            <Link
                                                                href={`/dashboard/admin/accountability/${item.id}`}
                                                                className="btn btn-primary btn-icon h-8 w-8 flex items-center justify-center rounded-md mx-auto"
                                                                title="Ver prestação de contas"
                                                            >
                                                                <Eye className="w-5 h-5 text-white" />
                                                            </Link>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-6 text-center">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                                        <AlertTriangle className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhuma pendência de correção</h3>
                                    <p className="text-gray-500">Não há correções pendentes no momento.</p>
                                </div>
                            )}
                            <Pagination section="corrections" page={pages.corrections} total={totals.corrections} />
                        </Card>
                    </CollapsibleSection>

                    <CollapsibleSection title="Pendentes de Análise" defaultOpen={true} id="accountabilities">
                        <Card className="overflow-hidden border-0 shadow-sm">
                            {pendingAccountabilities.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="table card-table">
                                        <thead>
                                            <tr>
                                                <th>Protocolo</th>
                                                <th>Solicitante</th>
                                                <th>Evento</th>
                                                <th>Data Envio</th>
                                                <th className="text-right">Valor Aprovado (R$)</th>
                                                <th className="text-center">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pendingAccountabilities.map((acc) => (
                                                <tr key={acc.id} className="hover:bg-blue-50 transition-colors">
                                                    <td className="font-mono text-xs text-gray-500 font-medium text-center">
                                                        {acc.solicitacoes?.protocolo || acc.solicitacoes?.id?.slice(0, 8)?.toUpperCase() || acc.id.slice(0, 8).toUpperCase()}
                                                    </td>
                                                    <td className="text-gray-900 break-words">
                                                        {acc.solicitacoes?.usuarios?.nome || 'N/A'}
                                                    </td>
                                                    <td className="font-medium text-gray-900">
                                                        {acc.solicitacoes?.nome_evento || 'N/A'}
                                                    </td>
                                                    <td className="text-gray-600">
                                                        {formatDateTime(acc.data_envio)}
                                                    </td>
                                                    <td className="text-gray-900 font-medium text-right">
                                                        {formatCurrency(acc.solicitacoes?.valor_a_pagar || 0)}
                                                    </td>
                                                    <td className="text-center">
                                                        <Link
                                                            href={`/dashboard/admin/accountability/${acc.id}`}
                                                            className="btn btn-primary btn-icon h-8 w-8 flex items-center justify-center rounded-md mx-auto"
                                                            title="Analisar prestação de contas"
                                                        >
                                                            <FileText className="w-5 h-5 text-white" />
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-6 text-center">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                                        <FileText className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhuma prestação pendente</h3>
                                    <p className="text-gray-500">Não há prestações de contas para analisar.</p>
                                </div>
                            )}
                            <Pagination section="accountabilities" page={pages.accountabilities} total={totals.accountabilities} />
                        </Card>
                    </CollapsibleSection>

                    <CollapsibleSection title="Solicitações Autorizadas (Pendentes de Comprovação)" defaultOpen={true} id="authorized">
                        <div className="mb-2 flex justify-end">
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Página {pages.authorized}</span>
                        </div>
                        <Card className="overflow-hidden border-0 shadow-sm">
                            {authorizedRequests.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="table card-table">
                                        <thead>
                                            <tr>
                                                <th style={{ width: '8%' }}>Protocolo</th>
                                                <th style={{ width: '13%' }}>Solicitante</th>
                                                <th style={{ width: '18%' }}>Evento</th>
                                                <th style={{ width: '16%' }}>Local</th>
                                                <th style={{ width: '8%' }}>Data Partida</th>
                                                <th style={{ width: '8%' }}>Data Retorno</th>
                                                <th style={{ width: '9%' }}>Data Limite</th>
                                                <th className="text-right" style={{ width: '10%' }}>Valor à Pagar (R$)</th>
                                                <th className="text-center" style={{ width: '3%' }}>PG</th>
                                                <th className="text-center" style={{ width: '3%' }}>Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {authorizedRequests.map((req) => {
                                                const deadline = getDeadline(req.data_retorno || null, req.data_periodo_fim)
                                                const daysRemaining = deadline ? getDaysRemaining(deadline) : null
                                                const color = daysRemaining !== null ? getDeadlineColor(daysRemaining) : null
                                                return (
                                                <tr key={req.id} className="hover:bg-blue-50 transition-colors" style={color ? { borderLeft: `4px solid ${color.border}` } : undefined}>
                                                    <td className="font-mono text-sm text-gray-500 font-medium whitespace-nowrap text-center">
                                                        {req.protocolo || req.id.slice(0, 8).toUpperCase()}
                                                    </td>
                                                    <td className="text-gray-900 break-words">
                                                        {req.usuarios?.nome}
                                                    </td>
                                                    <td className="text-gray-600 break-words" title={req.nome_evento}>{req.nome_evento}</td>
                                                    <td className="text-gray-600 break-words" title={req.local_evento}>{req.local_evento}</td>
                                                    <td className="text-gray-600 whitespace-nowrap">
                                                        {req.data_partida ? formatDate(req.data_partida) :
                                                            formatDate(req.data_periodo_inicio)}
                                                    </td>
                                                    <td className="text-gray-600 whitespace-nowrap">
                                                        {req.data_retorno ? formatDate(req.data_retorno) :
                                                            formatDate(req.data_periodo_fim)}
                                                    </td>
                                                    <td className="whitespace-nowrap" style={color ? { color: color.text } : undefined}>
                                                        {deadline ? (
                                                            <div className="text-xs font-medium leading-tight">
                                                                <div>{deadline.toLocaleDateString('pt-BR')}</div>
                                                                <div className="font-semibold">{color?.label || ''}</div>
                                                            </div>
                                                        ) : '—'}
                                                    </td>
                                                    <td className="text-gray-900 font-medium text-right whitespace-nowrap">
                                                        {formatCurrency(req.valor_a_pagar || 0)}
                                                    </td>
                                                    <td className="text-center">
                                                        {['paga', 'paga_nao_comprovada', 'paga_comprovada'].includes(req.situacao) ? (
                                                            <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-100 border border-green-300" title="Pagamento Registrado">
                                                                <CircleDollarSign className="w-4 h-4" style={{ color: '#16a34a' }} />
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-300">—</span>
                                                        )}
                                                    </td>
                                                    <td className="text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Link
                                                                href={`/dashboard/admin/requests/${req.id}`}
                                                                className="btn btn-primary btn-icon h-8 w-8 flex items-center justify-center rounded-md"
                                                                title="Reabrir/Corrigir Autorização"
                                                            >
                                                                <Pencil className="w-5 h-5 text-white" />
                                                            </Link>
                                                            {req.accountability_id && (
                                                                <QuickPDFViewer accountabilityId={req.accountability_id} />
                                                            )}
                                                            <button
                                                                onClick={() => {
                                                                    setPaymentTarget(req)
                                                                    setDataPagamento(req.data_pagamento || new Date().toISOString().split('T')[0])
                                                                    setValorPagoInput((req.valor_pago || req.valor_a_pagar)?.toFixed(2).replace('.', ',') || '')
                                                                    setPaymentError('')
                                                                }}
                                                                className="btn btn-primary btn-icon h-8 w-8 flex items-center justify-center rounded-md border-0"
                                                                title="Registrar Pagamento"
                                                            >
                                                                <Banknote className="w-5 h-5 text-white" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-6 text-center">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                                        <CheckCircle className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhuma solicitação autorizada</h3>
                                    <p className="text-gray-500">Não há solicitações autorizadas no momento.</p>
                                </div>
                            )}
                            <Pagination section="authorized" page={pages.authorized} total={totals.authorized} />
                        </Card>
                    </CollapsibleSection>

                    <CollapsibleSection title="Comprovadas (Aguardando Pagamento)" defaultOpen={true} id="pendingPayment">
                        <div className="mb-2 flex justify-end">
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Página {pages.pendingPayment}</span>
                        </div>
                        <Card className="overflow-hidden border-0 shadow-sm">
                            {pendingPaymentRequests.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="table card-table">
                                        <thead>
                                            <tr>
                                                <th style={{ width: '10%' }}>Protocolo</th>
                                                <th style={{ width: '20%' }}>Solicitante</th>
                                                <th style={{ width: '38%' }}>Evento</th>
                                                <th style={{ width: '12%' }}>Data Aprovação</th>
                                                <th className="text-right" style={{ width: '12%' }}>Valor à Pagar (R$)</th>
                                                <th className="text-center" style={{ width: '8%' }}>Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pendingPaymentRequests.map((acc: Accountability) => {
                                                const sol = acc.solicitacoes
                                                return (
                                                    <tr key={acc.id} className="hover:bg-blue-50 transition-colors">
                                                        <td className="font-mono text-sm text-gray-500 font-medium whitespace-nowrap text-center">
                                                            {sol?.protocolo || sol?.id?.slice(0, 8).toUpperCase()}
                                                        </td>
                                                        <td className="text-gray-900 break-words">
                                                            {sol?.usuarios?.nome}
                                                        </td>
                                                        <td className="text-gray-600 break-words" title={sol?.nome_evento}>{sol?.nome_evento}</td>
                                                        <td className="text-gray-600 whitespace-nowrap">
                                                            {acc.data_envio ? formatDate(acc.data_envio) : '-'}
                                                        </td>
                                                        <td className="text-gray-900 font-medium text-right whitespace-nowrap">
                                                            {sol?.valor_a_pagar ? formatCurrency(sol.valor_a_pagar) : 'R$ 0,00'}
                                                        </td>
                                                        <td className="text-center">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <Link
                                                                    href={`/dashboard/admin/requests/${sol?.id}`}
                                                                    className="btn btn-primary btn-icon h-8 w-8 flex items-center justify-center rounded-md"
                                                                    title="Abrir Solicitação"
                                                                >
                                                                    <Pencil className="w-5 h-5 text-white" />
                                                                </Link>
                                                                <Link
                                                                    href={`/dashboard/admin/accountability/${acc.id}`}
                                                                    className="btn btn-primary btn-icon h-8 w-8 flex items-center justify-center rounded-md"
                                                                    title="Ver Prestação de Contas"
                                                                >
                                                                    <Receipt className="w-5 h-5 text-white" />
                                                                </Link>
                                                                <button
                                                                    onClick={() => {
                                                                        const req: Request = {
                                                                            id: sol?.id || '',
                                                                            protocolo: sol?.protocolo || '',
                                                                            situacao: 'autorizada',
                                                                            nome_evento: sol?.nome_evento || '',
                                                                            local_evento: '',
                                                                            data_criacao: '',
                                                                            data_periodo_inicio: '',
                                                                            data_periodo_fim: '',
                                                                            valor_a_pagar: sol?.valor_a_pagar,
                                                                            usuarios: sol?.usuarios ? { nome: sol.usuarios.nome } : undefined,
                                                                        }
                                                                        setPaymentTarget(req)
                                                                        setDataPagamento(new Date().toISOString().split('T')[0])
                                                                        setValorPagoInput((sol?.valor_a_pagar || 0)?.toFixed(2).replace('.', ',') || '')
                                                                        setPaymentError('')
                                                                    }}
                                                                    className="btn btn-primary btn-icon h-8 w-8 flex items-center justify-center rounded-md border-0"
                                                                    title="Registrar Pagamento"
                                                                >
                                                                    <Banknote className="w-5 h-5 text-white" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-6 text-center">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                                        <CheckCircle className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhuma solicitação aguardando pagamento</h3>
                                    <p className="text-gray-500">Solicitações com prestação aprovada pendentes de pagamento aparecerão aqui.</p>
                                </div>
                            )}
                            <Pagination section="pendingPayment" page={pages.pendingPayment} total={totals.pendingPayment} />
                        </Card>
                    </CollapsibleSection>

                    <CollapsibleSection title="Comprovadas" defaultOpen={true} id="comprovadas">
                        <div className="mb-2 flex justify-end">
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Página {pages.comprovadas}</span>
                        </div>
                        <Card className="overflow-hidden border-0 shadow-sm">
                            {comprovadasRequests.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="table card-table">
                                        <thead>
                                            <tr>
                                                <th style={{ width: '10%' }}>Protocolo</th>
                                                <th style={{ width: '14%' }}>Solicitante</th>
                                                <th style={{ width: '40%' }}>Evento</th>
                                                <th className="text-center" style={{ width: '12%' }}>Data Pagamento</th>
                                                <th className="text-right" style={{ width: '10%' }}>Valor Pago (R$)</th>
                                                <th className="text-center" style={{ width: '8%' }}>Situação</th>
                                                <th className="text-center" style={{ width: '6%' }}>Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {comprovadasRequests.map((req) => (
                                                <tr key={req.id} className="hover:bg-blue-50 transition-colors">
                                                    <td className="font-mono text-sm text-gray-500 font-medium whitespace-nowrap text-center">
                                                        {req.protocolo || req.id.slice(0, 8).toUpperCase()}
                                                    </td>
                                                    <td className="text-gray-900 break-words">
                                                        {req.usuarios?.nome}
                                                    </td>
                                                    <td className="text-gray-600 break-words" title={req.nome_evento}>{req.nome_evento}</td>
                                                    <td className="text-gray-600 text-center whitespace-nowrap">
                                                        {req.data_pagamento ? formatDate(req.data_pagamento) : '-'}
                                                    </td>
                                                    <td className="text-gray-900 font-medium text-right whitespace-nowrap">
                                                        {req.valor_pago ? formatCurrency(req.valor_pago) : '-'}
                                                    </td>
                                                    <td className="text-center">
                                                        <StatusBadge status={req.situacao} />
                                                    </td>
                                                    <td className="text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <Link
                                                                href={`/dashboard/admin/requests/${req.id}`}
                                                                className="btn btn-primary btn-icon h-8 w-8 flex items-center justify-center rounded-md"
                                                                title="Visualizar solicitação"
                                                            >
                                                                <Eye className="w-5 h-5 text-white" />
                                                            </Link>
                                                            {req.accountability_id && (
                                                                <Link
                                                                    href={`/dashboard/admin/accountability/${req.accountability_id}`}
                                                                    className="btn btn-outline btn-icon h-8 w-8 flex items-center justify-center rounded-md"
                                                                    title="Ver prestação de contas"
                                                                >
                                                                    <Receipt className="w-4 h-4" />
                                                                </Link>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-6 text-center">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                                        <CheckCircle className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhuma solicitação comprovada</h3>
                                    <p className="text-gray-500">As solicitações finalizadas aparecerão aqui.</p>
                                </div>
                            )}
                            <Pagination section="comprovadas" page={pages.comprovadas} total={totals.comprovadas} />
                        </Card>
                    </CollapsibleSection>

                    <Modal isOpen={!!paymentTarget} onClose={() => setPaymentTarget(null)} title={paymentTarget && ['paga', 'paga_nao_comprovada', 'paga_comprovada'].includes(paymentTarget.situacao) ? 'Editar Pagamento' : 'Registrar Pagamento'}>
                        {paymentTarget && (
                            <div className="space-y-4">
                                <p className="text-sm text-gray-600">
                                    <strong>Protocolo:</strong> {paymentTarget.protocolo} — {paymentTarget.usuarios?.nome}
                                </p>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-900">Data do Pagamento</label>
                                    <input
                                        type="date"
                                        value={dataPagamento}
                                        onChange={(e) => setDataPagamento(e.target.value)}
                                        className="w-full px-3 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500/20 input bg-white text-lg font-medium h-12"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-900">Valor Pago (R$)</label>
                                    <input
                                        type="text"
                                        value={valorPagoInput}
                                        onChange={(e) => setValorPagoInput(formatCurrencyInput(e.target.value))}
                                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500/20 font-bold text-lg input bg-white"
                                    />
                                </div>
                                {paymentError && (
                                    <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">{paymentError}</p>
                                )}
                                <div className="flex gap-3 pt-4 border-t border-gray-200">
                                    <button
                                        onClick={() => setPaymentTarget(null)}
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                                        disabled={paymentLoading}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (!paymentTarget) return
                                            if (!dataPagamento) { setPaymentError('Informe a data do pagamento.'); return }
                                            if (!valorPagoInput) { setPaymentError('Informe o valor pago.'); return }
                                            setPaymentLoading(true)
                                            setPaymentError('')
                                            const isEdit = ['paga', 'paga_nao_comprovada', 'paga_comprovada'].includes(paymentTarget.situacao)
                                            const result = isEdit
                                                ? await updatePaymentInfo(paymentTarget.id, dataPagamento, parseCurrencyInput(valorPagoInput))
                                                : await registerPayment(paymentTarget.id, dataPagamento, parseCurrencyInput(valorPagoInput))
                                            setPaymentLoading(false)
                                            if (result.success) {
                                                setPaymentTarget(null)
                                                setRefreshKey(k => k + 1)
                                            } else {
                                                setPaymentError(result.message || 'Erro ao registrar pagamento.')
                                            }
                                        }}
                                        disabled={paymentLoading}
                                        className="flex-1 px-4 py-2 rounded-md text-white transition-colors"
                                        style={{ backgroundColor: '#15803d' }}
                                    >
                                        {paymentLoading
                                            ? 'Salvando...'
                                            : ['paga', 'paga_nao_comprovada', 'paga_comprovada'].includes(paymentTarget.situacao)
                                                ? 'Salvar'
                                                : 'Confirmar Pagamento'
                                        }
                                    </button>
                                </div>
                            </div>
                        )}
                    </Modal>
                </>
            )}
        </div >
    )
}
