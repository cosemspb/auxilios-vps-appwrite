import { createClient, createAdminClient } from '@/lib/appwrite/server'
import { RequestForm } from './request-form'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function NewRequestPage() {
    const { account } = createClient()

    let user
    try {
        user = await account.get()
    } catch {
        return <div>Usuário não autenticado</div>
    }

    if (!user) {
        return <div>Usuário não autenticado</div>
    }

    const { databases } = createAdminClient()
    const dbId = process.env.APPWRITE_DATABASE_ID!

    let profile: any = null
    try {
        const { documents } = await databases.listDocuments(dbId, 'usuarios', [])
        profile = documents.find(d => d.auth_id === user.$id) || null
    } catch {
        // ignore
    }

    const hasBankDetails = profile?.dados_bancarios?.banco &&
        profile?.dados_bancarios?.agencia &&
        profile?.dados_bancarios?.conta

    const hasPix = !!profile?.dados_bancarios?.pix
    const isProfileComplete = profile?.categoria_id && (hasBankDetails || hasPix)

    let distancias: any[] = []
    try {
        const result = await databases.listDocuments(dbId, 'distancias', [])
        distancias = result.documents
    } catch {
        // ignore
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Nova Solicitação</h1>
                <p className="text-gray-500">Crie uma nova solicitação de auxílio</p>
            </div>

            {!isProfileComplete ? (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-yellow-700">
                                Para criar uma solicitação, é necessário completar seu cadastro com <strong>Categoria</strong> e <strong>Dados Bancários</strong>.
                            </p>
                            <p className="mt-2 text-sm">
                                <Link href="/dashboard/profile" className="font-medium text-yellow-700 underline hover:text-yellow-600">
                                    Ir para meu perfil e completar cadastro
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <RequestForm distancias={distancias || []} />
            )}

            <div className="mt-6">
                <Link href="/dashboard" className="btn btn-outline inline-flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Voltar para painel
                </Link>
            </div>
        </div>
    )
}
