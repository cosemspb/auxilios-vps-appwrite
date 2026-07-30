'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { resetDatabase, cleanForLaunch } from './actions'
import { AlertTriangle, Loader2, CheckCircle, AlertCircle, Shield, Sparkles, Trash2 } from 'lucide-react'

type ResetMode = 'clean' | 'full'
type Step = 'choose' | 'confirm' | 'type' | 'running' | 'done'

interface Result {
    success: boolean
    message: string
    error?: string
}

export default function ResetPage() {
    const [mode, setMode] = useState<ResetMode>('clean')
    const [step, setStep] = useState<Step>('choose')
    const [typedText, setTypedText] = useState('')
    const [result, setResult] = useState<Result | null>(null)

    async function handleReset() {
        setStep('running')
        setResult(null)
        const res = mode === 'clean' ? await cleanForLaunch() : await resetDatabase()
        setResult(res)
        setStep('done')
    }

    function handleChoose(m: ResetMode) {
        setMode(m)
        setStep('confirm')
    }

    function handleBack() {
        setStep('choose')
        setTypedText('')
        setResult(null)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gerenciar Banco de Dados</h1>
                    <p className="text-gray-500">Operações destrutivas — use com extrema cautela</p>
                </div>
            </div>

            {step === 'choose' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="p-8 cursor-pointer transition-all hover:shadow-md border-2 border-transparent hover:border-orange-300"
                        onClick={() => handleChoose('clean')}
                    >
                        <div className="text-center space-y-4">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-orange-50">
                                <Sparkles className="w-10 h-10 text-orange-500" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Limpar para Lançamento</h2>
                                <p className="text-gray-500 text-sm mt-1">
                                    Remove dados transacionais e mantém os usuários já convidados.
                                </p>
                            </div>
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left text-sm">
                                <p className="font-medium text-green-800 mb-2">Preserva:</p>
                                <ul className="list-disc ml-5 space-y-1 text-green-700">
                                    <li>Todos os usuários convidados</li>
                                    <li>Perfis, categorias e distâncias</li>
                                    <li>Configurações SMTP e templates de e-mail</li>
                                    <li>Fotos de perfil (bucket avatars)</li>
                                </ul>
                            </div>
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left text-sm">
                                <p className="font-medium text-red-800 mb-2">Remove:</p>
                                <ul className="list-disc ml-5 space-y-1 text-red-700">
                                    <li>Todas as solicitações</li>
                                    <li>Prestações de contas e arquivos (bucket comprovantes)</li>
                                    <li>Custos, deslocamentos</li>
                                    <li>Histórico de e-mails e backups</li>
                                </ul>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-8 cursor-pointer transition-all hover:shadow-md border-2 border-transparent hover:border-red-300"
                        onClick={() => handleChoose('full')}
                    >
                        <div className="text-center space-y-4">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-50">
                                <Trash2 className="w-10 h-10 text-red-500" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Reset Completo</h2>
                                <p className="text-gray-500 text-sm mt-1">
                                    Remove TUDO e recria o banco do zero com dados seed.
                                </p>
                            </div>
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left text-sm">
                                <p className="font-medium text-red-800 mb-2">Remove:</p>
                                <ul className="list-disc ml-5 space-y-1 text-red-700">
                                    <li>Todas as 15 tabelas do schema público</li>
                                    <li>Todos os usuários (inclusive convidados)</li>
                                    <li>Todas as solicitações e prestações</li>
                                    <li>Configurações e templates</li>
                                </ul>
                            </div>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left text-sm">
                                <p className="font-medium text-blue-800 mb-2">Recria automaticamente:</p>
                                <ul className="list-disc ml-5 space-y-1 text-blue-700">
                                    <li>Estrutura das tabelas</li>
                                    <li>Dados seed (perfis, categorias, distâncias)</li>
                                    <li>Usuário admin (suporte@cosemspb.org)</li>
                                    <li>Templates de e-mail e configurações</li>
                                </ul>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {step === 'confirm' && (
                <Card className="p-8">
                    <div className="text-center space-y-6">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-50">
                            <AlertTriangle className="w-10 h-10 text-red-500" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Você tem certeza?</h2>
                            <p className="text-gray-500 max-w-lg mx-auto">
                                {mode === 'clean'
                                    ? 'Esta ação irá remover todos os dados transacionais do sistema, mantendo os usuários já cadastrados e as configurações.'
                                    : 'Esta ação irá apagar TODOS os dados do banco de dados e recriar as tabelas do zero. Os dados seed serão re-inseridos, mas todas as solicitações, prestações de contas e usuários serão perdidos.'
                                }
                            </p>
                        </div>
                        <div className="flex gap-3 justify-center">
                            <Button
                                variant="outline"
                                onClick={handleBack}
                            >
                                Voltar
                            </Button>
                            <button
                                onClick={() => setStep('type')}
                                className="px-8 py-2 rounded-lg font-semibold text-black"
                                style={{ backgroundColor: '#f97316', color: 'black' }}
                            >
                                <Shield className="w-4 h-4 mr-2 inline" />
                                {mode === 'clean' ? 'Sim, quero limpar o banco' : 'Sim, quero resetar o banco'}
                            </button>
                        </div>
                    </div>
                </Card>
            )}

            {step === 'type' && (
                <Card className="p-8">
                    <div className="text-center space-y-6">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-50">
                            <AlertTriangle className="w-10 h-10 text-red-500" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Confirmação final</h2>
                            <p className="text-gray-500 max-w-lg mx-auto">
                                Digite <strong className="text-red-600">RESETAR</strong> abaixo para confirmar a
                                operação de <strong>{mode === 'clean' ? 'limpeza' : 'reset completo'}</strong>.
                            </p>
                        </div>
                        <div className="max-w-xs mx-auto">
                            <Input
                                value={typedText}
                                onChange={(e) => setTypedText(e.target.value)}
                                placeholder="Digite RESETAR"
                                className="text-center text-lg h-12"
                            />
                        </div>
                        <div className="flex gap-3 justify-center">
                            <Button
                                variant="outline"
                                onClick={() => { setStep('confirm'); setTypedText('') }}
                            >
                                Cancelar
                            </Button>
                            <button
                                disabled={typedText !== 'RESETAR'}
                                onClick={handleReset}
                                className="px-8 py-2 rounded-lg font-semibold text-black disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ backgroundColor: typedText === 'RESETAR' ? '#f97316' : '#f97316', color: 'black' }}
                            >
                                <AlertTriangle className="w-4 h-4 mr-2 inline" />
                                {mode === 'clean' ? 'Limpar Banco' : 'Resetar Banco'}
                            </button>
                        </div>
                    </div>
                </Card>
            )}

            {step === 'running' && (
                <Card className="p-8">
                    <div className="text-center py-12">
                        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-gray-600 text-lg">
                            {mode === 'clean' ? 'Limpando banco de dados...' : 'Resetando banco de dados...'}
                        </p>
                        <p className="text-gray-400 text-sm mt-2">Isso pode levar alguns segundos</p>
                    </div>
                </Card>
            )}

            {step === 'done' && result && (
                <Card className="p-8">
                    <div className="text-center space-y-6">
                        <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${
                            result.success ? 'bg-green-50' : 'bg-red-50'
                        }`}>
                            {result.success ? (
                                <CheckCircle className="w-10 h-10 text-green-500" />
                            ) : (
                                <AlertCircle className="w-10 h-10 text-red-500" />
                            )}
                        </div>
                        <div>
                            <h2 className={`text-2xl font-bold mb-2 ${
                                result.success ? 'text-green-700' : 'text-red-700'
                            }`}>
                                {result.success ? 'Operação concluída!' : 'Erro'}
                            </h2>
                            <p className="text-gray-600 max-w-lg mx-auto">{result.message}</p>
                            {result.error && (
                                <p className="text-sm text-red-500 mt-2 font-mono bg-red-50 p-3 rounded">
                                    {result.error}
                                </p>
                            )}
                        </div>
                        <Button onClick={handleBack}>
                            Ok
                        </Button>
                    </div>
                </Card>
            )}
        </div>
    )
}
