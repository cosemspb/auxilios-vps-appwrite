import dynamic from 'next/dynamic'
import { createClient, createAdminClient } from '@/lib/appwrite/server'
import { Query } from 'node-appwrite'
import { DashboardActions } from '@/components/dashboard/dashboard-actions'
import { RoleSwitcherButton } from '@/components/dashboard/role-switcher-button'
import { RectificationAlert } from '@/components/dashboard/rectification-alert'
import { RequesterMetrics } from '@/components/dashboard/requester-metrics'
import { DeadlinesTable } from '@/components/dashboard/deadlines-table'
import { RecentRequestsTable } from '@/components/dashboard/recent-requests-table'

const ManagementDashboard = dynamic(() => import('@/components/dashboard/management-dashboard').then(m => m.ManagementDashboard))

export default async function DashboardPage({
    searchParams,
}: {
    searchParams: Promise<{ view?: string }>
}) {
    const { account } = createClient()
    const params = await searchParams

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
        // ignore
    }

    const isAdmin = profile?.tipo_perfil_id === 4
    const isAuthorizerRede = profile?.tipo_perfil_id === 2
    const isAuthorizer = profile?.tipo_perfil_id === 3
    const isAuthorizerRole = isAuthorizerRede || isAuthorizer || isAdmin
    const viewAsRequester = params.view === 'requester'
    const userCpf = profile?.cpf

    if (!viewAsRequester) {
        const perfilId = isAdmin ? 4 : isAuthorizerRede ? 2 : isAuthorizer ? 3 : 0
        if (perfilId) return <ManagementDashboard perfilId={perfilId} />
    }

    let pendingRequests = 0
    let approvedRequestsCount = 0
    let rejectedRequestsCount = 0
    let evaluationRequestsCount = 0
    let rectificationRequestsCount = 0
    let completedRequestsCount = 0
    let allApproved: any[] = []
    let rectificationRequests: any[] = []
    let recentRequests: any[] = []

    try {
        const filters = userCpf ? [Query.equal('usuario_cpf', userCpf)] : []

        const pendingResult = await databases.listDocuments(dbId, 'solicitacoes', [
            ...filters,
            Query.equal('situacao', 'pendente'),
        ])
        pendingRequests = pendingResult.total

        const approvedResult = await databases.listDocuments(dbId, 'solicitacoes', [
            ...filters,
            Query.equal('situacao', 'autorizada'),
        ])
        approvedRequestsCount = approvedResult.total

        const rejectedResult = await databases.listDocuments(dbId, 'solicitacoes', [
            ...filters,
            Query.equal('situacao', 'rejeitada'),
        ])
        rejectedRequestsCount = rejectedResult.total

        const evalResult = await databases.listDocuments(dbId, 'solicitacoes', [
            ...filters,
            Query.equal('situacao', 'em_avaliacao'),
        ])
        evaluationRequestsCount = evalResult.total

        const rectResult = await databases.listDocuments(dbId, 'solicitacoes', [
            ...filters,
            Query.equal('situacao', 'em_retificacao'),
        ])
        rectificationRequestsCount = rectResult.total

        const completedResult = await databases.listDocuments(dbId, 'solicitacoes', [
            ...filters,
            Query.equal('situacao', 'concluida'),
        ])
        completedRequestsCount = completedResult.total

        const approvedDocs = await databases.listDocuments(dbId, 'solicitacoes', [
            ...filters,
            Query.equal('situacao', 'autorizada'),
            Query.limit(10),
        ])
        allApproved = approvedDocs.documents

        const allIds = allApproved.map((r: any) => r.$id)
        let excludedIds = new Set<string>()
        if (allIds.length > 0) {
            const pcResult = await databases.listDocuments(dbId, 'prestacao_contas', [
                Query.equal('solicitacao_id', allIds[0]),
            ])
            for (const pc of pcResult.documents) {
                if (pc.status !== 'rascunho') {
                    excludedIds.add(pc.solicitacao_id)
                }
            }
        }

        const approvedRequests = allApproved
            .filter((r: any) => !excludedIds.has(r.$id))
            .slice(0, 5)
            .map((r: any) => ({
                id: r.$id,
                protocolo: r.protocolo,
                nome_evento: r.nome_evento,
                data_retorno: r.data_retorno,
            }))

        if (userCpf) {
            const rectResult2 = await databases.listDocuments(dbId, 'solicitacoes', [
                Query.equal('usuario_cpf', userCpf),
                Query.equal('situacao', 'em_retificacao'),
            ])
            rectificationRequests = rectResult2.documents

            const recentResult = await databases.listDocuments(dbId, 'solicitacoes', [
                Query.equal('usuario_cpf', userCpf),
                Query.limit(5),
            ])
            recentRequests = recentResult.documents
        }
    } catch (e) {
        console.error('Error fetching dashboard data:', e)
    }

    return (
        <div className="space-y-4 md:space-y-6 lg:space-y-8">
            {isAuthorizerRole && viewAsRequester && (
                <div className="flex justify-end">
                    <RoleSwitcherButton target="authorizer" />
                </div>
            )}

            <RectificationAlert requests={rectificationRequests ?? []} />

            <RequesterMetrics
                pendingRequests={pendingRequests}
                approvedRequestsCount={approvedRequestsCount}
                rejectedRequestsCount={rejectedRequestsCount}
                evaluationRequestsCount={evaluationRequestsCount}
                rectificationRequestsCount={rectificationRequestsCount}
                completedRequestsCount={completedRequestsCount}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DashboardActions />
                <DeadlinesTable approvedRequests={allApproved ?? []} />
            </div>

            <RecentRequestsTable recentRequests={recentRequests ?? []} />
        </div>
    )
}
