'use client'

import { Clock, ThumbsUp, FileText, AlertTriangle, CheckCircle, ClipboardCheck } from 'lucide-react'
import { StatCard } from '@/components/dashboard/stat-card'
import { CollapsibleSection } from '@/components/ui/collapsible-section'

interface DashboardMetricsProps {
    pendingRequests: number
    preApprovedRequests: number
    pendingAccountabilities: number
    pendingCorrections: number
    authorizedRequests: number
    comprovadasRequests?: number
}

export function DashboardMetrics({
    pendingRequests,
    preApprovedRequests,
    pendingAccountabilities,
    pendingCorrections,
    authorizedRequests,
    comprovadasRequests = 0
}: DashboardMetricsProps) {
    return (
        <CollapsibleSection title="Visão Geral" defaultOpen={false}>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                <StatCard
                    title="Pendentes de Autorização"
                    value={pendingRequests}
                    icon={Clock}
                    iconColorHex="#dc2626"
                />
                <StatCard
                    title="Pré-aprovadas"
                    value={preApprovedRequests}
                    icon={ThumbsUp}
                    iconColorHex="#ca8a04"
                />
                <StatCard
                    title="Pendentes de análise"
                    value={pendingAccountabilities}
                    icon={FileText}
                    iconColorHex="#2563eb"
                />
                <StatCard
                    title="Pendentes de Correção"
                    value={pendingCorrections}
                    icon={AlertTriangle}
                    iconColorHex="#ea580c"
                />
                <StatCard
                    title="Autorizadas"
                    value={authorizedRequests}
                    icon={CheckCircle}
                    iconColorHex="#16a34a"
                />
                <StatCard
                    title="Comprovadas"
                    value={comprovadasRequests}
                    icon={ClipboardCheck}
                    iconColorHex="#1e40af"
                />
            </div>
        </CollapsibleSection>
    )
}
