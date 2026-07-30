'use client'

import type { LucideIcon } from 'lucide-react'

interface EmptyTableStateProps {
    icon: LucideIcon
    title?: string
    description: string
}

export function EmptyTableState({ icon: Icon, title, description }: EmptyTableStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                <Icon className="w-8 h-8 text-gray-400" />
            </div>
            {title && <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>}
            <p className="text-gray-500">{description}</p>
        </div>
    )
}
