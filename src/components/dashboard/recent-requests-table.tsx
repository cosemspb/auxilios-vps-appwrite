'use client'

import { Eye, Pencil, Plus, FileText, Download } from 'lucide-react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { TableRow } from '@/components/dashboard/table-row'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatDate, formatDateTime } from '@/lib/format-utils'

interface RecentRequest {
    id: string
    protocolo?: string | null
    nome_evento: string
    situacao: string
    data_criacao?: string | null
    data_partida?: string | null
    data_retorno?: string | null
    prestacao_contas?: { id: string }[]
}

interface RecentRequestsTableProps {
    recentRequests: RecentRequest[]
}

export function RecentRequestsTable({ recentRequests }: RecentRequestsTableProps) {
    return (
        <div>
            <Card className="overflow-hidden border-0 shadow-sm">
                <div className="card-header">
                    <h3 className="card-title">Minhas Solicitações Recentes</h3>
                    <div className="card-actions">
                        <Link href="/dashboard/requests" className="text-sm text-primary hover:underline font-medium">
                            Ver todas
                        </Link>
                    </div>
                </div>

                {recentRequests && recentRequests.length > 0 ? (
                    <>
                        {/* Mobile card list */}
                        <div className="divide-y divide-gray-100 md:hidden">
                            {recentRequests?.map((req: RecentRequest) => (
                                <div key={req.id} className="p-4 space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            <p className="font-mono text-xs text-gray-500">
                                                {req.protocolo || req.id.slice(0, 8)}
                                            </p>
                                            <p className="font-medium text-gray-900 break-words mt-1">
                                                {req.nome_evento}
                                            </p>
                                        </div>
                                        <StatusBadge status={req.situacao} />
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                        <span>Solicitação: {req.data_criacao ? formatDate(req.data_criacao) : '-'}</span>
                                        <span>Partida: {req.data_partida ? formatDate(req.data_partida) : '-'}</span>
                                        <span>Retorno: {req.data_retorno ? formatDate(req.data_retorno) : '-'}</span>
                                    </div>
                                    <div className="flex gap-2 pt-1">
                                        <Link
                                            href={`/dashboard/requests/${req.id}`}
                                            className="text-xs font-medium px-3 py-1.5 rounded-md"
                                            style={{ color: 'var(--primary)', backgroundColor: 'var(--primary-light)' }}
                                        >
                                            Ver detalhes
                                        </Link>
                                        {['pendente', 'retificada'].includes(req.situacao) && (
                                            <Link
                                                href={`/dashboard/requests/${req.id}/edit`}
                                                className="text-xs font-medium px-3 py-1.5 rounded-md border border-gray-300 text-gray-700"
                                            >
                                                Editar
                                            </Link>
                                        )}
                                        {['autorizada', 'paga', 'paga_nao_comprovada'].includes(req.situacao) && (
                                            <Link
                                                href={`/dashboard/accountability/${req.id}`}
                                                className="text-xs font-medium px-3 py-1.5 rounded-md"
                                                style={{ color: 'var(--primary)', backgroundColor: 'var(--primary-light)' }}
                                            >
                                                Prest. Contas
                                            </Link>
                                        )}
                                        {['em_avaliacao', 'paga_comprovada'].includes(req.situacao) && req.prestacao_contas?.[0] && (
                                            <Link
                                                href={`/dashboard/accountability/${req.id}`}
                                                className="text-xs font-medium px-3 py-1.5 rounded-md"
                                                style={{ backgroundColor: '#dcfce7', color: '#15803d' }}
                                            >
                                                <Download className="w-3 h-3 inline mr-1" />
                                                Baixar
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop table */}
                        <div className="overflow-x-auto hidden md:block">
                            <table className="table card-table">
                                <thead>
                                    <tr>
                                        <th className="text-center">Protocolo</th>
                                        <th>Evento</th>
                                        <th className="text-center">Data Solicitação</th>
                                        <th className="text-center">Data Partida</th>
                                        <th className="text-center">Data Retorno</th>
                                        <th>Situação</th>
                                        <th className="text-center">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentRequests?.map((req: RecentRequest, index: number) => (
                                        <TableRow key={req.id} index={index}>
                                            <td className="font-mono text-xs text-gray-500 font-medium text-center">
                                                {req.protocolo || req.id.slice(0, 8)}
                                            </td>
                                            <td className="font-medium text-gray-900 max-w-220px break-words">
                                                {req.nome_evento}
                                            </td>
                                            <td className="text-gray-600 text-center">
                                                {req.data_criacao ? formatDateTime(req.data_criacao) : '-'}
                                            </td>
                                            <td className="text-gray-600 text-center">
                                                {req.data_partida ? formatDate(req.data_partida) : '-'}
                                            </td>
                                            <td className="text-gray-600 text-center">
                                                {req.data_retorno ? formatDate(req.data_retorno) : '-'}
                                            </td>
                                            <td>
                                                <StatusBadge status={req.situacao} />
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <Link
                                                        href={`/dashboard/requests/${req.id}`}
                                                        className="btn btn-primary btn-icon h-8 w-8 flex items-center justify-center rounded-md"
                                                        title="Ver detalhes"
                                                    >
                                                        <Eye className="w-5 h-5 text-white" />
                                                    </Link>
                                                    {['pendente', 'retificada'].includes(req.situacao) && (
                                                        <Link
                                                            href={`/dashboard/requests/${req.id}/edit`}
                                                            className="btn btn-outline btn-icon h-8 w-8 flex items-center justify-center rounded-md"
                                                            title="Editar solicitação"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </Link>
                                                    )}
                                                    {['autorizada', 'paga', 'paga_nao_comprovada'].includes(req.situacao) && (
                                                        <Link
                                                            href={`/dashboard/accountability/${req.id}`}
                                                            className="btn btn-primary btn-icon h-8 w-8 flex items-center justify-center rounded-md"
                                                            title="Prestação de Contas"
                                                        >
                                                            <FileText className="w-5 h-5 text-white" />
                                                        </Link>
                                                    )}
                                                    {['em_avaliacao', 'paga_comprovada'].includes(req.situacao) && req.prestacao_contas?.[0] && (
                                                        <Link
                                                            href={`/dashboard/accountability/${req.id}`}
                                                            className="btn btn-success btn-icon h-8 w-8 flex items-center justify-center rounded-md"
                                                            title="Baixar relatório de prestação"
                                                        >
                                                            <Download className="w-5 h-5 text-white" />
                                                        </Link>
                                                    )}
                                                </div>
                                            </td>
                                        </TableRow>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <FileText className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhuma solicitação encontrada</h3>
                        <p className="text-gray-500 mb-6">Você ainda não criou nenhuma solicitação de auxílio.</p>
                        <Link href="/dashboard/requests/new">
                            <button className="btn btn-primary">
                                <Plus className="w-4 h-4 mr-2" />
                                Criar primeira solicitação
                            </button>
                        </Link>
                    </div>
                )}
            </Card>
        </div>
    )
}
