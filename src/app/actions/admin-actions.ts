'use server'

import 'server-only'
import { createClient, createAdminClient } from '@/lib/appwrite/server'
import { revalidatePath } from 'next/cache'
import { sendEmail as sendNotificationEmail } from '@/lib/email/smtp-service'
import { registrarHistorico } from '@/lib/historico'
import {
    getAutorizadaTemplate,
    getRejeitadaTemplate,
    getCanceladaTemplate,
    getPreAprovadaTemplate,
    getComprovadaTemplate,
    getPrestacaoRejeitadaTemplate,
    getEmailSubject
} from '@/lib/email/templates'
import { Query, ID } from 'node-appwrite'

const CATEGORIA_APOIADOR = 11
const LIMITE_DASHBOARD = 10
const LIMITE_USUARIOS_POR_PAGINA = 10

function formatDoc(doc: any): any {
    if (!doc) return doc
    const { $id, $collectionId, $databaseId, $createdAt, $updatedAt, $permissions, ...rest } = doc
    return { ...rest, id: $id }
}

async function requireProfile(minRole: number) {
    const { account, databases } = createClient()

    let user
    try {
        user = await account.get()
    } catch {
        throw new Error('Usuário não autenticado')
    }

    if (!user) throw new Error('Usuário não autenticado')

    const dbId = process.env.APPWRITE_DATABASE_ID!

    let profile: any = null
    try {
        const { documents } = await databases.listDocuments(dbId, 'usuarios', [])
        profile = documents.find(d => d.auth_id === user.$id) || null
    } catch {
        throw new Error('Perfil não encontrado')
    }

    if (!profile) throw new Error('Perfil não encontrado')
    if (profile.tipo_perfil_id < minRole) throw new Error('Sem permissão para esta operação')

    return { cpf: profile.cpf, nome: profile.nome, tipo_perfil_id: profile.tipo_perfil_id, $id: profile.$id }
}

const requireAdmin = () => requireProfile(4)
const requireAuthorizer = () => requireProfile(2)
const requireFinalAuthorizer = () => requireProfile(3)

export async function getPendingRequests(perfilId?: number, page = 1) {
    try {
        return await requireAuthorizer().then(async () => {
            const { databases } = createAdminClient()
            const dbId = process.env.APPWRITE_DATABASE_ID!
            const offset = (page - 1) * LIMITE_DASHBOARD

            const { documents, total } = await databases.listDocuments(dbId, 'solicitacoes', [
                Query.equal('situacao', 'pendente'),
                Query.limit(LIMITE_DASHBOARD),
                Query.offset(offset),
            ])

            const data = documents.map(formatDoc)
            return { data, total }
        })
    } catch { return { data: [], total: 0 } }
}

export async function getPreApprovedRequests(page = 1) {
    try {
        return await requireFinalAuthorizer().then(async () => {
            const { databases } = createAdminClient()
            const dbId = process.env.APPWRITE_DATABASE_ID!
            const offset = (page - 1) * LIMITE_DASHBOARD

            const { documents, total } = await databases.listDocuments(dbId, 'solicitacoes', [
                Query.equal('situacao', 'pre_aprovada'),
                Query.limit(LIMITE_DASHBOARD),
                Query.offset(offset),
            ])

            const data = documents.map(formatDoc)
            return { data, total }
        })
    } catch { return { data: [], total: 0 } }
}

export async function getAuthorizedRequests(page = 1) {
    try {
        return await requireAuthorizer().then(async () => {
            const { databases } = createAdminClient()
            const dbId = process.env.APPWRITE_DATABASE_ID!
            const offset = (page - 1) * LIMITE_DASHBOARD

            const { documents, total } = await databases.listDocuments(dbId, 'solicitacoes', [
                Query.equal('situacao', 'autorizada'),
                Query.limit(LIMITE_DASHBOARD),
                Query.offset(offset),
            ])

            const data = documents.map(formatDoc)
            return { data, total }
        })
    } catch { return { data: [], total: 0 } }
}

export async function getComprovadasRequests(page = 1) {
    try {
        return await requireAuthorizer().then(async () => {
            const { databases } = createAdminClient()
            const dbId = process.env.APPWRITE_DATABASE_ID!
            const offset = (page - 1) * LIMITE_DASHBOARD

            const { documents, total } = await databases.listDocuments(dbId, 'solicitacoes', [
                Query.equal('situacao', 'concluida'),
                Query.limit(LIMITE_DASHBOARD),
                Query.offset(offset),
            ])

            const data = documents.map(formatDoc)
            return { data, total }
        })
    } catch { return { data: [], total: 0 } }
}

export async function getPendingAccountabilities(page = 1) {
    try {
        return await requireAuthorizer().then(async () => {
            const { databases } = createAdminClient()
            const dbId = process.env.APPWRITE_DATABASE_ID!
            const offset = (page - 1) * LIMITE_DASHBOARD

            const { documents, total } = await databases.listDocuments(dbId, 'prestacao_contas', [
                Query.equal('status', 'em_avaliacao'),
                Query.limit(LIMITE_DASHBOARD),
                Query.offset(offset),
            ])

            const data = documents.map(formatDoc)
            return { data, total }
        })
    } catch { return { data: [], total: 0 } }
}

export async function getApprovedAccountabilitiesPendingPayment(page = 1) {
    try {
        return await requireAdmin().then(async () => {
            const { databases } = createAdminClient()
            const dbId = process.env.APPWRITE_DATABASE_ID!
            const offset = (page - 1) * LIMITE_DASHBOARD

            const { documents, total } = await databases.listDocuments(dbId, 'prestacao_contas', [
                Query.equal('status', 'aprovada'),
                Query.limit(LIMITE_DASHBOARD),
                Query.offset(offset),
            ])

            const data = documents.map(formatDoc)
            return { data, total }
        })
    } catch { return { data: [], total: 0 } }
}

export async function getRequestDetails(requestId: string) {
    try {
        const { databases } = createAdminClient()
        const dbId = process.env.APPWRITE_DATABASE_ID!
        const doc = await databases.getDocument(dbId, 'solicitacoes', requestId)

        let usuario: any = null
        if (doc.usuario_cpf) {
            const { documents } = await databases.listDocuments(dbId, 'usuarios', [])
            usuario = documents.find(u => u.cpf === doc.usuario_cpf) || null
            if (usuario && usuario.categoria_id) {
                try {
                    const catDoc = await databases.getDocument(dbId, 'categorias', String(usuario.categoria_id))
                    usuario.categorias = formatDoc(catDoc)
                } catch { /* ignore */ }
            }
        }

        return { ...formatDoc(doc), usuarios: usuario }
    } catch (e) {
        console.error('Erro ao buscar detalhes da solicitação:', e)
        return null
    }
}

export async function calculateRequestValues(requestId: string) {
    try {
        const { databases } = createAdminClient()
        const dbId = process.env.APPWRITE_DATABASE_ID!
        const doc = await databases.getDocument(dbId, 'solicitacoes', requestId)

        let usuario: any = null
        if (doc.usuario_cpf) {
            const { documents } = await databases.listDocuments(dbId, 'usuarios', [])
            usuario = documents.find(u => u.cpf === doc.usuario_cpf) || null
        }

        let distancia = null
        if (doc.distancia_id) {
            try {
                distancia = await databases.getDocument(dbId, 'distancias', String(doc.distancia_id))
            } catch { /* ignore */ }
        }

        const start = new Date(doc.data_partida || doc.data_periodo_inicio)
        const end = new Date(doc.data_retorno || doc.data_periodo_fim)
        const diffTime = Math.abs(end.getTime() - start.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1
        const dailyRate = usuario?.categoria_id ? 200 : 0
        const distanceValue = distancia?.valor || 0

        return {
            quantidadeDiarias: diffDays,
            valorDiaria: dailyRate,
            valorDiarias: diffDays * dailyRate,
            valorDeslocamento: distanceValue,
            ajudaCustoExtraordinaria: 0,
            descontoOutrosAuxilios: 0,
            valorAPagar: (diffDays * dailyRate) + distanceValue,
        }
    } catch (e) {
        console.error('Erro ao calcular valores:', e)
        return null
    }
}

export async function getDashboardData(perfilId = 4) {
    try {
        const { databases } = createAdminClient()
        const dbId = process.env.APPWRITE_DATABASE_ID!

        const runCountQuery = async (situacao: string, filters?: any[]) => {
            const queries = [Query.equal('situacao', situacao), ...(filters || [])]
            const result = await databases.listDocuments(dbId, 'solicitacoes', queries)
            return result.total
        }

        const pendentes = await runCountQuery('pendente')
        const preAprovadas = await runCountQuery('pre_aprovada')
        const autorizadas = await runCountQuery('autorizada')
        const rejeitadas = await runCountQuery('rejeitada')

        const { total: accountabilities } = await databases.listDocuments(dbId, 'prestacao_contas', [
            Query.equal('status', 'em_avaliacao'),
        ])

        return { pendentes, preAprovadas, autorizadas, rejeitadas, accountabilities }
    } catch {
        return { pendentes: 0, preAprovadas: 0, autorizadas: 0, rejeitadas: 0, accountabilities: 0 }
    }
}

export async function getAccountabilityDetails(accountabilityId: string) {
    try {
        const { databases } = createAdminClient()
        const dbId = process.env.APPWRITE_DATABASE_ID!
        const doc = await databases.getDocument(dbId, 'prestacao_contas', accountabilityId)

        let solicitacao: any = null
        if (doc.solicitacao_id) {
            try {
                solicitacao = await databases.getDocument(dbId, 'solicitacoes', doc.solicitacao_id)
                let usuario: any = null
                if (solicitacao.usuario_cpf) {
                    const { documents } = await databases.listDocuments(dbId, 'usuarios', [])
                    usuario = documents.find(u => u.cpf === solicitacao.usuario_cpf) || null
                }
                solicitacao = { ...formatDoc(solicitacao), usuarios: usuario }
            } catch { /* ignore */ }
        }

        let arquivos: any[] = []
        try {
            const { documents } = await databases.listDocuments(dbId, 'pc_arquivos', [])
            arquivos = documents.filter(a => a.prestacao_contas_id === accountabilityId).map(formatDoc)
        } catch { /* ignore */ }

        return {
            ...formatDoc(doc),
            solicitacoes: solicitacao,
            arquivos,
        }
    } catch (e) {
        console.error('Erro ao buscar detalhes da prestação:', e)
        return null
    }
}

export async function getPendingCorrections(page = 1) {
    try {
        return await requireAuthorizer().then(async () => {
            const { databases } = createAdminClient()
            const dbId = process.env.APPWRITE_DATABASE_ID!
            const offset = (page - 1) * LIMITE_DASHBOARD

            const { documents, total } = await databases.listDocuments(dbId, 'solicitacoes', [
                Query.equal('situacao', 'em_retificacao'),
                Query.limit(LIMITE_DASHBOARD),
                Query.offset(offset),
            ])

            const data = documents.map(formatDoc)
            return { data, total }
        })
    } catch { return { data: [], total: 0 } }
}

export async function getUserOpenAccountabilities(usuarioCpf: string) {
    try {
        const { databases } = createAdminClient()
        const dbId = process.env.APPWRITE_DATABASE_ID!

        const { documents } = await databases.listDocuments(dbId, 'solicitacoes', [
            Query.equal('usuario_cpf', usuarioCpf),
        ])

        const openSolicitacoes = documents.filter((d: any) =>
            ['autorizada', 'paga', 'paga_nao_comprovada'].includes(d.situacao)
        )

        const result: any[] = []
        for (const sol of openSolicitacoes) {
            const { documents: pcs } = await databases.listDocuments(dbId, 'prestacao_contas', [])
            const pc = pcs.find(p => p.solicitacao_id === sol.$id)
            if (!pc || pc.status === 'rascunho') {
                result.push(formatDoc(sol))
            }
        }

        return result
    } catch { return [] }
}

export async function preApproveRequest(requestId: string, requestData: any) {
    try {
        return await requireAuthorizer().then(async ({ cpf, nome }) => {
            const { databases } = createAdminClient()
            const dbId = process.env.APPWRITE_DATABASE_ID!

            await databases.updateDocument(dbId, 'solicitacoes', requestId, {
                situacao: 'pre_aprovada',
                pre_autorizador_cpf: cpf,
                data_pre_autorizacao: new Date().toISOString(),
                observacoes_autorizador: requestData.observacoes || null,
            })

            registrarHistorico(requestId, 'pendente', 'pre_aprovada', cpf, nome, requestData.observacoes)

            try {
                const doc = await databases.getDocument(dbId, 'solicitacoes', requestId)
                const html = getPreAprovadaTemplate(doc as any)
                const subject = getEmailSubject(doc.protocolo || requestId.slice(0, 8), 'pre_aprovada')
                if (doc.usuario_cpf) {
                    const { documents: users } = await databases.listDocuments(dbId, 'usuarios', [])
                    const user = users.find(u => u.cpf === doc.usuario_cpf)
                    if (user?.email) {
                        sendNotificationEmail(user.email, subject, html)
                    }
                }
            } catch { /* email error */ }

            revalidatePath('/dashboard/admin/requests')
            return { success: true, message: 'Solicitação pré-aprovada com sucesso!' }
        })
    } catch (e: any) {
        return { success: false, message: e.message || 'Erro ao pré-aprovar solicitação' }
    }
}

export async function approveRequest(requestId: string, requestData: any) {
    try {
        return await requireAdmin().then(async ({ cpf, nome }) => {
            const { databases } = createAdminClient()
            const dbId = process.env.APPWRITE_DATABASE_ID!

            await databases.updateDocument(dbId, 'solicitacoes', requestId, {
                situacao: 'autorizada',
                valor_a_pagar: requestData.valorAPagar,
                data_autorizacao: new Date().toISOString(),
                reducao_diarias_50: requestData.reducaoDiarias50 || false,
                ajuda_custo_extraordinaria: requestData.ajudaCustoExtraordinaria || 0,
                desconto_outros_auxilios: requestData.descontoOutrosAuxilios || 0,
            })

            registrarHistorico(requestId, 'pendente', 'autorizada', cpf, nome, requestData.observacoes)

            try {
                const doc = await databases.getDocument(dbId, 'solicitacoes', requestId)
                const html = getAutorizadaTemplate(doc as any)
                const subject = getEmailSubject(doc.protocolo || requestId.slice(0, 8), 'autorizada')
                if (doc.usuario_cpf) {
                    const { documents: users } = await databases.listDocuments(dbId, 'usuarios', [])
                    const user = users.find(u => u.cpf === doc.usuario_cpf)
                    if (user?.email) {
                        sendNotificationEmail(user.email, subject, html)
                    }
                }
            } catch { /* email error */ }

            revalidatePath('/dashboard/admin/requests')
            return { success: true, message: 'Solicitação autorizada com sucesso!' }
        })
    } catch (e: any) {
        return { success: false, message: e.message || 'Erro ao autorizar solicitação' }
    }
}

export async function rejectRequest(requestId: string, motivo: string) {
    try {
        return await requireAdmin().then(async ({ cpf, nome }) => {
            const { databases } = createAdminClient()
            const dbId = process.env.APPWRITE_DATABASE_ID!

            await databases.updateDocument(dbId, 'solicitacoes', requestId, {
                situacao: 'rejeitada',
                motivo_recusa: motivo,
            })

            registrarHistorico(requestId, 'pendente', 'rejeitada', cpf, nome, motivo)

            try {
                const doc = await databases.getDocument(dbId, 'solicitacoes', requestId)
                const html = getRejeitadaTemplate(doc as any, motivo)
                const subject = getEmailSubject(doc.protocolo || requestId.slice(0, 8), 'rejeitada')
                if (doc.usuario_cpf) {
                    const { documents: users } = await databases.listDocuments(dbId, 'usuarios', [])
                    const user = users.find(u => u.cpf === doc.usuario_cpf)
                    if (user?.email) {
                        sendNotificationEmail(user.email, subject, html)
                    }
                }
            } catch { /* email error */ }

            revalidatePath('/dashboard/admin/requests')
            return { success: true, message: 'Solicitação rejeitada.' }
        })
    } catch (e: any) {
        return { success: false, message: e.message || 'Erro ao rejeitar solicitação' }
    }
}

export async function cancelRequest(requestId: string, motivo: string) {
    try {
        return await requireAdmin().then(async ({ cpf, nome }) => {
            const { databases } = createAdminClient()
            const dbId = process.env.APPWRITE_DATABASE_ID!

            await databases.updateDocument(dbId, 'solicitacoes', requestId, {
                situacao: 'cancelada',
                motivo_cancelamento: motivo,
                cancelador_cpf: cpf,
                data_cancelamento: new Date().toISOString(),
            })

            registrarHistorico(requestId, null, 'cancelada', cpf, nome, motivo)

            try {
                const doc = await databases.getDocument(dbId, 'solicitacoes', requestId)
                const html = getCanceladaTemplate(doc as any, motivo, nome)
                const subject = getEmailSubject(doc.protocolo || requestId.slice(0, 8), 'cancelada')
                if (doc.usuario_cpf) {
                    const { documents: users } = await databases.listDocuments(dbId, 'usuarios', [])
                    const user = users.find(u => u.cpf === doc.usuario_cpf)
                    if (user?.email) {
                        sendNotificationEmail(user.email, subject, html)
                    }
                }
            } catch { /* email error */ }

            revalidatePath('/dashboard/admin/requests')
            return { success: true, message: 'Solicitação cancelada.' }
        })
    } catch (e: any) {
        return { success: false, message: e.message || 'Erro ao cancelar solicitação' }
    }
}

export async function approveAccountability(accountabilityId: string) {
    try {
        return await requireAdmin().then(async ({ cpf, nome }) => {
            const { databases } = createAdminClient()
            const dbId = process.env.APPWRITE_DATABASE_ID!

            const ac = await databases.getDocument(dbId, 'prestacao_contas', accountabilityId)

            await databases.updateDocument(dbId, 'prestacao_contas', accountabilityId, {
                status: 'aprovada',
                data_analise: new Date().toISOString(),
            })

            if (ac.solicitacao_id) {
                await databases.updateDocument(dbId, 'solicitacoes', ac.solicitacao_id, {
                    situacao: 'paga_nao_comprovada',
                })
            }

            registrarHistorico(ac.solicitacao_id || '', 'em_avaliacao', 'paga_nao_comprovada', cpf, nome)

            try {
                if (ac.solicitacao_id) {
                    const doc = await databases.getDocument(dbId, 'solicitacoes', ac.solicitacao_id)
                    const html = getComprovadaTemplate(doc as any)
                    const subject = getEmailSubject(doc.protocolo || ac.solicitacao_id.slice(0, 8), 'concluida')
                    if (doc.usuario_cpf) {
                        const { documents: users } = await databases.listDocuments(dbId, 'usuarios', [])
                        const user = users.find(u => u.cpf === doc.usuario_cpf)
                        if (user?.email) {
                            sendNotificationEmail(user.email, subject, html)
                        }
                    }
                }
            } catch { /* email error */ }

            revalidatePath('/dashboard/admin/accountability')
            return { success: true, message: 'Prestação de contas aprovada!' }
        })
    } catch (e: any) {
        return { success: false, message: e.message || 'Erro ao aprovar prestação' }
    }
}

export async function rejectAccountability(accountabilityId: string, motivo: string) {
    try {
        return await requireAdmin().then(async ({ cpf, nome }) => {
            const { databases } = createAdminClient()
            const dbId = process.env.APPWRITE_DATABASE_ID!

            const ac = await databases.getDocument(dbId, 'prestacao_contas', accountabilityId)

            await databases.updateDocument(dbId, 'prestacao_contas', accountabilityId, {
                status: 'em_retificacao',
                motivo_recusa: motivo,
                data_analise: new Date().toISOString(),
            })

            if (ac.solicitacao_id) {
                await databases.updateDocument(dbId, 'solicitacoes', ac.solicitacao_id, {
                    situacao: 'em_retificacao',
                })
            }

            registrarHistorico(ac.solicitacao_id || '', 'em_avaliacao', 'em_retificacao', cpf, nome, motivo)

            try {
                if (ac.solicitacao_id) {
                    const doc = await databases.getDocument(dbId, 'solicitacoes', ac.solicitacao_id)
                    const html = getPrestacaoRejeitadaTemplate(doc as any, motivo)
                    const subject = getEmailSubject(doc.protocolo || ac.solicitacao_id.slice(0, 8), 'em_retificacao')
                    if (doc.usuario_cpf) {
                        const { documents: users } = await databases.listDocuments(dbId, 'usuarios', [])
                        const user = users.find(u => u.cpf === doc.usuario_cpf)
                        if (user?.email) {
                            sendNotificationEmail(user.email, subject, html)
                        }
                    }
                }
            } catch { /* email error */ }

            revalidatePath('/dashboard/admin/accountability')
            return { success: true, message: 'Retificação solicitada.' }
        })
    } catch (e: any) {
        return { success: false, message: e.message || 'Erro ao solicitar retificação' }
    }
}

export async function getUsersList(page = 1, search = '') {
    try {
        const admin = await requireAdmin()
        const { databases } = createAdminClient()
        const dbId = process.env.APPWRITE_DATABASE_ID!

        const offset = (page - 1) * LIMITE_USUARIOS_POR_PAGINA
        const { documents, total } = await databases.listDocuments(dbId, 'usuarios', [
            Query.limit(LIMITE_USUARIOS_POR_PAGINA),
            Query.offset(offset),
        ])

        const data = documents.map(formatDoc)
        return { data, total, page, totalPages: Math.ceil(total / LIMITE_USUARIOS_POR_PAGINA) }
    } catch { return { data: [], total: 0, page: 1, totalPages: 0 } }
}

export async function updateUserProfile(userCpf: string, profileData: any) {
    try {
        await requireAdmin()
        const { databases } = createAdminClient()
        const dbId = process.env.APPWRITE_DATABASE_ID!

        const { documents } = await databases.listDocuments(dbId, 'usuarios', [])
        const userDoc = documents.find(d => d.cpf === userCpf)
        if (!userDoc) throw new Error('Usuário não encontrado')

        await databases.updateDocument(dbId, 'usuarios', userDoc.$id, profileData)
        revalidatePath('/dashboard/admin/users')
        return { success: true, message: 'Perfil atualizado!' }
    } catch (e: any) {
        return { success: false, message: e.message || 'Erro ao atualizar perfil' }
    }
}

export async function registerPayment(requestId: string, dataPagamento: string, valorPago: number) {
    try {
        await requireAdmin()
        const { databases } = createAdminClient()
        const dbId = process.env.APPWRITE_DATABASE_ID!

        await databases.updateDocument(dbId, 'solicitacoes', requestId, {
            data_pagamento: dataPagamento,
            valor_pago: valorPago,
            situacao: 'paga',
        })

        revalidatePath('/dashboard/admin/requests')
        return { success: true, message: 'Pagamento registrado!' }
    } catch (e: any) {
        return { success: false, message: e.message || 'Erro ao registrar pagamento' }
    }
}

export async function updatePaymentInfo(requestId: string, dataPagamento: string, valorPago: number) {
    try {
        await requireAdmin()
        const { databases } = createAdminClient()
        const dbId = process.env.APPWRITE_DATABASE_ID!

        await databases.updateDocument(dbId, 'solicitacoes', requestId, {
            data_pagamento: dataPagamento,
            valor_pago: valorPago,
        })

        revalidatePath('/dashboard/admin/requests')
        return { success: true, message: 'Informações de pagamento atualizadas!' }
    } catch (e: any) {
        return { success: false, message: e.message || 'Erro ao atualizar pagamento' }
    }
}

export async function getAllCategories() {
    try {
        const { databases } = createAdminClient()
        const dbId = process.env.APPWRITE_DATABASE_ID!
        const { documents } = await databases.listDocuments(dbId, 'categorias', [])
        return documents.map(formatDoc)
    } catch { return [] }
}

export async function updateRequestFinancialValues(requestId: string, data: any) {
    try {
        await requireAdmin()
        const { databases } = createAdminClient()
        const dbId = process.env.APPWRITE_DATABASE_ID!

        await databases.updateDocument(dbId, 'solicitacoes', requestId, {
            ajuda_custo_extraordinaria: data.ajudaCustoExtraordinaria,
            desconto_outros_auxilios: data.descontoOutrosAuxilios,
            valor_a_pagar: data.valorAPagar,
            reducao_diarias_50: data.reducaoDiarias50 || false,
        })

        revalidatePath('/dashboard/admin/requests')
        return { success: true, message: 'Valores atualizados!' }
    } catch (e: any) {
        return { success: false, message: e.message || 'Erro ao atualizar valores' }
    }
}

export async function approveAccountabilityWithPayment(accountabilityId: string, dataPagamento: string, valorPago: number) {
    try {
        await requireAdmin()
        const { databases } = createAdminClient()
        const dbId = process.env.APPWRITE_DATABASE_ID!

        const ac = await databases.getDocument(dbId, 'prestacao_contas', accountabilityId)

        await databases.updateDocument(dbId, 'prestacao_contas', accountabilityId, {
            status: 'aprovada',
            data_analise: new Date().toISOString(),
        })

        if (ac.solicitacao_id) {
            await databases.updateDocument(dbId, 'solicitacoes', ac.solicitacao_id, {
                situacao: 'paga_comprovada',
                data_pagamento: dataPagamento,
                valor_pago: valorPago,
            })
        }

        revalidatePath('/dashboard/admin/accountability')
        return { success: true, message: 'Prestação aprovada e pagamento registrado!' }
    } catch (e: any) {
        return { success: false, message: e.message || 'Erro ao aprovar prestação com pagamento' }
    }
}
