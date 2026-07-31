import { createClient } from '@/lib/appwrite/server'
import { redirect } from 'next/navigation'
import { Query } from 'node-appwrite'
import { CompletarCadastroForm } from './form'

export default async function CompletarCadastroPage() {
    const { account, databases } = await createClient()

    let user
    try {
        user = await account.get()
    } catch {
        redirect('/login')
    }

    // Check user status from prefs
    const prefs = user.prefs || {}
    if (prefs.status !== 'pendente') {
        redirect('/dashboard')
    }

    // Fetch categories
    let categories: { id: number; nome_categoria: string }[] = []
    try {
        const { documents } = await databases.listDocuments(
            process.env.APPWRITE_DATABASE_ID!,
            'categorias',
            [Query.orderAsc('nome_categoria')]
        )
        categories = documents.map((doc: any) => ({
            id: doc.id || doc.$id,
            nome_categoria: doc.nome_categoria,
        }))
    } catch (err) {
        console.error('Error fetching categories:', err)
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <CompletarCadastroForm categories={categories || []} />
        </div>
    )
}
