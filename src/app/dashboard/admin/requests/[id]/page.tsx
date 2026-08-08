import { getRequestDetails, calculateRequestValues } from '@/app/actions/admin-actions'
import { RequestAnalysisForm } from './request-analysis-form'
import { ArrowLeft, User, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { notFound } from 'next/navigation'
import { formatDocumento, formatCurrency, formatDate, safeJsonParse, DadosBancarios, AuxilioTerceiro } from '@/lib/format-utils'

export default async function RequestAnalysisPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params

    const request = await getRequestDetails(id)

    if (!request) {
        notFound()
    }

    const calculatedValues = await calculateRequestValues(id)

    if (!calculatedValues) {
        return <div>Erro ao calcular valores</div>
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <Link href="/dashboard" className="text-gray-500 hover:text-gray-900 flex items-center gap-2 mb-4 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Voltar para o Dashboard
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Análise de Solicitação</h1>
                <p className="text-gray-500">Protocolo: {request.protocolo || request.id.slice(0, 8)}</p>
            </div>

            <Card className="mb-8" style={{ backgroundColor: '#e0f2fe' }}>
                <div className="card-header">
                    <h3 className="card-title">1. Dados do Solicitante</h3>
                </div>
                <div className="p-6">
                    <div className="flex gap-6 items-start">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-primary">Nome</label>
                                <p className="text-gray-900">{request.usuarios?.nome}</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-primary">CPF/CNPJ</label>
                                <p className="text-gray-900">{formatDocumento(request.usuario_cpf)}</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-primary">Categoria</label>
                                <p className="text-gray-900">{request.usuarios?.categorias?.nome_categoria}</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-primary">Valor da Diária</label>
                                <p className="text-gray-900">R$ {formatCurrency(request.usuarios?.categorias?.valor_diaria || 0)}</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-primary">Banco</label>
                                <p className="text-gray-900">{safeJsonParse<DadosBancarios>(request.usuarios?.dados_bancarios, {}).banco || 'Não informado'}</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-primary">Agência</label>
                                <p className="text-gray-900">{safeJsonParse<DadosBancarios>(request.usuarios?.dados_bancarios, {}).agencia || 'Não informado'}</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-primary">Conta</label>
                                <p className="text-gray-900">{safeJsonParse<DadosBancarios>(request.usuarios?.dados_bancarios, {}).conta || 'Não informado'}</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-primary">Chave PIX</label>
                                <p className="text-gray-900">{safeJsonParse<DadosBancarios>(request.usuarios?.dados_bancarios, {}).pix || 'Não informado'}</p>
                            </div>
                        </div>
                        <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center border-2 border-white shadow-sm">
                            {request.usuarios?.avatar_url ? (
                                <img src={request.usuarios.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-8 h-8 text-gray-400" />
                            )}
                        </div>
                    </div>
                </div>
            </Card>

            <Card className="mb-8" style={{ backgroundColor: '#fefce8' }}>
                <div className="card-header">
                    <h3 className="card-title">2. Dados da Solicitação</h3>
                </div>
                <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-3 space-y-2">
                        <label className="text-sm font-medium text-primary">Evento</label>
                        <p className="text-gray-900">{request.nome_evento}</p>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-primary">Tipo de Evento</label>
                        <p className="text-gray-900">{request.tipo_evento}</p>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-primary">Local</label>
                        <p className="text-gray-900">{request.local_evento}</p>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-primary">Instituição Executora</label>
                        <p className="text-gray-900">{request.instituicao_executora || 'Não informado'}</p>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-primary">Data de Partida</label>
                        <p className="text-gray-900">
                            {request.data_partida ? formatDate(request.data_partida) :
                                formatDate(request.data_periodo_inicio)}
                        </p>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-primary">Data de Retorno</label>
                        <p className="text-gray-900">
                            {request.data_retorno ? formatDate(request.data_retorno) :
                                formatDate(request.data_periodo_fim)}
                        </p>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-primary">Distância</label>
                        <p className="text-gray-900">{request.distancias?.distancia || 'Não informado'}</p>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-primary">Cidade de Origem</label>
                        <p className="text-gray-900">{request.cidade_origem || 'Não informado'}</p>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-primary">Cidade de Destino</label>
                        <p className="text-gray-900">{request.cidade_destino || 'Não informado'}</p>
                    </div>
                    {request.observacoes && (
                        <div className="md:col-span-3 space-y-2">
                            <label className="text-sm font-medium text-primary">Observações do Solicitante</label>
                            <p className="text-gray-900 whitespace-pre-wrap">{request.observacoes}</p>
                        </div>
                    )}
                </div>
                    {request.situacao === 'rejeitada' && request.motivo_recusa && (
                        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                            <label className="text-sm font-medium text-red-700 flex items-center gap-2 mb-2">
                                <AlertTriangle className="w-4 h-4" />
                                Motivo da Recusa
                            </label>
                            <p className="text-gray-900 whitespace-pre-wrap">{request.motivo_recusa}</p>
                        </div>
                    )}
                </div>
            </Card>

            <RequestAnalysisForm
                requestId={id}
                calculatedValues={calculatedValues}
                categoria={request.usuarios?.categorias?.nome_categoria || ''}
                categoriaId={request.usuarios?.categoria_id}
                auxiliosTerceiros={safeJsonParse<AuxilioTerceiro[]>(request.auxilios_terceiros, [])}
                reducaoDiariasAtual={request.reducao_diarias_50 || false}
                currentStatus={request.situacao}
                userPerfil={request.usuarios?.tipo_perfil_id}
                usuarioCpf={request.usuario_cpf}
            />
        </div>
    )
}
