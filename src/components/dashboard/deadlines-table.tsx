'use client'

import { FileText, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { TableRow } from '@/components/dashboard/table-row'

interface ApprovedRequest {
    id: string
    protocolo?: string | null
    nome_evento: string
    data_retorno?: string | null
}

interface DeadlinesTableProps {
    approvedRequests: ApprovedRequest[]
}

export function DeadlinesTable({ approvedRequests }: DeadlinesTableProps) {
    return (
        <Card className="overflow-hidden border-0 shadow-sm">
            <div className="card-header">
                <h3 className="card-title">Prazos de Prestação de Contas</h3>
            </div>
            {approvedRequests && approvedRequests.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="table card-table">
                        <thead>
                            <tr>
                                <th>Protocolo</th>
                                <th>Evento</th>
                                <th>Limite</th>
                                <th className="text-center">Ação</th>
                            </tr>
                        </thead>
                        <tbody>
                            {approvedRequests?.map((req: ApprovedRequest, index: number) => {
                                const [y, m, d] = (req.data_retorno || '').split('T')[0].split('-').map(Number)
                                const dataRetorno = new Date(y, m - 1, d)
                                const deadline = new Date(dataRetorno)
                                deadline.setDate(dataRetorno.getDate() + 5)
                                const isLate = new Date() > deadline

                                return (
                                    <TableRow key={req.id} index={index}>
                                        <td className="font-mono text-xs text-gray-500 font-medium text-center">
                                            {req.protocolo || req.id.slice(0, 8)}
                                        </td>
                                        <td className="font-medium text-gray-900 break-words" title={req.nome_evento}>
                                            {req.nome_evento}
                                        </td>
                                        <td className={`font-medium ${isLate ? 'text-red-600' : 'text-green-600'}`}>
                                            {deadline.toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="text-center">
                                            <Link
                                                href={`/dashboard/accountability/${req.id}`}
                                                className="btn btn-primary btn-icon h-8 w-8 flex items-center justify-center rounded-md mx-auto"
                                                title="Prestar Contas"
                                            >
                                                <FileText className="w-5 h-5 text-white" />
                                            </Link>
                                        </td>
                                    </TableRow>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">Nenhuma prestação de contas pendente</p>
                </div>
            )}
        </Card>
    )
}
