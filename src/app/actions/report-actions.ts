'use server'

import { createAdminClient } from '@/lib/appwrite/server'
import { paidRequestsReportSchema } from '@/lib/schemas'

export type PaidRequestReportItem = {
    id: string
    protocolo: string
    nome_evento: string
    categoria_nome?: string
    data_pagamento: string
    valor_pago: number
    solicitante: {
        nome: string
        cpf: string
    }
}

export async function getPaidRequestsReport(
    startDate: string,
    endDate: string,
    categoryIds: string[] = [],
    requesterCpfs: string[] = [],
): Promise<PaidRequestReportItem[]> {
    paidRequestsReportSchema.parse({ startDate, endDate, categoryIds, requesterCpfs })

    const { databases } = createAdminClient()
    const dbId = process.env.APPWRITE_DATABASE_ID!

    const { documents } = await databases.listDocuments(dbId, 'solicitacoes', [])
    const paid = documents.filter((d: any) =>
        ['paga_nao_comprovada', 'paga_comprovada'].includes(d.situacao) &&
        d.data_pagamento &&
        d.data_pagamento >= startDate &&
        d.data_pagamento <= endDate
    )

    const { documents: users } = await databases.listDocuments(dbId, 'usuarios', [])
    const { documents: categories } = await databases.listDocuments(dbId, 'categorias', [])

    let filtered = paid
    if (categoryIds.length > 0) {
        const numericIds = categoryIds.map(Number)
        const filteredUserCpfs = users
            .filter(u => u.categoria_id && numericIds.includes(u.categoria_id))
            .map(u => u.cpf)
            .filter(Boolean)
        filtered = filtered.filter((d: any) => filteredUserCpfs.includes(d.usuario_cpf))
        if (filtered.length === 0) return []
    }

    if (requesterCpfs.length > 0) {
        filtered = filtered.filter((d: any) => requesterCpfs.includes(d.usuario_cpf))
        if (filtered.length === 0) return []
    }

    return filtered.map((item: any) => {
        const userData = users.find(u => u.cpf === item.usuario_cpf)
        const catData = userData?.categoria_id
            ? categories.find(c => c.$id === String(userData.categoria_id))
            : null
        return {
            id: item.$id,
            protocolo: item.protocolo || item.$id.slice(0, 8).toUpperCase(),
            nome_evento: item.nome_evento,
            categoria_nome: catData?.nome_categoria || '',
            data_pagamento: item.data_pagamento || '-',
            valor_pago: Number(item.valor_pago) || Number(item.valor_a_pagar) || 0,
            solicitante: {
                nome: userData?.nome || 'Desconhecido',
                cpf: userData?.cpf || 'N/A',
            },
        }
    })
}

export async function getRequestersWithPaidRequests(categoryIds: string[] = []) {
    const { databases } = createAdminClient()
    const dbId = process.env.APPWRITE_DATABASE_ID!

    const { documents } = await databases.listDocuments(dbId, 'solicitacoes', [])
    const paid = documents.filter((d: any) =>
        ['paga_nao_comprovada', 'paga_comprovada'].includes(d.situacao)
    )

    const { documents: users } = await databases.listDocuments(dbId, 'usuarios', [])

    let filtered = paid
    if (categoryIds.length > 0) {
        const numericIds = categoryIds.map(Number)
        const filteredUserCpfs = users
            .filter(u => u.categoria_id && numericIds.includes(u.categoria_id))
            .map(u => u.cpf)
            .filter(Boolean)
        filtered = filtered.filter((d: any) => filteredUserCpfs.includes(d.usuario_cpf))
        if (filtered.length === 0) return []
    }

    const seen = new Set<string>()
    const result: Array<{ id: string; nome: string }> = []
    for (const item of filtered) {
        const u = users.find(uu => uu.cpf === item.usuario_cpf)
        if (u && u.cpf && !seen.has(u.cpf)) {
            seen.add(u.cpf)
            result.push({ id: u.cpf, nome: u.nome })
        }
    }

    return result
}

const LIMITE_REPORT = 10

export interface AllRequestsReportItem {
    id: string
    protocolo: string
    situacao: string
    nome_evento: string
    local_evento: string
    data_criacao: string
    data_periodo_inicio: string
    data_periodo_fim: string
    valor_a_pagar: number | null
    usuario_cpf: string
    solicitante: {
        nome: string
        email: string
        cpf: string
    }
    accountability_id: string | null
}

export async function getAllRequestsReport(
    page = 1,
    filters: {
        email?: string
        situacao?: string
        protocolo?: string
        startDate?: string
        endDate?: string
    } = {}
) {
    const { databases } = createAdminClient()
    const dbId = process.env.APPWRITE_DATABASE_ID!
    const offset = (page - 1) * LIMITE_REPORT

    const { documents } = await databases.listDocuments(dbId, 'solicitacoes', [])
    const { documents: users } = await databases.listDocuments(dbId, 'usuarios', [])
    const { documents: pcs } = await databases.listDocuments(dbId, 'prestacao_contas', [])

    let filtered = documents as any[]

    if (filters.email) {
        const matchedCpfs = users
            .filter(u => u.email?.toLowerCase().includes(filters.email!.toLowerCase()))
            .map(u => u.cpf)
            .filter(Boolean)
        filtered = filtered.filter(d => matchedCpfs.includes(d.usuario_cpf))
        if (filtered.length === 0) return { data: [], total: 0 }
    }

    if (filters.situacao) {
        filtered = filtered.filter(d => d.situacao === filters.situacao)
    }

    if (filters.protocolo) {
        filtered = filtered.filter(d =>
            (d.protocolo || '').toLowerCase().includes(filters.protocolo!.toLowerCase())
        )
    }

    if (filters.startDate) {
        filtered = filtered.filter(d => d.data_criacao >= filters.startDate!)
    }

    if (filters.endDate) {
        filtered = filtered.filter(d => d.data_criacao <= `${filters.endDate}T23:59:59Z`)
    }

    const total = filtered.length
    const paged = filtered
        .sort((a, b) => new Date(b.data_criacao).getTime() - new Date(a.data_criacao).getTime())
        .slice(offset, offset + LIMITE_REPORT)

    const data = paged.map((item: any) => {
        const userData = users.find(u => u.cpf === item.usuario_cpf)
        const requestPcs = pcs
            .filter(pc => pc.solicitacao_id === item.$id && pc.status !== 'rascunho')
            .sort((a, b) => new Date(b.data_envio).getTime() - new Date(a.data_envio).getTime())
        const latestPc = requestPcs[0]
        return {
            id: item.$id,
            protocolo: item.protocolo || item.$id.slice(0, 8).toUpperCase(),
            situacao: item.situacao,
            nome_evento: item.nome_evento,
            local_evento: item.local_evento,
            data_criacao: item.data_criacao,
            data_periodo_inicio: item.data_periodo_inicio,
            data_periodo_fim: item.data_periodo_fim,
            valor_a_pagar: item.valor_a_pagar,
            usuario_cpf: item.usuario_cpf,
            solicitante: {
                nome: userData?.nome || 'Desconhecido',
                email: userData?.email || '',
                cpf: userData?.cpf || item.usuario_cpf || '',
            },
            accountability_id: latestPc?.$id || null,
        } as AllRequestsReportItem
    })

    return { data, total }
}
