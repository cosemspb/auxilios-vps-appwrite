'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Eye, FileText, Pencil } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { TableRow } from '@/components/dashboard/table-row'
import { formatDate } from '@/lib/format-utils'

export function RequestsList({ requests }: { requests: any[] }) {
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')

    const filteredRequests = requests.filter(req => {
        const matchesSearch = req.nome_evento?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.protocolo?.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'autorizada'
                ? ['autorizada', 'paga', 'paga_nao_comprovada', 'paga_comprovada'].includes(req.situacao)
                : req.situacao === statusFilter)
        return matchesSearch && matchesStatus
    })

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Minhas Solicitações</h1>
                    <p className="text-gray-500">Gerencie e acompanhe seus pedidos de auxílio</p>
                </div>
                <Link href="/dashboard/requests/new">
                    <button className="btn btn-primary w-full md:w-auto flex items-center justify-center gap-2">
                        <Plus className="w-4 h-4" />
                        Nova Solicitação
                    </button>
                </Link>
            </div>

            <Card className="p-0 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <div className="flex flex-col md:flex-row md:items-center gap-2">
                        <span className="text-sm font-medium text-primary whitespace-nowrap">
                            Filtrar por situação:
                        </span>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="input h-10 w-full"
                        >
                            <option value="all">Todas as situações</option>
                            <option value="pendente">Pendente</option>
                            <option value="retificada">Retificada</option>
                            <option value="pre_aprovada">Pré-aprovada</option>
                            <option value="autorizada">Autorizada</option>
                            <option value="rejeitada">Rejeitada</option>
                            <option value="em_avaliacao">Em Avaliação</option>
                            <option value="concluida">Comprovada</option>
                        </select>
                    </div>

                    <div className="relative">
                        <Search className="w-4 h-4 absolute text-gray-400 pointer-events-none" style={{ left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                        <input
                            type="text"
                            placeholder="Buscar solicitações..."
                            className="input h-10 w-full"
                            style={{ paddingLeft: '48px' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div></div>
                </div>

                {filteredRequests?.length > 0 && (
                    <div className="divide-y divide-gray-100 md:hidden">
                        {filteredRequests?.map((request) => (
                            <div key={request.$id} className="p-4 space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                        <p className="font-mono text-xs text-gray-500">
                                            {request.protocolo || request.$id.slice(0, 8)}
                                        </p>
                                        <p className="font-medium text-gray-900 break-words mt-1">
                                            {request.nome_evento}
                                        </p>
                                        <p className="text-xs text-gray-500">{request.tipo_evento}</p>
                                    </div>
                                    <StatusBadge status={request.situacao} />
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                                    <span>Partida: {request.data_partida ? formatDate(request.data_partida) : '-'}</span>
                                    <span>Retorno: {request.data_retorno ? formatDate(request.data_retorno) : '-'}</span>
                                </div>
                                <div className="flex gap-2 pt-1">
                                    <Link href={`/dashboard/requests/${request.$id}`}>
                                        <span className="text-xs font-medium px-3 py-1.5 rounded-md inline-block"
                                            style={{ color: 'var(--primary)', backgroundColor: 'var(--primary-light)' }}>
                                            Ver detalhes
                                        </span>
                                    </Link>
                                    {['pendente', 'retificada', 'rejeitada'].includes(request.situacao) && (
                                        <Link href={`/dashboard/requests/${request.$id}/edit`}>
                                            <span className="text-xs font-medium px-3 py-1.5 rounded-md inline-block border border-gray-300 text-gray-700">
                                                {request.situacao === 'rejeitada' ? 'Corrigir e Reenviar' : 'Editar'}
                                            </span>
                                        </Link>
                                    )}
                                    {['autorizada', 'paga', 'paga_nao_comprovada', 'paga_comprovada'].includes(request.situacao) && (
                                        <Link href={`/dashboard/accountability/${request.$id}`}>
                                            <span className="text-xs font-medium px-3 py-1.5 rounded-md inline-block"
                                                style={{ color: 'var(--primary)', backgroundColor: 'var(--primary-light)' }}>
                                                Prest. Contas
                                            </span>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="overflow-x-auto hidden md:block">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
                            <tr>
                                <th className="p-4">Protocolo</th>
                                <th className="p-4">Evento</th>
                                <th className="p-4">Data Partida</th>
                                <th className="p-4">Data Retorno</th>
                                <th className="p-4">Situação</th>
                                <th className="p-4 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredRequests?.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-500">
                                        Nenhuma solicitação encontrada.
                                    </td>
                                </tr>
                            ) : (
                                filteredRequests?.map((request, index) => (
                                    <TableRow key={request.$id} index={index}>
                                        <td className="p-4 font-mono text-xs text-gray-500 text-center">
                                            {request.protocolo || request.$id.slice(0, 8)}
                                        </td>
                                        <td className="p-4 font-medium text-gray-900 max-w-220px break-words">
                                            {request.nome_evento}
                                            <div className="text-xs text-gray-500">{request.tipo_evento}</div>
                                        </td>
                                        <td className="p-4 text-gray-600">
                                            {request.data_partida ? formatDate(request.data_partida) : '-'}
                                        </td>
                                        <td className="p-4 text-gray-600">
                                            {request.data_retorno ? formatDate(request.data_retorno) : '-'}
                                        </td>
                                        <td className="p-4">
                                            <StatusBadge status={request.situacao} />
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-2" style={{ minWidth: '104px' }}>
                                                <Link href={`/dashboard/requests/${request.$id}`}>
                                                    <button
                                                        className="btn btn-primary btn-icon h-8 w-8 flex items-center justify-center rounded-md"
                                                        title="Visualizar solicitação"
                                                    >
                                                        <Eye className="w-5 h-5 text-white" />
                                                    </button>
                                                </Link>
                                                {['pendente', 'retificada', 'rejeitada'].includes(request.situacao) && (
                                                    <Link href={`/dashboard/requests/${request.$id}/edit`}>
                                                        <button
                                                            className="btn btn-outline btn-icon h-8 w-8 flex items-center justify-center rounded-md"
                                                            title={request.situacao === 'rejeitada' ? 'Corrigir e Reenviar' : 'Editar solicitação'}
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                    </Link>
                                                )}
                                                {['autorizada', 'paga', 'paga_nao_comprovada', 'paga_comprovada'].includes(request.situacao) && (
                                                    <Link href={`/dashboard/accountability/${request.$id}`}>
                                                        <button
                                                            className="btn btn-primary btn-icon h-8 w-8 flex items-center justify-center rounded-md"
                                                            title="Prestação de Contas"
                                                        >
                                                            <FileText className="w-5 h-5 text-white" />
                                                        </button>
                                                    </Link>
                                                )}
                                            </div>
                                        </td>
                                    </TableRow>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {filteredRequests?.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                        Nenhuma solicitação encontrada.
                    </div>
                )}
            </Card>
        </div>
    )
}
