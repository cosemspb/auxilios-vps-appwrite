'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { completeRegistration, CompleteRegistrationState } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

interface Category {
    id: number
    nome_categoria: string
}

const initialState: CompleteRegistrationState = {
    error: undefined,
    success: undefined,
}

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <Button type="submit" className="w-full mt-4" isLoading={pending}>
            Completar Cadastro
        </Button>
    )
}

function maskCpf(value: string) {
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 11) {
        return digits
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1')
    }
    return digits
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1')
}

function maskWhatsapp(value: string) {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{4})\d+?$/, '$1')
}

export function CompletarCadastroForm({ categories }: { categories: Category[] }) {
    const router = useRouter()
    const [state, formAction] = useActionState(completeRegistration, initialState)
    const [cpf, setCpf] = useState('')
    const [whatsapp, setWhatsapp] = useState('')
    const [categoriaId, setCategoriaId] = useState('')
    const [banco, setBanco] = useState('')
    const [agencia, setAgencia] = useState('')
    const [conta, setConta] = useState('')
    const [pix, setPix] = useState('')

    if (state?.success) {
        setTimeout(() => router.push('/dashboard'), 2000)
        return (
            <Card className="w-full mx-auto mt-10 p-8 text-center" style={{ maxWidth: 500 }}>
                <div className="p-4 bg-green-50 text-green-700 rounded-md">
                    <h2 className="text-xl font-bold mb-2">Cadastro Completo!</h2>
                    <p>{state.success}</p>
                    <p className="text-sm mt-2">Redirecionando para o painel...</p>
                </div>
            </Card>
        )
    }

    return (
        <Card className="w-full mx-auto mt-10 p-8" style={{ maxWidth: 900 }}>
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-primary">Completar Cadastro</h1>
                <p className="text-gray-500">Preencha seus dados para começar a usar o sistema</p>
            </div>

            <form action={formAction} className="space-y-4">
                <h3 className="font-semibold text-gray-900 border-b pb-1">Dados Pessoais</h3>

                <Input
                    id="cpf"
                    name="cpf"
                    label="CPF/CNPJ"
                    required
                    maxLength={18}
                    value={cpf}
                    onChange={(e) => setCpf(maskCpf(e.target.value))}
                />
                <Input
                    id="whatsapp"
                    name="whatsapp"
                    label="WhatsApp"
                    placeholder="(83) 99999-8888"
                    required
                    maxLength={15}
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(maskWhatsapp(e.target.value))}
                />
                <Input
                    id="password"
                    name="password"
                    type="password"
                    label="Nova Senha"
                    required
                    minLength={6}
                />
                <Input
                    id="passwordConfirm"
                    name="passwordConfirm"
                    type="password"
                    label="Confirmar Senha"
                    required
                    minLength={6}
                />

                <div className="space-y-2">
                    <label className="label">Categoria</label>
                    <select name="categoria_id" className="input" required value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}>
                        <option value="">Selecione uma categoria</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.nome_categoria}</option>
                        ))}
                    </select>
                </div>

                <h3 className="font-semibold text-gray-900 border-b pb-1 pt-2">Dados Bancários</h3>
                <p className="text-sm text-gray-500">Preencha pelo menos os dados bancários ou a chave PIX.</p>

                <Input
                    id="banco"
                    name="banco"
                    label="Banco"
                    placeholder="Ex: Banco do Brasil"
                    value={banco}
                    onChange={(e) => setBanco(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        id="agencia"
                        name="agencia"
                        label="Agência"
                        placeholder="0000-0"
                        value={agencia}
                        onChange={(e) => setAgencia(e.target.value)}
                    />
                    <Input
                        id="conta"
                        name="conta"
                        label="Conta"
                        placeholder="00000-0"
                        value={conta}
                        onChange={(e) => setConta(e.target.value)}
                    />
                </div>
                <Input
                    id="pix"
                    name="pix"
                    label="Chave PIX"
                    placeholder="CPF, E-mail ou Telefone"
                    value={pix}
                    onChange={(e) => setPix(e.target.value)}
                />

                {state?.error && (
                    <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                        {state.error}
                    </div>
                )}

                <SubmitButton />
            </form>
        </Card>
    )
}
