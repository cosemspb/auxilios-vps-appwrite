'use client'

import Link from 'next/link'
import { ArrowRightLeft } from 'lucide-react'

interface RoleSwitcherButtonProps {
    target: 'requester' | 'authorizer'
}

export function RoleSwitcherButton({ target }: RoleSwitcherButtonProps) {
    const isToRequester = target === 'requester'
    const href = isToRequester ? '/dashboard?view=requester' : '/dashboard'
    const label = isToRequester ? 'Alternar para Solicitante' : 'Voltar para Autorizador'

    return (
        <>
            <style>{`.role-switcher-btn { background-color: var(--primary); } .role-switcher-btn:hover { background-color: var(--primary-hover); }`}</style>
            <Link
                href={href}
                className="role-switcher-btn inline-flex items-center gap-2 px-4 py-3 text-white rounded-lg font-medium shadow-sm transition-colors"
            >
                <ArrowRightLeft className="w-4 h-4" />
                {label}
            </Link>
        </>
    )
}
