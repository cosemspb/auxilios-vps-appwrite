'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/appwrite/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2, Lock, CheckCircle, AlertCircle } from 'lucide-react'
import { updatePassword, hasValidSession } from '@/app/actions/auth-actions'

export default function UpdatePasswordContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isCheckingSession, setIsCheckingSession] = useState(true)
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

    useEffect(() => {
        const checkSession = async () => {
            // Check for Appwrite recovery params (from auth callback)
            const userId = searchParams.get('userId')
            const secret = searchParams.get('secret')

            if (userId && secret) {
                // We have recovery params - user can update their password
                // Appwrite's updateRecovery flow will be handled on form submit
                setIsCheckingSession(false)
                return
            }

            // Otherwise, check if there's already a session (server-side)
            const valid = await hasValidSession()
            if (valid) {
                setIsCheckingSession(false)
            } else {
                setResult({
                    success: false,
                    message: 'Sessão inválida ou expirada. Por favor, solicite um novo link de recuperação.'
                })
                setIsCheckingSession(false)
            }
        }

        checkSession()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (password !== confirmPassword) {
            setResult({ success: false, message: 'As senhas não coincidem.' })
            return
        }

        if (password.length < 6) {
            setResult({ success: false, message: 'A senha deve ter pelo menos 6 caracteres.' })
            return
        }

        setIsLoading(true)
        setResult(null)

        try {
            const userId = searchParams.get('userId')
            const secret = searchParams.get('secret')

            if (userId && secret) {
                // Complete Appwrite recovery flow
                const { account } = createClient()
                await account.updateRecovery(userId, secret, password)
            } else {
                // Direct update via server action
                const response = await updatePassword(password)
                setResult(response)

                if (response.success) {
                    setTimeout(() => router.push('/dashboard'), 2000)
                }
                setIsLoading(false)
                return
            }

            setResult({ success: true, message: 'Senha atualizada com sucesso!' })
            setTimeout(() => router.push('/dashboard'), 2000)
        } catch (error) {
            setResult({
                success: false,
                message: 'Erro ao atualizar senha. O link pode ter expirado.'
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md p-8 space-y-6 bg-white shadow-xl rounded-xl border-gray-100">
                {isCheckingSession ? (
                    <div className="text-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-gray-600">Verificando sessão...</p>
                    </div>
                ) : (
                    <>
                        <div className="text-center space-y-2">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
                                <Lock className="w-6 h-6 text-primary" />
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900">Nova Senha</h1>
                            <p className="text-sm text-gray-500">
                                Defina sua nova senha de acesso.
                            </p>
                        </div>

                        {result && (
                            <Alert variant={result.success ? 'default' : 'destructive'} className={result.success ? 'bg-green-50 text-green-900 border-green-200' : ''}>
                                {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                                <AlertTitle>{result.success ? 'Sucesso' : 'Erro'}</AlertTitle>
                                <AlertDescription>{result.message}</AlertDescription>
                            </Alert>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="password">Nova Senha</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="h-11"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="h-11"
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-11 text-base"
                                disabled={isLoading || (result?.success ?? false)}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Atualizando...
                                    </>
                                ) : (
                                    'Atualizar Senha'
                                )}
                            </Button>
                        </form>
                    </>
                )}
            </Card>
        </div>
    )
}
