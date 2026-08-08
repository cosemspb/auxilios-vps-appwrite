'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Modal } from '@/components/ui/modal'
import { getUsersList, getAllCategories, updateUserProfile } from '@/app/actions/admin-actions'
import { inviteUser, resetUserPassword, diagnosticLogin } from '@/app/actions/auth-actions'
import { Search, Loader2, UserPlus, Pencil, X, Copy, Check } from 'lucide-react'
import { formatDocumento, safeJsonParse, DadosBancarios } from '@/lib/format-utils'

export default function UsersPage() {
    const [users, setUsers] = useState<any[]>([])
    const [categories, setCategories] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    const fetchUsers = useCallback(async () => {
        setIsLoading(true)
        try {
            const result = await getUsersList(page, search)
            setUsers(result.data || [])
            setTotalPages(result.totalPages)
        } catch (error) {
            console.error('Erro ao buscar usuários:', error)
        } finally {
            setIsLoading(false)
        }
    }, [page, search])

    useEffect(() => {
        const loadCategories = async () => {
            const cats = await getAllCategories()
            setCategories(cats || [])
        }
        loadCategories()
    }, [])

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchUsers()
        }, 300)
        return () => clearTimeout(debounce)
    }, [fetchUsers])

    const getPerfilLabel = (id: number) => {
        const perfis: Record<number, string> = {
            1: 'Solicitante',
            2: 'Autorizador Rede',
            3: 'Autorizador',
            4: 'Administrador'
        }
        return perfis[id] || 'Desconhecido'
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ativo': return 'bg-green-100 text-green-800'
            case 'inativo': return 'bg-gray-100 text-gray-800'
            case 'bloqueado': return 'bg-red-100 text-red-800'
            case 'pendente': return 'bg-yellow-100 text-yellow-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    // ============================================================
    // INVITE MODAL STATE & HANDLERS
    // ============================================================
    const [showInviteModal, setShowInviteModal] = useState(false)
    const [inviteData, setInviteData] = useState({ nome: '', email: '', tipo_perfil_id: 1, categoria_id: '' })
    const [inviteState, setInviteState] = useState<{ success: boolean; error?: string; message?: string; tempPassword?: string; emailWarning?: boolean } | null>(null)
    const [inviting, setInviting] = useState(false)

    const handleInvite = async () => {
        setInviting(true)
        setInviteState(null)
        try {
            const result = await inviteUser({
                nome: inviteData.nome,
                email: inviteData.email,
                tipo_perfil_id: Number(inviteData.tipo_perfil_id),
                categoria_id: inviteData.categoria_id ? Number(inviteData.categoria_id) : null,
            })
            if (result.success) {
                setInviteData({ nome: '', email: '', tipo_perfil_id: 1, categoria_id: '' })
                setShowInviteModal(false)
                const { message, tempPassword, emailWarning } = result as { success: true; message: string; tempPassword?: string; emailWarning?: boolean }
                if (emailWarning && tempPassword) {
                    alert(message + '\n\nSenha temporária: ' + tempPassword)
                } else {
                    alert(message || 'Convite enviado com sucesso!')
                }
                fetchUsers()
            } else {
                setInviteState({ success: false, error: result.message })
            }
        } catch {
            setInviteState({ success: false, error: 'Erro ao enviar convite.' })
        } finally {
            setInviting(false)
        }
    }

    // ============================================================
    // EDIT MODAL STATE & HANDLERS
    // ============================================================
    const [editUser, setEditUser] = useState<any>(null)
    const [editNome, setEditNome] = useState('')
    const [editWhatsapp, setEditWhatsapp] = useState('')
    const [editNecessidades, setEditNecessidades] = useState('')
    const [editBanco, setEditBanco] = useState('')
    const [editAgencia, setEditAgencia] = useState('')
    const [editConta, setEditConta] = useState('')
    const [editPix, setEditPix] = useState('')
    const [editPerfil, setEditPerfil] = useState('1')
    const [editStatus, setEditStatus] = useState('ativo')
    const [editCategoria, setEditCategoria] = useState('')
    const [savingEdit, setSavingEdit] = useState(false)
    const [resettingPass, setResettingPass] = useState(false)
    const [resetResult, setResetResult] = useState<{ tempPassword?: string; error?: string } | null>(null)
    const [copied, setCopied] = useState(false)
    const [editError, setEditError] = useState('')
    const [diagnosticPass, setDiagnosticPass] = useState('')
    const [diagnosticResult, setDiagnosticResult] = useState<string | null>(null)
    const [diagnosticLoading, setDiagnosticLoading] = useState(false)

    const openEditModal = (user: any) => {
        const bankData = safeJsonParse<DadosBancarios>(user.dados_bancarios, {})
        setEditUser(user)
        setEditNome(user.nome || '')
        setEditWhatsapp(user.whatsapp || '')
        setEditNecessidades(user.necessidades_especiais || '')
        setEditBanco(bankData.banco || '')
        setEditAgencia(bankData.agencia || '')
        setEditConta(bankData.conta || '')
        setEditPix(bankData.pix || '')
        setEditPerfil(String(user.tipo_perfil_id))
        setEditStatus(user.status)
        setEditCategoria(user.categoria_id ? String(user.categoria_id) : '')
        setResetResult(null)
        setCopied(false)
        setEditError('')
    }

    const closeEditModal = () => {
        setEditUser(null)
    }

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editUser) return
        setSavingEdit(true)
        setEditError('')
        try {
            const result = await updateUserProfile(editUser.cpf, {
                nome: editNome,
                whatsapp: editWhatsapp || null,
                necessidades_especiais: editNecessidades || null,
                dados_bancarios: JSON.stringify({ banco: editBanco || '', agencia: editAgencia || '', conta: editConta || '', pix: editPix || '' }),
                tipo_perfil_id: parseInt(editPerfil),
                status: editStatus,
                categoria_id: editCategoria ? parseInt(editCategoria) : null
            })
            if (result.success) {
                closeEditModal()
                fetchUsers()
            } else {
                setEditError(result.message || 'Erro desconhecido')
            }
        } catch (err: any) {
            setEditError(err.message || 'Erro inesperado')
        } finally {
            setSavingEdit(false)
        }
    }

    const handleResetPassword = async () => {
        if (!editUser) return
        setResettingPass(true)
        setResetResult(null)
        try {
            const result = await resetUserPassword(editUser.cpf)
            if (result.success) {
                const { tempPassword } = result as { success: true; tempPassword: string }
                setResetResult({ tempPassword })
            } else {
                setResetResult({ error: result.message })
            }
        } catch {
            setResetResult({ error: 'Erro inesperado ao redefinir senha' })
        } finally {
            setResettingPass(false)
        }
    }

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch { }
    }

    const handleDiagnosticTest = async () => {
        if (!editUser || !diagnosticPass) return
        setDiagnosticLoading(true)
        setDiagnosticResult(null)
        try {
            const r = await diagnosticLogin(editUser.email, diagnosticPass)
            setDiagnosticResult(JSON.stringify(r, null, 2))
        } catch (e: unknown) {
            setDiagnosticResult('Erro: ' + (e instanceof Error ? e.message : 'desconhecido'))
        } finally {
            setDiagnosticLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestão de Usuários</h1>
                    <p className="text-gray-500">Gerencie perfis e permissões de acesso</p>
                </div>
                <Button onClick={() => setShowInviteModal(true)}>
                    <UserPlus className="w-4 h-4" style={{ marginRight: '5px' }} />
                    Convidar Usuário
                </Button>
            </div>

            {/* ===== INVITE MODAL ===== */}
            <Modal isOpen={showInviteModal} onClose={() => { setShowInviteModal(false); setInviteState(null) }} title="Convidar Usuário">
                {inviteState?.error ? (
                    <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md text-center mb-4">
                        {inviteState.error}
                    </div>
                ) : null}
                <div className="space-y-3">
                    <Input placeholder="Nome completo" value={inviteData.nome} onChange={(e) => setInviteData(prev => ({ ...prev, nome: e.target.value }))} />
                    <Input type="email" placeholder="E-mail" value={inviteData.email} onChange={(e) => setInviteData(prev => ({ ...prev, email: e.target.value }))} />
                    <select value={inviteData.tipo_perfil_id} onChange={(e) => setInviteData(prev => ({ ...prev, tipo_perfil_id: Number(e.target.value) }))}
                        className="w-full h-10 rounded-md border border-gray-300 px-3 text-sm focus:border-primary focus:ring-primary">
                        <option value="1">Solicitante</option>
                        <option value="2">Autorizador Rede</option>
                        <option value="3">Autorizador</option>
                        <option value="4">Administrador</option>
                    </select>
                    <select value={inviteData.categoria_id} onChange={(e) => setInviteData(prev => ({ ...prev, categoria_id: e.target.value }))}
                        className="w-full h-10 rounded-md border border-gray-300 px-3 text-sm focus:border-primary focus:ring-primary">
                        <option value="">Sem categoria</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.nome_categoria}</option>
                        ))}
                    </select>
                    {inviteState?.error && (
                        <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md text-center">{inviteState.error}</div>
                    )}
                    <div className="flex gap-3 pt-2">
                        <Button variant="outline" onClick={() => { setShowInviteModal(false); setInviteState(null) }} className="flex-1">Cancelar</Button>
                        <Button onClick={handleInvite} disabled={inviting || !inviteData.nome || !inviteData.email} className="flex-1">
                            {inviting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Enviando...</> : 'Enviar Convite'}
                        </Button>
                    </div>
                </div>
            </Modal>

            <Card className="p-0 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 grid grid-cols-4 gap-4">
                    <div className="relative col-span-2">
                        <Search className="w-4 h-4 absolute text-gray-400 pointer-events-none" style={{ left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                        <input type="text" placeholder="Buscar por nome, email ou CPF/CNPJ..." className="input h-10 w-full" style={{ paddingLeft: '48px' }}
                            value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50">
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Nome</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">E-mail</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">CPF/CNPJ</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Perfil</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Categoria</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr key="loading-row">
                                    <td colSpan={7} className="text-center py-8 text-gray-500">
                                        <div className="flex justify-center items-center"><Loader2 className="w-6 h-6 animate-spin mr-2" />Carregando...</div>
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr key="empty-row">
                                    <td colSpan={7} className="text-center py-8 text-gray-500">Nenhum usuário encontrado</td>
                                </tr>
                            ) : (
                                users.map((user, index) => (
                                    <tr key={user.cpf || `user-${index}`} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                        <td className="py-3 px-4 text-sm font-medium text-gray-900">{user.nome}</td>
                                        <td className="py-3 px-4 text-sm text-gray-600">{user.email}</td>
                                        <td className="py-3 px-4 text-sm text-gray-600">{formatDocumento(user.cpf)}</td>
                                        <td className="py-3 px-4 text-sm">
                                            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-medium"
                                                style={{ backgroundColor: user.tipo_perfil_id == 4 ? '#f3e8ff' : user.tipo_perfil_id == 2 ? '#fff7ed' : '#dbeafe', color: user.tipo_perfil_id == 4 ? '#6b21a8' : user.tipo_perfil_id == 2 ? '#c2410c' : '#1e40af' }}>
                                                {getPerfilLabel(user.tipo_perfil_id)}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-600">
                                            {user.categorias?.nome_categoria || <span className="text-gray-400">—</span>}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>{user.status}</span>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <button onClick={() => openEditModal(user)}
                                                className="p-1.5 rounded-md border border-gray-200 bg-white text-gray-500 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 transition-colors"
                                                title="Editar usuário">
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                        <span className="text-sm text-gray-500">Página {page} de {totalPages}</span>
                        <div className="flex gap-2">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                className="px-3 py-1 text-sm border border-gray-200 rounded-md disabled:opacity-50 hover:bg-gray-50">Anterior</button>
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                                className="px-3 py-1 text-sm border border-gray-200 rounded-md disabled:opacity-50 hover:bg-gray-50">Próxima</button>
                        </div>
                    </div>
                )}
            </Card>

            {/* ===== EDIT USER MODAL (inline) ===== */}
            {editUser && (
                <div
                    onClick={closeEditModal}
                    style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'grid', placeItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: '1rem' }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="w-650px max-w-full rounded-xl shadow-2xl border border-orange-300 flex flex-col"
                        style={{ backgroundColor: '#fff7ed', maxHeight: 'calc(100vh - 2rem)' }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-3 border-b border-orange-200 shrink-0">
                            <h3 className="text-base font-semibold text-orange-800 flex items-center gap-2 truncate">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                Editar: {editUser.nome}
                            </h3>
                            <button onClick={closeEditModal} className="text-orange-400 hover:text-orange-600 transition-colors rounded-md p-1 hover:bg-orange-100 cursor-pointer shrink-0">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4">
                            {editError && (
                                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">{editError}</div>
                            )}
                            <form id="edit-user-form" onSubmit={handleEditSubmit}>
                                {/* Dados Pessoais */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-semibold text-orange-700 uppercase tracking-wider">Dados Pessoais</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="edit-nome">Nome</Label>
                                            <Input id="edit-nome" value={editNome} onChange={(e) => setEditNome(e.target.value)} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="edit-email">E-mail</Label>
                                            <Input id="edit-email" value={editUser.email} disabled className="bg-orange-100 text-gray-500" />
                                            <p className="text-xs text-gray-400">E-mail não pode ser alterado</p>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="edit-whatsapp">WhatsApp</Label>
                                            <Input id="edit-whatsapp" value={editWhatsapp} onChange={(e) => setEditWhatsapp(e.target.value)} placeholder="(83) 99999-9999" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="edit-necessidades">Necessidades Especiais</Label>
                                            <textarea id="edit-necessidades" value={editNecessidades} onChange={(e) => setEditNecessidades(e.target.value)} rows={1}
                                                className="flex w-full rounded-md border border-orange-200 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2"
                                                placeholder="Descreva se houver..." />
                                        </div>
                                    </div>
                                </div>

                                {/* Dados Bancários */}
                                <div className="space-y-3 pt-4 mt-4 border-t border-orange-200">
                                    <h3 className="text-sm font-semibold text-orange-700 uppercase tracking-wider">Dados Bancários</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5"><Label htmlFor="edit-banco">Banco</Label><Input id="edit-banco" value={editBanco} onChange={(e) => setEditBanco(e.target.value)} /></div>
                                        <div className="space-y-1.5"><Label htmlFor="edit-agencia">Agência</Label><Input id="edit-agencia" value={editAgencia} onChange={(e) => setEditAgencia(e.target.value)} /></div>
                                        <div className="space-y-1.5"><Label htmlFor="edit-conta">Conta</Label><Input id="edit-conta" value={editConta} onChange={(e) => setEditConta(e.target.value)} /></div>
                                        <div className="space-y-1.5"><Label htmlFor="edit-pix">PIX</Label><Input id="edit-pix" value={editPix} onChange={(e) => setEditPix(e.target.value)} /></div>
                                    </div>
                                </div>

                                {/* Permissões */}
                                <div className="space-y-3 pt-4 mt-4 border-t border-orange-200">
                                    <h3 className="text-sm font-semibold text-orange-700 uppercase tracking-wider">Permissões</h3>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="edit-perfil">Perfil de Acesso</Label>
                                            <select id="edit-perfil" value={editPerfil} onChange={(e) => setEditPerfil(e.target.value)}
                                                className="flex h-10 w-full rounded-md border border-orange-200 bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2">
                                                <option value="1">Solicitante</option>
                                                <option value="2">Autorizador Rede</option>
                                                <option value="3">Autorizador</option>
                                                <option value="4">Administrador</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="edit-status">Status</Label>
                                            <select id="edit-status" value={editStatus} onChange={(e) => setEditStatus(e.target.value)}
                                                className="flex h-10 w-full rounded-md border border-orange-200 bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2">
                                                <option value="ativo">Ativo</option>
                                                <option value="inativo">Inativo</option>
                                                <option value="bloqueado">Bloqueado</option>
                                                <option value="pendente">Pendente</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="edit-categoria">Categoria</Label>
                                            <select id="edit-categoria" value={editCategoria} onChange={(e) => setEditCategoria(e.target.value)}
                                                className="flex h-10 w-full rounded-md border border-orange-200 bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2">
                                                <option value="">Sem categoria</option>
                                                {categories.map((cat) => (
                                                    <option key={cat.id} value={cat.id}>{cat.nome_categoria}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </form>

                            {/* Redefinir Senha */}
                            <details className="pt-4 mt-4 border-t border-orange-200">
                                <summary className="text-sm font-semibold text-orange-700 cursor-pointer select-none hover:text-orange-800 uppercase tracking-wider">Redefinir Senha</summary>
                                <div className="space-y-3 pt-3">
                                    {resetResult?.tempPassword ? (
                                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg space-y-2">
                                            <p className="text-sm text-yellow-800 font-medium">Nova senha temporária:</p>
                                            <div className="flex items-center gap-2">
                                                <code className="flex-1 px-3 py-2 bg-white border border-yellow-300 rounded text-sm font-mono select-all">{resetResult.tempPassword}</code>
                                                <button type="button" onClick={() => copyToClipboard(resetResult.tempPassword!)}
                                                    className="p-2 rounded hover:bg-yellow-100 text-yellow-700 transition-colors" title="Copiar senha">
                                                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                                                </button>
                                            </div>
                                            <p className="text-xs text-yellow-700">O usuário deverá usar esta senha no próximo login.</p>
                                        </div>
                                    ) : resetResult?.error ? (
                                        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">{resetResult.error}</div>
                                    ) : null}
                                    <Button type="button" variant="outline" onClick={handleResetPassword} disabled={resettingPass}
                                        className="w-full border-red-200 text-red-600 hover:bg-red-50">
                                        {resettingPass ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Redefinindo...</> : 'Redefinir Senha'}
                                    </Button>
                                </div>
                            </details>

                            {/* Testar Login */}
                            <details className="pt-4 mt-4 border-t border-orange-200">
                                <summary className="text-sm font-semibold text-orange-700 cursor-pointer select-none hover:text-orange-800 uppercase tracking-wider">Testar Login</summary>
                                <div className="space-y-3 pt-3">
                                    <p className="text-xs text-gray-500">Digite uma senha para testar a autenticação contra o GoTrue.</p>
                                    <div className="flex gap-2">
                                        <input type="text" value={diagnosticPass} onChange={(e) => setDiagnosticPass(e.target.value)}
                                            placeholder="Senha para teste"
                                            className="flex-1 h-10 rounded-md border border-orange-200 bg-white px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2" />
                                        <Button type="button" variant="outline" onClick={handleDiagnosticTest} disabled={diagnosticLoading || !diagnosticPass}
                                            className="shrink-0">
                                            {diagnosticLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Testar'}
                                        </Button>
                                    </div>
                                    {diagnosticResult && (
                                        <pre className="text-xs bg-orange-100 border border-orange-200 rounded-lg p-3 overflow-auto max-h-40 font-mono whitespace-pre-wrap">{diagnosticResult}</pre>
                                    )}
                                </div>
                            </details>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end gap-3 px-5 py-4 border-t border-orange-200 shrink-0">
                            <Button type="button" variant="outline" onClick={closeEditModal} disabled={savingEdit}>Cancelar</Button>
                            <Button type="submit" form="edit-user-form" disabled={savingEdit}>
                                {savingEdit ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : 'Salvar Alterações'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}