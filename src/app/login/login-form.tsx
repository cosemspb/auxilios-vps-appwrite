'use client'

import { useFormStatus } from 'react-dom'
import { useActionState } from 'react'
import { login, LoginState } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

const initialState: LoginState = {
    error: undefined,
}

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <Button type="submit" className="w-full mt-4" isLoading={pending}>
            Entrar
        </Button>
    )
}

export function LoginForm() {
    const [state, formAction] = useActionState(login, initialState)

    return (
        <Card className="w-full max-w-md mx-auto mt-10 p-8">
            <div className="text-center mb-8 flex flex-col items-center">
                <img src="/logo.png" alt="Logo COSEMS PB" className="h-16 mb-4" />
                <h1 className="text-2xl font-bold text-primary">Gestão de Auxílios</h1>
                <p className="text-gray-500">Faça login para continuar</p>
            </div>

            <form action={formAction} className="space-y-4">
                <Input
                    id="email"
                    name="email"
                    label="E-mail"
                    type="email"
                    placeholder="seu@email.com"
                    required
                />
                <Input
                    id="password"
                    name="password"
                    type="password"
                    label="Senha"
                    required
                />

                {state?.error && (
                    <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                        {state.error}
                    </div>
                )}

                <SubmitButton />
            </form>

            <div className="mt-6 text-center text-sm space-y-3">
                <div>
                    <a href="/forgot-password" className="text-primary hover:underline">
                        Esqueci minha senha
                    </a>
                </div>
            </div>
        </Card>
    )
}
