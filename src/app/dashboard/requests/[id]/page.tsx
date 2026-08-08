import Link from 'next/link'
import { createClient, createAdminClient } from '@/lib/appwrite/server'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Calendar, MapPin, Plane, Car, Hotel, AlertCircle, HandHeart, Info, FileText } from 'lucide-react'
import { StatusBadge } from '@/components/ui/status-badge'
import { AccountabilityFilesList } from '@/components/dashboard/accountability-files-list'
import { formatDate, safeJsonParse, AuxilioTerceiro } from '@/lib/format-utils'

export default async function RequestDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const { databases } = createAdminClient()
    const dbId = process.env.APPWRITE_DATABASE_ID!

    let request: any = null
    try {
        request = await databases.getDocument(dbId, 'solicitacoes', id)
    } catch {
        // not found
    }

    let distanciaData = null
    if (request?.distancia_id) {
        try {
            distanciaData = await databases.getDocument(dbId, 'distancias', String(request.distancia_id))
        } catch {
            // ignore
        }
    }

    let accountabilityData: any = null
    const relevantStatuses = ['concluida', 'em_avaliacao', 'rejeitada', 'prestacao_comprovada', 'em_analise', 'paga_nao_comprovada', 'paga_comprovada']
    if (request && relevantStatuses.includes(request.situacao)) {
        try {
            const { documents } = await databases.listDocuments(dbId, 'prestacao_contas', [])
            const found = documents.find(d => d.solicitacao_id === id)
            if (found) {
                const { documents: arquivos } = await databases.listDocuments(dbId, 'pc_arquivos', [])
                accountabilityData = { ...found, arquivos: arquivos.filter(a => a.prestacao_contas_id === found.$id) }
            }
        } catch {
            // ignore
        }
    }

    const combinedRequest = request ? { ...request, distancias: distanciaData } : null

    if (!combinedRequest) {
        return (
            <div className="flex flex-col items-center justify-center h-96">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <h2 className="text-xl font-semibold text-gray-900">Solicitação não encontrada</h2>
                <Link href="/dashboard/requests" className="mt-4 text-primary hover:underline">
                    Voltar para lista
                </Link>
            </div>
        )
    }

    let auxilios: AuxilioTerceiro[] = safeJsonParse<AuxilioTerceiro[]>(combinedRequest.auxilios_terceiros, [])

    return (
        <div className="max-w-5xl mx-auto space-y-4 md:space-y-6 lg:space-y-8 pb-12">
            <div>
                <Link href="/dashboard" className="text-gray-500 hover:text-gray-900 flex items-center gap-2 mb-4 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                    Voltar
                </Link>
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Detalhes da Solicitação</h1>
                        <div className="flex items-center gap-3 mt-1">
                            <p className="text-sm text-gray-500 font-mono">ID: {combinedRequest.protocolo || combinedRequest.$id}</p>
                            <StatusBadge status={combinedRequest.situacao} />
                        </div>
                    </div>
                    {(combinedRequest.situacao === 'pendente' || combinedRequest.situacao === 'rejeitada' || combinedRequest.situacao === 'retificada') && (
                        <Link
                            href={`/dashboard/requests/${id}/edit`}
                            className={`btn btn-outline inline-flex items-center gap-2 px-4 py-2 text-sm font-medium ${combinedRequest.situacao === 'rejeitada' ? 'border-amber-300 text-amber-700 hover:bg-amber-50' : ''}`}
                        >
                            {combinedRequest.situacao === 'rejeitada' ? 'Corrigir e Reenviar' : 'Editar Solicitação'}
                        </Link>
                    )}
                </div>
            </div>

            {combinedRequest.situacao === 'rejeitada' && combinedRequest.motivo_recusa && (
                <Card className="p-6 border-2 border-red-300" style={{ backgroundColor: '#fef2f2' }}>
                    <div className="flex items-start gap-4">
                        <div className="flex items-center justify-center rounded-full" style={{ backgroundColor: '#fee2e2', width: '48px', height: '48px', minWidth: '48px' }}>
                            <AlertCircle className="w-7 h-7 text-red-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-red-800 mb-2">Solicitação Recusada</h3>
                            <p className="text-base text-red-700 leading-relaxed">
                                <span className="font-semibold">Motivo:</span> {combinedRequest.motivo_recusa}
                            </p>
                        </div>
                    </div>
                </Card>
            )}

            {combinedRequest.situacao === 'cancelada' && combinedRequest.motivo_cancelamento && (
                <Card className="p-6 border-2 border-red-300" style={{ backgroundColor: '#fef2f2' }}>
                    <div className="flex items-start gap-4">
                        <div className="flex items-center justify-center rounded-full" style={{ backgroundColor: '#fee2e2', width: '48px', height: '48px', minWidth: '48px' }}>
                            <AlertCircle className="w-7 h-7 text-red-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-red-800 mb-2">Solicitação Cancelada</h3>
                            <div className="text-base text-red-700 leading-relaxed whitespace-pre-wrap">
                                <span className="font-semibold">Motivo:</span>{'\n'}{combinedRequest.motivo_cancelamento}
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="md:col-span-2" style={{ backgroundColor: '#fefce8' }}>
                    <div className="card-header">
                        <h3 className="card-title flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-primary" />
                            Dados do Evento
                        </h3>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-sm font-medium text-primary">Nome do Evento</label>
                                <p className="text-base font-medium text-gray-900 mt-1">{combinedRequest.nome_evento}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-primary">Tipo</label>
                                <p className="text-base font-medium text-gray-900 mt-1">{combinedRequest.tipo_evento}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-primary">Local</label>
                                <div className="flex items-center gap-2 mt-1">
                                    <MapPin className="w-4 h-4 text-gray-400" />
                                    <p className="text-base font-medium text-gray-900">{combinedRequest.local_evento}</p>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-primary">Instituição Executora</label>
                                <p className="text-base font-medium text-gray-900 mt-1">{combinedRequest.instituicao_executora}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-primary">Início</label>
                                <p className="text-base font-medium text-gray-900 mt-1">{formatDate(combinedRequest.data_periodo_inicio)}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-primary">Fim</label>
                                <p className="text-base font-medium text-gray-900 mt-1">{formatDate(combinedRequest.data_periodo_fim)}</p>
                            </div>
                        </div>
                    </div>
                </Card>

                <Card className="bg-blue-50">
                    <div className="card-header">
                        <h3 className="card-title flex items-center gap-2">
                            <Car className="w-5 h-5 text-primary" />
                            Deslocamento
                        </h3>
                    </div>
                    <div className="p-6">
                        <div className="space-y-6">
                            <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">Terrestre</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-lg">
                                    <div>
                                        <label className="text-sm font-medium text-primary">Origem</label>
                                        <p className="font-medium text-gray-900">{combinedRequest.cidade_origem}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-primary">Destino</label>
                                        <p className="font-medium text-gray-900">{combinedRequest.cidade_destino}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-primary">Data Partida</label>
                                        <p className="font-medium text-gray-900">{formatDate(combinedRequest.data_partida)}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-primary">Data Retorno</label>
                                        <p className="font-medium text-gray-900">{formatDate(combinedRequest.data_retorno)}</p>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-sm font-medium text-primary">Distância (Tabela)</label>
                                        <p className="font-medium text-gray-900">
                                            {combinedRequest.distancias ? `${combinedRequest.distancias.distancia || ''} (R$ ${combinedRequest.distancias.valor || 0})` : 'Não informado'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {combinedRequest.tem_aereo && (
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider flex items-center gap-2">
                                        <Plane className="w-4 h-4 text-primary" /> Aéreo
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
                                        <div>
                                            <label className="text-sm font-medium text-blue-700">Voo de Ida</label>
                                            <p className="font-medium text-blue-900">{combinedRequest.voo_ida}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-blue-700">Voo de Volta</label>
                                            <p className="font-medium text-blue-900">{combinedRequest.voo_volta}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>

                <div className="space-y-6">
                    <Card className="bg-amber-50">
                        <div className="card-header">
                            <h3 className="card-title flex items-center gap-2">
                                <HandHeart className="w-5 h-5 text-primary" />
                                Auxílios de Terceiros
                            </h3>
                        </div>
                        <div className="p-6">
                            {auxilios && auxilios.length > 0 ? (
                                <ul className="space-y-3">
                                    {auxilios.map((aux: any, index: number) => (
                                        <li key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                                            <span className="text-gray-700">{aux.tipo}</span>
                                            <span className="font-semibold bg-white px-2 py-1 rounded border shadow-sm">
                                                {aux.quantidade}x
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-500 text-sm italic">Nenhum auxílio de terceiro informado.</p>
                            )}
                        </div>
                    </Card>

                    <Card className="bg-purple-50">
                        <div className="card-header">
                            <h3 className="card-title flex items-center gap-2">
                                <Info className="w-5 h-5 text-primary" />
                                Outras Informações
                            </h3>
                        </div>
                        <div className="p-6">
                            <div className="space-y-6">
                                <div className="flex items-start gap-3">
                                    <Hotel className={`w-5 h-5 ${combinedRequest.hospedagem_cosems ? 'text-green-600' : 'text-gray-400'}`} />
                                    <div>
                                        <p className="font-medium text-gray-900">Hospedagem COSEMS</p>
                                        <p className="text-sm text-gray-500">
                                            {combinedRequest.hospedagem_cosems ? 'Sim, custeada pelo COSEMS' : 'Não solicitada'}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-500 mb-2 block">Observações</label>
                                    <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 whitespace-pre-wrap border border-gray-100">
                                        {combinedRequest.observacoes || 'Nenhuma observação registrada.'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {accountabilityData && accountabilityData.arquivos && accountabilityData.arquivos.length > 0 && (
                    <Card className="md:col-span-2 bg-blue-50">
                        <div className="card-header">
                            <h3 className="card-title flex items-center gap-2">
                                <FileText className="w-5 h-5 text-primary" />
                                Prestação de Contas - Arquivos Anexados
                            </h3>
                        </div>
                        <div className="p-6">
                            <AccountabilityFilesList files={accountabilityData.arquivos} />
                        </div>
                    </Card>
                )}
            </div>
        </div>
    )
}
