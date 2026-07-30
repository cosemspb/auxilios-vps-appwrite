'use client'

import { useFormStatus } from 'react-dom'
import { useActionState } from 'react'
import { recoverPassword, State } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

const initialState: State = {
    error: undefined,
    success: undefined,
}

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <Button type="submit" className="w-full mt-4" isLoading={pending}>
            Enviar Link de Recuperação
        </Button>
    )
}

export function RecoverPasswordForm() {
    const [state, formAction] = useActionState(recoverPassword, initialState)

    return (
        <Card className="w-full max-w-md mx-auto mt-10 p-8">
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-primary">Recuperar Senha</h1>
                <p className="text-gray-500">Informe seu CPF para receber o link de redefinição</p>
            </div>

            {state?.success ? (
                <div className="p-4 bg-green-50 text-green-700 rounded-md text-center">
                    {state.success}
                    <div className="mt-4">
                        <a href="/login" className="text-primary hover:underline font-medium">
                            Voltar para o Login
                        </a>
                    </div>
                </div>
            ) : (
                <form action={formAction} className="space-y-4">
                    <Input
                        id="cpf"
                        name="cpf"
                        label="CPF/CNPJ"
                        placeholder="000.000.000-00"
                        required
                        maxLength={18}
                        onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, '')
                            if (digits.length <= 11) {
                                e.target.value = digits
                                    .replace(/(\d{3})(\d)/, '$1.$2')
                                    .replace(/(\d{3})(\d)/, '$1.$2')
                                    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
                                    .replace(/(-\d{2})\d+?$/, '$1')
                            } else {
                                e.target.value = digits
                                    .replace(/(\d{2})(\d)/, '$1.$2')
                                    .replace(/(\d{3})(\d)/, '$1.$2')
                                    .replace(/(\d{3})(\d)/, '$1/$2')
                                    .replace(/(\d{4})(\d{1,2})/, '$1-$2')
                                    .replace(/(-\d{2})\d+?$/, '$1')
                            }
                        }}
                    />

                    {state?.error && (
                        <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                            {state.error}
                        </div>
                    )}

                    <SubmitButton />

                    <div className="mt-4 text-center">
                        <a href="/login" className="text-sm text-gray-500 hover:text-primary">
                            Voltar
                        </a>
                    </div>
                </form>
            )}
        </Card>
    )
}
