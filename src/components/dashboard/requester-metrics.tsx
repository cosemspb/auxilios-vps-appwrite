'use client'

import { Clock, CheckCircle, ThumbsDown, AlertCircle } from 'lucide-react'
import { StatCard } from '@/components/dashboard/stat-card'
import { CollapsibleSection } from '@/components/ui/collapsible-section'

interface RequesterMetricsProps {
    pendingRequests: number | null
    approvedRequestsCount: number | null
    rejectedRequestsCount: number | null
    evaluationRequestsCount: number | null
    rectificationRequestsCount: number | null
    completedRequestsCount: number | null
}

export function RequesterMetrics({
    pendingRequests,
    approvedRequestsCount,
    rejectedRequestsCount,
    evaluationRequestsCount,
    rectificationRequestsCount,
    completedRequestsCount,
}: RequesterMetricsProps) {
    return (
        <CollapsibleSection title="Visão Geral" defaultOpen={false}>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <StatCard
                    title="Pendentes"
                    value={pendingRequests || 0}
                    icon={Clock}
                    color="text-yellow-600"
                    bgColor="bg-yellow-100"
                    bgColorHex="#fef9c3"
                    iconColorHex="#ca8a04"
                />
                <StatCard
                    title="Autorizadas"
                    value={approvedRequestsCount || 0}
                    icon={CheckCircle}
                    color="text-green-600"
                    bgColor="bg-green-100"
                    bgColorHex="#dcfce7"
                    iconColorHex="#16a34a"
                />
                <StatCard
                    title="Rejeitadas"
                    value={rejectedRequestsCount || 0}
                    icon={ThumbsDown}
                    color="text-red-600"
                    bgColor="bg-red-100"
                    bgColorHex="#fee2e2"
                    iconColorHex="#dc2626"
                />
                <StatCard
                    title="Em Avaliação"
                    value={evaluationRequestsCount || 0}
                    icon={Clock}
                    color="text-purple-600"
                    bgColor="bg-purple-100"
                    bgColorHex="#f3e8ff"
                    iconColorHex="#9333ea"
                />
                <StatCard
                    title="Em Retificação"
                    value={rectificationRequestsCount || 0}
                    icon={AlertCircle}
                    color="text-orange-600"
                    bgColor="bg-orange-100"
                    bgColorHex="#ffedd5"
                    iconColorHex="#ea580c"
                />
                <StatCard
                    title="Concluídas"
                    value={completedRequestsCount || 0}
                    icon={CheckCircle}
                    color="text-blue-600"
                    bgColor="bg-blue-100"
                    bgColorHex="#dbeafe"
                    iconColorHex="#2563eb"
                />
            </div>
        </CollapsibleSection>
    )
}
