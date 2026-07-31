'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { LayoutDashboard, FileText, PlusCircle, Receipt, User, LogOut, Settings, Users, BarChart, Mail, Database, RotateCcw, HeartHandshake, History, FileSearch } from 'lucide-react'
import { logout } from '@/app/auth/actions'

const menuItems = [
    { icon: LayoutDashboard, label: 'Início', href: '/dashboard' },
    { icon: FileText, label: 'Solicitações', href: '/dashboard/requests', requesterOnly: true },
    { icon: PlusCircle, label: 'Nova Solicitação', href: '/dashboard/requests/new', requesterOnly: true },
    { icon: Receipt, label: 'Prestação de Contas', href: '/dashboard/accountability', requesterOnly: true },
    { icon: BarChart, label: 'Solicitações Pagas', href: '/dashboard/admin/reports/payments', adminOnly: true, authorizerAlso: true },
    { icon: FileSearch, label: 'Relatório Solicitações', href: '/dashboard/admin/reports/requests', adminOnly: true },
    { icon: Users, label: 'Usuários', href: '/dashboard/admin/users', adminOnly: true },
    { icon: Settings, label: 'Configuração SMTP', href: '/dashboard/admin/settings/smtp', adminOnly: true },
    { icon: Mail, label: 'Notificações por E-mail', href: '/dashboard/admin/settings/email-templates', adminOnly: true },
    { icon: Database, label: 'Backup', href: '/dashboard/admin/backup', adminOnly: true },
    { icon: History, label: 'Restaurar Backup', href: '/dashboard/admin/restore', adminOnly: true },
    { icon: RotateCcw, label: 'Reset Banco', href: '/dashboard/admin/reset', adminOnly: true },
]

export function Sidebar({ user, userRole }: { user: any; userRole?: number }) {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [mobileOpen, setMobileOpen] = useState(false)
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const mq = window.matchMedia('(max-width: 1023px)')
        setIsMobile(mq.matches)
        const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
        mq.addEventListener('change', handler)
        return () => mq.removeEventListener('change', handler)
    }, [])

    // Fechar sidebar ao navegar (mobile)
    useEffect(() => {
        setMobileOpen(false)
    }, [pathname])

    const viewAsRequester = searchParams.get('view') === 'requester'
    const isAuthorizer = userRole === 2 || userRole === 3

    const filteredMenuItems = menuItems.filter(item => {
        if ((item as any).adminOnly) {
            if ((item as any).authorizerAlso && isAuthorizer) return true
            return userRole === 4
        }
        if (!(item as any).requesterOnly) return true
        if (isAuthorizer && !viewAsRequester) return false
        return true
    })

    const getPerfilNome = (tipoPerfilId: number | null | undefined): string => {
        const perfis: { [key: number]: string } = {
            1: 'Solicitante',
            2: 'Autorizador Rede',
            3: 'Autorizador',
            4: 'Administrador'
        }
        return perfis[tipoPerfilId || 1] || 'Solicitante'
    }

    const sidebarContent = (
        <>
            <div className="brand">
                <img src="/logo.png" alt="COSEMS PB" width="140" />
                <HeartHandshake className="brand-icon" />
                <span className="brand-label">Gestão de Auxílios</span>
                <span className="appwrite-badge sm mt-1.5" title="Ambiente: Appwrite">AW</span>
            </div>

            <div className="flex flex-col items-center px-6 pb-4 mb-6">
                <div className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden mb-2" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
                    {user?.avatar_url ? (
                        <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <User className="w-8 h-8" />
                    )}
                </div>
                <h3 className="font-semibold text-sm" style={{ color: '#1d273b' }}>
                    {(user?.nome || user?.user_metadata?.nome || 'Usuário').split(' ')[0]}
                </h3>
                <p className="text-xs mb-2" style={{ color: '#64748b' }}>{getPerfilNome(user?.tipo_perfil_id)}</p>
                <Link
                    href="/dashboard/profile"
                    className="text-xs font-medium px-3 py-1 rounded-full transition-colors"
                    style={{ color: 'var(--primary)', border: '1px solid rgba(32,107,196,0.2)' }}
                >
                    Editar Perfil
                </Link>
            </div>

            <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                {filteredMenuItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href
                    const linkClass = isActive ? 'nav-link-active' : 'nav-link-default'
                    const targetHref = viewAsRequester ? `${item.href}?view=requester` : item.href

                    return (
                        <Link
                            key={item.href}
                            href={targetHref}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${linkClass}`}
                            style={{ color: isActive ? 'var(--primary)' : '#1d273b' }}
                        >
                            <Icon className="w-5 h-5 shrink-0" />
                            {item.label}
                        </Link>
                    )
                })}
            </nav>
            <div className="p-4">
                <button
                    onClick={() => logout()}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm logout-btn"
                    style={{
                        border: 'none',
                        outline: 'none',
                        color: '#ef4444'
                    }}
                >
                    <LogOut className="w-4 h-4 shrink-0" />
                    Sair
                </button>
            </div>
        </>
    )

    return (
        <>
            {/* Mobile hamburger (only on mobile) */}
            {isMobile && (
                <div className="fixed" style={{ top: '12px', right: '12px', zIndex: 30 }}>
                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className={`hamburger ${mobileOpen ? 'is-active' : ''}`}
                        aria-label="Menu" aria-expanded={mobileOpen}
                    >
                        <span className="line"></span>
                        <span className="line"></span>
                        <span className="line"></span>
                    </button>
                </div>
            )}

            {/* Mobile backdrop + sidebar overlay (only on mobile) */}
            {isMobile && mobileOpen && (
                <div className="fixed inset-0 z-40" onClick={() => setMobileOpen(false)}>
                    <div className="absolute inset-0 bg-black/50" />
                    <aside
                        className="absolute inset-y-0 left-0 w-64 flex flex-col shadow-xl sidebar-compact"
                        style={{ background: '#dddddd', borderRight: '1px solid #b3b3b3' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {sidebarContent}
                    </aside>
                </div>
            )}

            {/* Desktop sidebar (only on desktop) */}
            {!isMobile && (
                <aside className="w-64 flex-col h-screen fixed left-0 top-0 z-10 flex sidebar-compact" style={{ background: '#dddddd', borderRight: '1px solid #b3b3b3' }}>
                    {sidebarContent}
                </aside>
            )}
        </>
    )
}
