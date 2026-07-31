import { createClient, createAdminClient } from '@/lib/appwrite/server'
import { RequestForm } from '../../new/request-form'
import { redirect } from 'next/navigation'
import { lockRequest } from '../../actions'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { UnlockOnUnmount } from './unlock-on-unmount'

export default async function EditRequestPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const { account } = await createClient()

    let user
    try {
        user = await account.get()
    } catch {
        return <div>Usuário não autenticado</div>
    }

    if (!user) {
        return <div>Usuário não autenticado</div>
    }

    const { databases } = createAdminClient()
    const dbId = process.env.APPWRITE_DATABASE_ID!

    let profile: any = null
    try {
        const { documents } = await databases.listDocuments(dbId, 'usuarios', [])
        profile = documents.find(d => d.auth_id === user.$id) || null
    } catch {
        return <div>Erro ao carregar perfil</div>
    }

    let request: any
    try {
        request = await databases.getDocument(dbId, 'solicitacoes', id)
    } catch {
        return <div>Solicitação não encontrada</div>
    }

    if (!profile?.cpf || request.usuario_cpf !== profile.cpf) {
        return <div>Você não tem permissão para editar esta solicitação</div>
    }

    if (request.situacao !== 'pendente' && request.situacao !== 'rejeitada' && request.situacao !== 'retificada') {
        redirect(`/dashboard/requests/${id}`)
    }

    let distancias: any[] = []
    try {
        const result = await databases.listDocuments(dbId, 'distancias', [])
        distancias = result.documents
    } catch {
        // ignore
    }

    const initialData = {
        id: request.$id,
        tipo_evento: request.tipo_evento || '',
        nome_evento: request.nome_evento || '',
        local_evento: request.local_evento || '',
        instituicao_executora: request.instituicao_executora || '',
        data_periodo_inicio: request.data_periodo_inicio || '',
        data_periodo_fim: request.data_periodo_fim || '',
        distancia_id: request.distancia_id,
        cidade_origem: request.cidade_origem || '',
        cidade_destino: request.cidade_destino || '',
        data_partida: request.data_partida || '',
        data_retorno: request.data_retorno || '',
        tem_aereo: request.tem_aereo || false,
        voo_ida: request.voo_ida || '',
        voo_volta: request.voo_volta || '',
        auxilios_terceiros: request.auxilios_terceiros || [],
        hospedagem_cosems: request.hospedagem_cosems || false,
        observacoes: request.observacoes || '',
    }

    lockRequest(id)

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <Link href={`/dashboard/requests/${id}`} className="text-gray-500 hover:text-gray-900 flex items-center gap-2 mb-4 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                    Voltar para detalhes
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Editar Solicitação</h1>
                <p className="text-gray-500">Protocolo: {request.protocolo || request.$id.slice(0, 8)}</p>
            </div>

            <RequestForm distancias={distancias || []} initialData={initialData} />
            <UnlockOnUnmount requestId={id} />
        </div>
    )
}
