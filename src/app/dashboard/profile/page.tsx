import { createClient, createAdminClient } from '@/lib/appwrite/server'
import { redirect } from 'next/navigation'
import { ProfileForm } from './profile-form'

export default async function ProfilePage() {
    const { account } = createClient()

    let user
    try {
        user = await account.get()
    } catch {
        redirect('/login')
    }

    if (!user) {
        redirect('/login')
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

    let categories: any[] = []
    try {
        const result = await databases.listDocuments(dbId, 'categorias', [])
        categories = result.documents
    } catch {
        // ignore
    }

    if (!profile) {
        return <div>Erro ao carregar perfil.</div>
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Meu Perfil</h1>
                <p className="text-gray-500">Gerencie suas informações pessoais e bancárias</p>
            </div>

            <ProfileForm user={profile} categories={categories || []} />
        </div>
    )
}
