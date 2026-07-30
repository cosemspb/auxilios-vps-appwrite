'use client'

import { useState, ReactNode } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface CollapsibleSectionProps {
    title: string
    defaultOpen?: boolean
    id?: string
    children: ReactNode
}

export function CollapsibleSection({ title, defaultOpen = true, id, children }: CollapsibleSectionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen)

    return (
        <div id={id}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4 cursor-pointer hover:text-primary transition-colors bg-transparent border-none p-0"
            >
                {isOpen ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                {title}
            </button>
            {isOpen && <div>{children}</div>}
        </div>
    )
}
