'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2, Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'
import { requestPasswordReset } from '@/app/actions/auth-actions'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setResult(null)

        try {
            const response = await requestPasswordReset(email)
            setResult(response)
        } catch (error) {
            setResult({
                success: false,
                message: 'Ocorreu um erro inesperado. Tente novamente.'
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md p-8 space-y-6 bg-white shadow-xl rounded-xl border-gray-100">
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
                        <Mail className="w-6 h-6 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Recuperar Senha</h1>
                    <p className="text-sm text-gray-500">
                        Digite seu e-mail para receber um link de redefinição.
                    </p>
                </div>

                {result && (
                    <Alert variant={result.success ? 'default' : 'destructive'} className={result.success ? 'bg-green-50 text-green-900 border-green-200' : ''}>
                        {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                        <AlertTitle>{result.success ? 'E-mail Enviado' : 'Erro'}</AlertTitle>
                        <AlertDescription>{result.message}</AlertDescription>
                    </Alert>
                )}

                {!result?.success && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">E-mail</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="h-11"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-11 text-base"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Enviando...
                                </>
                            ) : (
                                'Enviar Link de Recuperação'
                            )}
                        </Button>
                    </form>
                )}

                <div className="text-center pt-2">
                    <Link
                        href="/login"
                        className="inline-flex items-center text-sm text-gray-600 hover:text-primary transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Voltar para o Login
                    </Link>
                </div>
            </Card>
        </div>
    )
}
