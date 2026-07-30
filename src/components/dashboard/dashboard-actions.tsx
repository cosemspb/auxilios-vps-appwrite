'use client'

import Link from 'next/link'
import { memo } from 'react'
import { Plus, FileText, ArrowRight } from 'lucide-react'

export const DashboardActions = memo(function DashboardActions() {
    const actions = [
        {
            id: 'new-request',
            href: '/dashboard/requests/new',
            icon: Plus,
            title: 'Nova Solicitação',
            description: 'Criar pedido de auxílio',
            bgColor: '#f7fee7',
            borderColor: '#ecfccb',
            hoverBorderColor: '#d9f99d',
            iconColor: '#65a30d',
            titleColor: '#365314',
            descColor: '#4d7c0f',
            hoverBgColor: '#ecfce5'
        },
        {
            id: 'my-requests',
            href: '/dashboard/requests',
            icon: FileText,
            title: 'Minhas Solicitações',
            description: 'Acompanhar pedidos',
            bgColor: '#eff6ff',
            borderColor: '#dbeafe',
            hoverBorderColor: '#bfdbfe',
            iconColor: '#2563eb',
            titleColor: '#111827',
            descColor: '#4b5563',
            hoverBgColor: '#dbeafe'
        },
        {
            id: 'accountability',
            href: '/dashboard/accountability',
            icon: ArrowRight,
            title: 'Prestação de Contas',
            description: 'Enviar comprovantes',
            bgColor: '#faf5ff',
            borderColor: '#f3e8ff',
            hoverBorderColor: '#e9d5ff',
            iconColor: '#9333ea',
            titleColor: '#111827',
            descColor: '#4b5563',
            hoverBgColor: '#f3e8ff'
        }
    ]

    return (
        <div className="card overflow-hidden border-0 shadow-sm p-3">
            <style>{actions.map(a => `
                .action-card-${a.id}:hover {
                    background-color: ${a.hoverBgColor} !important;
                    border-color: ${a.hoverBorderColor} !important;
                }
            `).join('')}</style>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {actions.map((action) => {
                        const Icon = action.icon

                        return (
                            <Link
                                key={action.id}
                                href={action.href}
                                className="flex-1"
                            >
                                <div
                                    className={`action-card-${action.id} transition-all cursor-pointer p-5 rounded-lg flex flex-col items-center text-center gap-3 min-h-120px justify-center hover:-translate-y-0.5 hover:shadow-md`}
                                    style={{
                                        backgroundColor: action.bgColor,
                                        borderColor: action.borderColor,
                                        borderWidth: '1px',
                                        borderStyle: 'solid',
                                        boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)'
                                    }}
                                >
                                    <div
                                        className="w-12 h-12 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm"
                                        style={{ color: action.iconColor }}
                                    >
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3
                                            className="font-semibold"
                                            style={{ color: action.titleColor }}
                                        >
                                            {action.title}
                                        </h3>
                                        <p
                                            className="text-xs mt-1"
                                            style={{ color: action.descColor }}
                                        >
                                            {action.description}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        )
                    })}
                </div>
        </div>
    )
})
