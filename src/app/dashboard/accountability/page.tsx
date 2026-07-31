import { createClient, createAdminClient } from '@/lib/appwrite/server'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, CalendarClock } from 'lucide-react'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatDate, getDeadline, getDeadlineColor, getDaysRemaining } from '@/lib/format-utils'

export default async function AccountabilityListPage() {
    const { account } = await createClient()

    let user
    try {
        user = await account.get()
    } catch {
        return <div>Usuário não autenticado</div>
    }

    if (!user) return <div>Usuário não autenticado</div>

    const { databases } = createAdminClient()
    const dbId = process.env.APPWRITE_DATABASE_ID!

    let profile: any = null
    try {
        const { documents } = await databases.listDocuments(dbId, 'usuarios', [])
        profile = documents.find(d => d.auth_id === user.$id) || null
    } catch {
        return <div>Perfil de usuário não encontrado</div>
    }

    if (!profile) return <div>Perfil de usuário não encontrado</div>

    let requests: any[] = []
    let completedRequests: any[] = []

    try {
        const { documents } = await databases.listDocuments(dbId, 'solicitacoes', [])
        const userRequests = documents.filter(d => d.usuario_cpf === profile.cpf)
        requests = userRequests.filter(d =>
            ['autorizada', 'em_retificacao', 'paga', 'paga_nao_comprovada'].includes(d.situacao)
        )
        completedRequests = userRequests.filter(d =>
            ['concluida', 'paga_comprovada'].includes(d.situacao)
        )
    } catch {
        // ignore
    }

    return (
        <div className="space-y-4 md:space-y-6 lg:space-y-8">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Prestação de Contas</h2>
                <p className="text-muted-foreground">Gerencie suas prestações de contas de viagens realizadas.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {requests?.map((request) => {
                    const deadline = getDeadline(request.data_retorno, request.data_periodo_fim)
                    const daysRemaining = deadline ? getDaysRemaining(deadline) : null
                    const color = daysRemaining !== null ? getDeadlineColor(daysRemaining) : null

                    return (
                        <Card
                            key={request.$id}
                            style={color ? { borderLeft: `4px solid ${color.border}` } : undefined}
                        >
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-center mb-2">
                                    <CardTitle className="text-lg font-semibold line-clamp-1" title={request.nome_evento}>
                                        {request.nome_evento}
                                    </CardTitle>
                                    <StatusBadge status={request.situacao} />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-gray-500">
                                        <span className="text-blue-600 font-medium">Protocolo: </span>
                                        <span className="font-mono">{request.protocolo || 'N/A'}</span>
                                    </p>
                                    <CardDescription>
                                        <span className="text-blue-600 font-medium">Período: </span>
                                        {formatDate(request.data_periodo_inicio)} - {formatDate(request.data_periodo_fim)}
                                    </CardDescription>
                                    {deadline && color && (
                                        <p className="text-xs font-medium flex items-center gap-1" style={{ color: color.text }}>
                                            <CalendarClock className="w-3.5 h-3.5" />
                                            Prazo: {deadline.toLocaleDateString('pt-BR')} ({color.label})
                                        </p>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="mt-4">
                                    <Link href={`/dashboard/accountability/${request.$id}`}>
                                        <Button className="w-full" variant="primary">
                                            Prestar Contas
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}

                {(!requests || requests.length === 0) && (
                    <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">Nenhuma prestação pendente</h3>
                        <p className="text-gray-500">Você não possui viagens aguardando prestação de contas.</p>
                    </div>
                )}
            </div>

            {completedRequests && completedRequests.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800">Comprovadas</h3>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {completedRequests.map((request) => (
                            <Card key={request.$id}>
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-center mb-2">
                                        <CardTitle className="text-lg font-semibold line-clamp-1" title={request.nome_evento}>
                                            {request.nome_evento}
                                        </CardTitle>
                                        <StatusBadge status={request.situacao} />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-gray-500">
                                            <span className="text-blue-600 font-medium">Protocolo: </span>
                                            <span className="font-mono">{request.protocolo || 'N/A'}</span>
                                        </p>
                                        <CardDescription>
                                            <span className="text-blue-600 font-medium">Período: </span>
                                            {formatDate(request.data_periodo_inicio)} - {formatDate(request.data_periodo_fim)}
                                        </CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="mt-4">
                                        <Link href={`/dashboard/accountability/${request.$id}`}>
                                            <Button className="w-full" variant="outline">Visualizar</Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
