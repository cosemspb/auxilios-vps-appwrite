'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/appwrite/server'
import { Query, ID } from 'node-appwrite'
import { createRequestSchema } from '@/lib/schemas'

const LOCK_TIMEOUT_MINUTES = 10

export async function lockRequest(requestId: string) {
    const { databases } = createAdminClient()
    try {
        await databases.updateDocument(
            process.env.APPWRITE_DATABASE_ID!,
            'solicitacoes',
            requestId,
            { em_edicao_desde: new Date().toISOString() }
        )
    } catch (error) {
        console.error('Error locking request:', error)
    }
}

export async function unlockRequest(requestId: string) {
    const { databases } = createAdminClient()
    try {
        await databases.updateDocument(
            process.env.APPWRITE_DATABASE_ID!,
            'solicitacoes',
            requestId,
            { em_edicao_desde: null }
        )
    } catch (error) {
        console.error('Error unlocking request:', error)
    }
}

export async function checkRequestLock(requestId: string): Promise<{ locked: boolean; error?: string }> {
    const { databases } = createAdminClient()
    try {
        const doc = await databases.getDocument(
            process.env.APPWRITE_DATABASE_ID!,
            'solicitacoes',
            requestId
        )
        if (!doc.em_edicao_desde) return { locked: false }
        const elapsed = (Date.now() - new Date(doc.em_edicao_desde as string).getTime()) / 1000 / 60
        if (elapsed > LOCK_TIMEOUT_MINUTES) {
            await databases.updateDocument(
                process.env.APPWRITE_DATABASE_ID!,
                'solicitacoes',
                requestId,
                { em_edicao_desde: null }
            )
            return { locked: false }
        }
        return { locked: true, error: 'Esta solicitação está sendo editada no momento. Tente novamente em alguns minutos.' }
    } catch {
        return { locked: false }
    }
}

export async function createRequest(prevState: any, formData: FormData) {
    const { account, databases } = await createClient()

    let user
    try {
        user = await account.get()
    } catch {
        return { error: 'Usuário não autenticado.' }
    }

    if (!user) {
        return { error: 'Usuário não autenticado.' }
    }

    const dbId = process.env.APPWRITE_DATABASE_ID!

    let profile: any = null
    try {
        const { documents } = await databases.listDocuments(dbId, 'usuarios', [])
        profile = documents.find(d => d.auth_id === user.$id) || null
    } catch {
        return { error: 'Perfil não encontrado.' }
    }

    if (!profile?.cpf) {
        return { error: 'Perfil não encontrado ou CPF não cadastrado.' }
    }

    const hasBankDetails = profile.dados_bancarios?.banco &&
        profile.dados_bancarios?.agencia &&
        profile.dados_bancarios?.conta

    const hasPix = !!profile.dados_bancarios?.pix
    const isProfileComplete = profile.categoria_id && (hasBankDetails || hasPix)

    if (!isProfileComplete) {
        return { error: 'Para criar uma solicitação, é necessário completar seu cadastro com Categoria e Dados Bancários.' }
    }

    const tipo_evento = formData.get('tipo_evento') as string
    const tipo_evento_outro = formData.get('tipo_evento_outro') as string
    const instituicao_executora = formData.get('instituicao_executora') as string
    const instituicao_executora_outro = formData.get('instituicao_executora_outro') as string

    const finalTipoEvento = tipo_evento === 'Outros' ? tipo_evento_outro : tipo_evento
    const finalInstituicao = instituicao_executora === 'Outro' ? instituicao_executora_outro : instituicao_executora

    const auxiliosTerceirosRaw = formData.get('auxilios_terceiros') as string
    let auxilios_terceiros: any[] = []
    try {
        auxilios_terceiros = auxiliosTerceirosRaw ? JSON.parse(auxiliosTerceirosRaw) : []
    } catch (e) {
        console.error('Error parsing auxilios_terceiros:', e)
    }

    try {
        createRequestSchema.parse({
            tipo_evento: finalTipoEvento,
            nome_evento: formData.get('nome_evento'),
            local_evento: formData.get('local_evento'),
            instituicao_executora: finalInstituicao,
            data_periodo_inicio: formData.get('data_periodo_inicio'),
            data_periodo_fim: formData.get('data_periodo_fim'),
            data_partida: formData.get('data_partida') || undefined,
            data_retorno: formData.get('data_retorno') || undefined,
        })
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Dados inválidos'
        return { error: msg }
    }

    const dataPartida = formData.get('data_partida') as string
    const dataRetorno = formData.get('data_retorno') as string
    if (dataPartida && dataRetorno && dataPartida > dataRetorno) {
        return { error: 'A data de partida não pode ser posterior à data de retorno' }
    }
    const dataInicio = formData.get('data_periodo_inicio') as string
    const dataFim = formData.get('data_periodo_fim') as string
    if (dataInicio && dataFim && dataInicio > dataFim) {
        return { error: 'A data de início do evento não pode ser posterior à data de fim' }
    }

    const requestId = crypto.randomUUID()
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '')
    const uniqueSegment = requestId.slice(0, 5).toUpperCase()
    const protocolo = `${dateStr}-${uniqueSegment}`

    const requestData = {
        protocolo: protocolo,
        usuario_cpf: profile.cpf,
        tipo_evento: finalTipoEvento,
        nome_evento: formData.get('nome_evento'),
        local_evento: formData.get('local_evento'),
        instituicao_executora: finalInstituicao,
        data_periodo_inicio: formData.get('data_periodo_inicio'),
        data_periodo_fim: formData.get('data_periodo_fim'),
        distancia_id: formData.get('distancia_id') ? parseInt(formData.get('distancia_id') as string) : null,
        cidade_origem: formData.get('cidade_origem'),
        cidade_destino: formData.get('cidade_destino'),
        data_partida: formData.get('data_partida'),
        data_retorno: formData.get('data_retorno'),
        tem_aereo: formData.get('tem_aereo') === 'on',
        voo_ida: formData.get('voo_ida'),
        voo_volta: formData.get('voo_volta'),
        auxilios_terceiros: auxilios_terceiros,
        hospedagem_cosems: formData.get('hospedagem_cosems') === 'on',
        observacoes: formData.get('observacoes'),
        situacao: 'pendente',
    }

    try {
        await databases.createDocument(dbId, 'solicitacoes', ID.unique(), requestData)
    } catch (err: any) {
        console.error('Error creating request:', err)
        return { error: `Erro ao criar solicitação: ${err?.message || 'Erro desconhecido'}` }
    }

    const { registrarHistorico } = await import('@/lib/historico')
    registrarHistorico(requestId, null, 'pendente', profile.cpf, profile.nome)

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/requests')

    return { success: true }
}

export async function updateRequest(prevState: any, formData: FormData) {
    const { account, databases } = await createClient()

    let user
    try {
        user = await account.get()
    } catch {
        return { error: 'Usuário não autenticado.' }
    }

    const dbId = process.env.APPWRITE_DATABASE_ID!
    const requestId = formData.get('request_id') as string
    if (!requestId) {
        return { error: 'ID da solicitação não informado.' }
    }

    let existing: any = null
    try {
        existing = await databases.getDocument(dbId, 'solicitacoes', requestId)
    } catch {
        return { error: 'Solicitação não encontrada.' }
    }

    let profile: any = null
    try {
        const { documents } = await databases.listDocuments(dbId, 'usuarios', [])
        profile = documents.find(d => d.auth_id === user.$id) || null
    } catch {
        return { error: 'Perfil não encontrado.' }
    }

    if (!profile?.cpf || profile.cpf !== existing.usuario_cpf) {
        return { error: 'Você não tem permissão para editar esta solicitação.' }
    }

    if (existing.situacao !== 'pendente' && existing.situacao !== 'rejeitada' && existing.situacao !== 'retificada') {
        return { error: 'Só é possível editar solicitações com status pendente, rejeitada ou retificada.' }
    }

    const wasRejected = existing.situacao === 'rejeitada'

    const tipo_evento = formData.get('tipo_evento') as string
    const tipo_evento_outro = formData.get('tipo_evento_outro') as string
    const instituicao_executora = formData.get('instituicao_executora') as string
    const instituicao_executora_outro = formData.get('instituicao_executora_outro') as string

    const finalTipoEvento = tipo_evento === 'Outros' ? tipo_evento_outro : tipo_evento
    const finalInstituicao = instituicao_executora === 'Outro' ? instituicao_executora_outro : instituicao_executora

    const auxiliosTerceirosRaw = formData.get('auxilios_terceiros') as string
    let auxilios_terceiros: any[] = []
    try {
        auxilios_terceiros = auxiliosTerceirosRaw ? JSON.parse(auxiliosTerceirosRaw) : []
    } catch (e) {
        console.error('Error parsing auxilios_terceiros:', e)
    }

    try {
        createRequestSchema.parse({
            tipo_evento: finalTipoEvento,
            nome_evento: formData.get('nome_evento'),
            local_evento: formData.get('local_evento'),
            instituicao_executora: finalInstituicao,
            data_periodo_inicio: formData.get('data_periodo_inicio'),
            data_periodo_fim: formData.get('data_periodo_fim'),
            data_partida: formData.get('data_partida') || undefined,
            data_retorno: formData.get('data_retorno') || undefined,
        })
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Dados inválidos'
        return { error: msg }
    }

    const dataPartida = formData.get('data_partida') as string
    const dataRetorno = formData.get('data_retorno') as string
    if (dataPartida && dataRetorno && dataPartida > dataRetorno) {
        return { error: 'A data de partida não pode ser posterior à data de retorno' }
    }
    const dataInicio = formData.get('data_periodo_inicio') as string
    const dataFim = formData.get('data_periodo_fim') as string
    if (dataInicio && dataFim && dataInicio > dataFim) {
        return { error: 'A data de início do evento não pode ser posterior à data de fim' }
    }

    const updateData: Record<string, any> = {
        tipo_evento: finalTipoEvento,
        nome_evento: formData.get('nome_evento'),
        local_evento: formData.get('local_evento'),
        instituicao_executora: finalInstituicao,
        data_periodo_inicio: formData.get('data_periodo_inicio'),
        data_periodo_fim: formData.get('data_periodo_fim'),
        distancia_id: formData.get('distancia_id') ? parseInt(formData.get('distancia_id') as string) : null,
        cidade_origem: formData.get('cidade_origem'),
        cidade_destino: formData.get('cidade_destino'),
        data_partida: formData.get('data_partida'),
        data_retorno: formData.get('data_retorno'),
        tem_aereo: formData.get('tem_aereo') === 'on',
        voo_ida: formData.get('voo_ida'),
        voo_volta: formData.get('voo_volta'),
        auxilios_terceiros: auxilios_terceiros,
        hospedagem_cosems: formData.get('hospedagem_cosems') === 'on',
        observacoes: formData.get('observacoes'),
    }

    if (wasRejected) {
        updateData.situacao = 'retificada'
        updateData.motivo_recusa = null
        updateData.pre_autorizador_cpf = null
        updateData.data_pre_autorizacao = null
        updateData.autorizador_cpf = null
        updateData.data_autorizacao = null
        updateData.observacoes_autorizador = null
    }

    const { databases: adminDb } = createAdminClient()
    try {
        await adminDb.updateDocument(dbId, 'solicitacoes', requestId, updateData)
        await adminDb.updateDocument(dbId, 'solicitacoes', requestId, { em_edicao_desde: null })
    } catch (err: any) {
        console.error('Error updating request:', err)
        return { error: `Erro ao atualizar solicitação: ${err?.message || 'Erro desconhecido'}` }
    }

    const { registrarHistorico } = await import('@/lib/historico')
    if (wasRejected) {
        registrarHistorico(requestId, 'rejeitada', 'retificada', profile.cpf, profile.nome, 'Solicitação corrigida e reenviada')
    } else {
        registrarHistorico(requestId, existing.situacao, existing.situacao, profile.cpf, profile.nome, 'Solicitação reeditada')
    }

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/requests')
    revalidatePath(`/dashboard/requests/${requestId}`)
    revalidatePath(`/dashboard/requests/${requestId}/edit`)

    return { success: true }
}

export async function saveRequest(prevState: any, formData: FormData) {
    const hasId = formData.has('request_id')
    return hasId ? updateRequest(prevState, formData) : createRequest(prevState, formData)
}
