import { createClient, createAdminClient } from '@/lib/appwrite/server'
import { AccountabilityForm } from '@/components/accountability/accountability-form'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { AdminPDFViewer } from '@/components/accountability/admin-pdf-viewer'

export default async function AccountabilityDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { account } = await createClient()

    let user
    try {
        user = await account.get()
    } catch {
        redirect('/login')
    }

    if (!user) redirect('/login')

    const { id } = await params

    const { databases } = createAdminClient()
    const dbId = process.env.APPWRITE_DATABASE_ID!

    let request: any = null
    try {
        request = await databases.getDocument(dbId, 'solicitacoes', id)
    } catch {
        return (
            <div className="p-8">
                <h2 className="text-xl font-bold text-red-600 mb-2">Solicitação não encontrada</h2>
                <p className="text-gray-600">ID: {id}</p>
            </div>
        )
    }

    if (!request) {
        return <div>Solicitação não encontrada</div>
    }

    let usuario: any = null
    try {
        const { documents } = await databases.listDocuments(dbId, 'usuarios', [])
        usuario = documents.find(d => d.cpf === request.usuario_cpf) || null
        if (usuario && usuario.categoria_id) {
            try {
                const catDoc = await databases.getDocument(dbId, 'categorias', String(usuario.categoria_id))
                usuario = { ...usuario, categoria: catDoc }
            } catch {
                // ignore
            }
        }
    } catch {
        // ignore
    }

    let prestacaoContas: any[] = []
    try {
        const { documents } = await databases.listDocuments(dbId, 'prestacao_contas', [])
        prestacaoContas = documents.filter(d => d.solicitacao_id === id)
    } catch {
        // ignore
    }

    const requestData = {
        ...request,
        usuarios: usuario,
        deslocamentos: [],
        prestacao_contas: prestacaoContas || []
    }

    const existingAccountability = prestacaoContas?.find(pc => pc.status === 'em_retificacao')
        || prestacaoContas?.[0]

    const showDownload = existingAccountability && ['em_avaliacao', 'paga_comprovada'].includes(existingAccountability.status)

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Prestação de Contas</h2>
                <p className="text-muted-foreground">
                    {showDownload
                        ? 'Sua prestação de contas já foi enviada. Você pode baixar o relatório abaixo.'
                        : 'Preencha as informações abaixo para gerar seu formulário de prestação de contas.'}
                </p>
            </div>

            {showDownload && (
                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Relatório de Prestação de Contas</h3>
                            <p className="text-sm text-gray-500">Clique abaixo para visualizar ou baixar o relatório completo em PDF.</p>
                        </div>
                        <AdminPDFViewer
                            accountabilityId={existingAccountability.$id}
                            request={{
                                id: request.$id,
                                protocolo: request.protocolo,
                                nome_evento: request.nome_evento,
                                data_periodo_inicio: request.data_periodo_inicio,
                                data_periodo_fim: request.data_periodo_fim,
                                data_partida: request.data_partida,
                                data_retorno: request.data_retorno,
                                cidade_origem: request.cidade_origem,
                                cidade_destino: request.cidade_destino,
                                tipo_evento: request.tipo_evento,
                                local_evento: request.local_evento,
                                instituicao_executora: request.instituicao_executora,
                                deslocamentos: [],
                                valor_a_pagar: request.valor_a_pagar,
                                valor_pago: request.valor_pago,
                                data_pagamento: request.data_pagamento,
                                data_autorizacao: request.data_autorizacao,
                                observacoes: request.observacoes,
                                situacao: request.situacao,
                                usuario_cpf: request.usuario_cpf,
                                reducao_diarias_50: request.reducao_diarias_50,
                                ajuda_custo_extraordinaria: request.ajuda_custo_extraordinaria,
                                desconto_outros_auxilios: request.desconto_outros_auxilios,
                                distancias: request.distancias,
                                usuarios: usuario,
                            }}
                            accountability={{
                                objetivo_participacao: existingAccountability.objetivo_participacao,
                                atividades_realizadas: existingAccountability.atividades_realizadas,
                                data_envio: existingAccountability.data_envio,
                            }}
                        />
                    </div>
                </Card>
            )}

            <AccountabilityForm
                request={requestData as any}
                existingAccountability={existingAccountability}
            />
        </div>
    )
}
