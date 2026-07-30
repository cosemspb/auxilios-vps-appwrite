import Link from 'next/link'
import { createAdminClient } from '@/lib/appwrite/server'
import { Card } from '@/components/ui/card'
import { CheckCircle, XCircle, Eye } from 'lucide-react'
import { formatDate, formatDocumento } from '@/lib/format-utils'

export default async function ApprovalsPage() {
    const { databases } = createAdminClient()
    const dbId = process.env.APPWRITE_DATABASE_ID!

    let requests: any[] = []
    try {
        const { documents } = await databases.listDocuments(dbId, 'solicitacoes', [])
        requests = documents.filter(d => ['pendente', 'retificada'].includes(d.situacao))
    } catch {
        // ignore
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Painel de Aprovação</h1>
                <p className="text-gray-500">Avalie as solicitações pendentes</p>
            </div>

            <Card className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
                            <tr>
                                <th className="p-4">Solicitante</th>
                                <th className="p-4">Evento</th>
                                <th className="p-4">Data Início</th>
                                <th className="p-4">Valor Est. (R$)</th>
                                <th className="p-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {requests?.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-500">
                                        Nenhuma solicitação pendente.
                                    </td>
                                </tr>
                            ) : (
                                requests?.map((request) => (
                                    <tr key={request.$id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 font-medium text-gray-900">
                                            {request.usuarios?.nome || formatDocumento(request.usuario_cpf)}
                                        </td>
                                        <td className="p-4 text-gray-600">
                                            {request.nome_evento}
                                        </td>
                                        <td className="p-4 text-gray-600">
                                            {formatDate(request.data_periodo_inicio)}
                                        </td>
                                        <td className="p-4 text-gray-600">
                                            0,00
                                        </td>
                                        <td className="p-4 text-center">
                                            <Link href={`/dashboard/requests/${request.$id}`}>
                                                <button className="btn btn-outline p-2 h-8 w-8 flex items-center justify-center rounded-full text-blue-600 hover:bg-blue-50 hover:border-blue-200">
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    )
}
