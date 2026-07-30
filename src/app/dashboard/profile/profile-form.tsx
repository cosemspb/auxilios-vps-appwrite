'use client'

import { useActionState, useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { updateProfile, ProfileState, changePassword } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Modal } from '@/components/ui/modal'
import { User, Upload, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { formatDocumento } from '@/lib/format-utils'

interface Category {
    id: number
    nome_categoria: string
}

interface ProfileFormProps {
    user: any
    categories: Category[]
}

const initialState: ProfileState = {
    error: undefined,
    success: undefined,
}

export function ProfileForm({ user, categories }: ProfileFormProps) {
    const router = useRouter()
    const [state, formAction, isPending] = useActionState(updateProfile, initialState)
    const [passwordState, passwordFormAction, passwordPending] = useActionState(changePassword, {})
    const [previewUrl, setPreviewUrl] = useState<string | null>(user.avatar_url)
    const formRef = useRef<HTMLFormElement>(null)

    const [showPasswordModal, setShowPasswordModal] = useState(false)
    const [passwordResult, setPasswordResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

    useEffect(() => {
        if (passwordState?.success) {
            setPasswordResult({ type: 'success', message: passwordState.success })
            setShowPasswordModal(true)
        } else if (passwordState?.error) {
            setPasswordResult({ type: 'error', message: passwordState.error })
            setShowPasswordModal(true)
        }
    }, [passwordState])

    const closePasswordModal = useCallback(() => {
        setShowPasswordModal(false)
        setPasswordResult(null)
    }, [])

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const url = URL.createObjectURL(file)
            setPreviewUrl(url)
        }
    }

    if (state?.success) {
        setTimeout(() => { window.location.href = '/dashboard/profile' }, 3000)
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <Card className="w-full max-w-md mx-4">
                    <CardContent className="pt-6 pb-8 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Perfil Atualizado!</h2>
                        <p className="text-gray-600">Suas informações foram salvas com sucesso.</p>
                        <p className="text-sm text-gray-500 mt-4">Redirecionando em 3 segundos...</p>
                        <a
                            href="/dashboard/profile"
                            className="mt-4 inline-block px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                        >
                            Continuar
                        </a>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-10">
            {/* Header / Avatar Section */}
            <div className="flex flex-col items-center space-y-4">
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100 flex items-center justify-center group">
                    {previewUrl ? (
                        <img src={previewUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <User className="w-16 h-16 text-gray-400" />
                    )}
                    <label htmlFor="avatar" className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white font-medium text-sm">
                        <Upload className="w-4 h-4" />
                        Alterar
                    </label>
                    <input
                        type="file"
                        id="avatar"
                        name="avatar"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                    />
                </div>
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-gray-900">{user.nome}</h2>
                    <p className="text-sm text-gray-500">{user.email}</p>
                </div>
            </div>

            {/* Profile Form */}
            <form ref={formRef} action={formAction} autoComplete="off" data-1p-ignore data-bwignore>
                <div className="space-y-6">
                    {/* Status Messages */}
                    {state?.error && (
                        <div className="p-4 bg-red-50 text-red-700 rounded-md border border-red-200">
                            {state.error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Personal Info */}
                        <Card>
                            <div className="card-header">
                                <h3 className="card-title">Dados Pessoais</h3>
                            </div>
                            <div className="p-6 space-y-4">
                            <Input
                                label="Nome Completo"
                                name="nome"
                                defaultValue={user.nome}
                                required
                            />

                            <Input
                                label="CPF/CNPJ"
                                name="cpf"
                                defaultValue={formatDocumento(user.cpf)}
                                readOnly
                                className="bg-gray-50"
                            />

                            <Input
                                label="E-mail"
                                name="email"
                                defaultValue={user.email}
                                readOnly
                                className="bg-gray-50"
                            />

                            <div className="space-y-2">
                                <label className="label">Categoria</label>
                                <select
                                    name="categoria_id"
                                    defaultValue={user.categoria_id || ''}
                                    className="input"
                                    required
                                >
                                    <option value="" disabled>Selecione uma categoria</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.nome_categoria}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="label">Necessidades Especiais</label>
                                <select
                                    name="necessidades_especiais"
                                    defaultValue={user.necessidades_especiais || 'Não possuo'}
                                    className="input"
                                >
                                    <option value="Não possuo">Não possuo</option>
                                    <option value="Deficiência Visual">Deficiência Visual</option>
                                    <option value="Deficiência Auditiva">Deficiência Auditiva</option>
                                    <option value="Deficiência Física">Deficiência Física</option>
                                    <option value="Deficiência Mental / Intelectual">Deficiência Mental / Intelectual</option>
                                    <option value="Transtorno do Espectro Autista">Transtorno do Espectro Autista</option>
                                    <option value="Deficiência Múltipla">Deficiência Múltipla</option>
                                    <option value="Deficiência Oculta">Deficiência Oculta</option>
                                    <option value="Outras">Outras</option>
                                </select>
                            </div>
                            </div>
                        </Card>

                        {/* Bank Data */}
                        <Card>
                            <div className="card-header">
                                <h3 className="card-title">Dados Bancários</h3>
                            </div>
                            <div className="p-6 space-y-4">
                            <Input
                                label="Banco"
                                name="banco"
                                placeholder="Ex: Banco do Brasil"
                                defaultValue={user.dados_bancarios?.banco}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Agência"
                                    name="agencia"
                                    placeholder="0000-0"
                                    defaultValue={user.dados_bancarios?.agencia}
                                />
                                <Input
                                    label="Conta"
                                    name="conta"
                                    placeholder="00000-0"
                                    defaultValue={user.dados_bancarios?.conta}
                                />
                            </div>

                            <Input
                                label="Chave PIX"
                                name="pix"
                                placeholder="CPF, E-mail ou Telefone"
                                defaultValue={user.dados_bancarios?.pix}
                            />
                            </div>
                        </Card>
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={isPending}>
                            {isPending ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
                            ) : (
                                'Salvar Alterações'
                            )}
                        </Button>
                    </div>
                </div>
            </form>

            {/* Password Change */}
            <Card>
                <div className="card-header">
                    <h3 className="card-title">Alterar Senha</h3>
                </div>
                <div className="p-6">
                    <form action={passwordFormAction} className="space-y-4">
                        <Input
                            label="Senha Atual"
                            name="current_password"
                            type="password"
                            required
                            autoComplete="current-password"
                            data-1p-ignore
                            data-bwignore
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Nova Senha"
                                name="new_password"
                                type="password"
                                required
                                autoComplete="new-password"
                                data-1p-ignore
                                data-bwignore
                            />
                            <Input
                                label="Confirmar Nova Senha"
                                name="confirm_password"
                                type="password"
                                required
                                autoComplete="new-password"
                                data-1p-ignore
                                data-bwignore
                            />
                        </div>
                        <div className="flex justify-end">
                            <Button type="submit" disabled={passwordPending}>
                                {passwordPending ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Alterando...</>
                                ) : (
                                    'Alterar Senha'
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </Card>

            {/* Password Result Modal */}
            <Modal
                isOpen={showPasswordModal}
                onClose={closePasswordModal}
                title={passwordResult?.type === 'success' ? 'Senha Alterada' : 'Erro ao Alterar Senha'}
            >
                <div className="flex flex-col items-center text-center py-4">
                    {passwordResult?.type === 'success' ? (
                        <>
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                            <p className="text-gray-900 font-medium text-lg mb-2">Senha alterada com sucesso!</p>
                            <p className="text-gray-500 text-sm">Sua nova senha já está em vigor.</p>
                        </>
                    ) : (
                        <>
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                <XCircle className="w-8 h-8 text-red-600" />
                            </div>
                            <p className="text-gray-900 font-medium text-lg mb-2">Não foi possível alterar a senha</p>
                            <p className="text-gray-500 text-sm">{passwordResult?.message}</p>
                        </>
                    )}
                    <button
                        onClick={closePasswordModal}
                        className="mt-6 px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                    >
                        {passwordResult?.type === 'success' ? 'Concluído' : 'Tentar Novamente'}
                    </button>
                </div>
            </Modal>
        </div>
    )
}
