import { getAccountabilityDetails } from '@/app/actions/admin-actions'
import { AccountabilityAnalysisForm } from './accountability-analysis-form'
import { AdminPDFViewer } from '@/components/accountability/admin-pdf-viewer'
import { ArrowLeft, FileText, Download } from 'lucide-react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { AccountabilityFilesList } from '@/components/dashboard/accountability-files-list'
import { notFound } from 'next/navigation'
import { formatDate, formatDateTime } from '@/lib/format-utils'

export default async function AccountabilityAnalysisPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const accountability = await getAccountabilityDetails(id)

    if (!accountability) {
        notFound()
    }

    const request = accountability.solicitacoes

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="mb-6">
                <Link href="/dashboard" className="text-gray-500 hover:text-gray-900 flex items-center gap-2 mb-4 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Voltar para o Dashboard
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Análise de Prestação de Contas</h1>
                <p className="text-gray-500">Protocolo: {request?.protocolo || 'N/A'}</p>
            </div>

            <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Dados da Solicitação</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-gray-600">Solicitante</label>
                        <p className="text-gray-900">{request?.usuarios?.nome}</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-600">E-mail</label>
                        <p className="text-gray-900">{request?.usuarios?.email}</p>
                    </div>
                    <div className="md:col-span-2">
                        <label className="text-sm font-medium text-gray-600">Evento</label>
                        <p className="text-gray-900">{request?.nome_evento}</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-600">Data de Partida</label>
                        <p className="text-gray-900">
                            {request?.data_partida ? formatDate(request.data_partida) :
                                request?.data_periodo_inicio ? formatDate(request.data_periodo_inicio) : 'N/A'}
                        </p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-600">Data de Retorno</label>
                        <p className="text-gray-900">
                            {request?.data_retorno ? formatDate(request.data_retorno) :
                                request?.data_periodo_fim ? formatDate(request.data_periodo_fim) : 'N/A'}
                        </p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-600">Cidade de Origem</label>
                        <p className="text-gray-900">{request?.cidade_origem || 'Não informado'}</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-600">Cidade de Destino</label>
                        <p className="text-gray-900">{request?.cidade_destino || 'Não informado'}</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-600">Data de Envio da Prestação</label>
                        <p className="text-gray-900">{formatDateTime(accountability.data_envio)}</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-600">Valor Pago</label>
                        <p className="text-gray-900 font-semibold">
                            R$ {request?.valor_a_pagar?.toFixed(2).replace('.', ',') || '0,00'}
                        </p>
                    </div>
                </div>
            </Card>

            {accountability.objetivo_participacao && (
                <Card className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Objetivo de Participação</h2>
                    <p className="text-gray-700 whitespace-pre-wrap">{accountability.objetivo_participacao}</p>
                </Card>
            )}

            <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Atividades Realizadas</h2>
                <p className="text-gray-700 whitespace-pre-wrap">
                    {accountability.atividades_realizadas || 'Nenhuma atividade informada'}
                </p>
            </Card>

            <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Arquivos Anexados</h2>
                <AccountabilityFilesList files={accountability.arquivos || []} />
            </Card>

            <Card className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Relatório de Prestação de Contas</h2>
                        <p className="text-sm text-gray-500">Clique abaixo para baixar o relatório completo em PDF.</p>
                    </div>
                    <AdminPDFViewer
                        accountabilityId={id}
                        request={{
                            id: request?.id,
                            protocolo: request?.protocolo,
                            nome_evento: request?.nome_evento,
                            tipo_evento: request?.tipo_evento,
                            local_evento: request?.local_evento,
                            data_periodo_inicio: request?.data_periodo_inicio,
                            data_periodo_fim: request?.data_periodo_fim,
                            data_partida: request?.data_partida,
                            data_retorno: request?.data_retorno,
                            cidade_origem: request?.cidade_origem,
                            cidade_destino: request?.cidade_destino,
                            instituicao_executora: request?.instituicao_executora,
                            distancias: request?.distancias,
                            reducao_diarias_50: request?.reducao_diarias_50,
                            ajuda_custo_extraordinaria: request?.ajuda_custo_extraordinaria,
                            desconto_outros_auxilios: request?.desconto_outros_auxilios,
                            valor_a_pagar: request?.valor_a_pagar,
                            valor_pago: request?.valor_pago,
                            data_pagamento: request?.data_pagamento,
                            data_autorizacao: request?.data_autorizacao,
                            observacoes: request?.observacoes,
                            situacao: request?.situacao,
                            usuario_cpf: request?.usuario_cpf,
                            deslocamentos: request?.deslocamentos || [],
                            usuarios: request?.usuarios,
                        }}
                        accountability={{
                            objetivo_participacao: accountability.objetivo_participacao,
                            atividades_realizadas: accountability.atividades_realizadas,
                            data_envio: accountability.data_envio,
                        }}
                    />
                </div>
            </Card>

            <AccountabilityAnalysisForm accountabilityId={id} requestSituacao={request?.situacao} />
        </div>
    )
}
