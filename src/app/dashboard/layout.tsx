import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/appwrite/server'
import { Sidebar } from '@/components/dashboard/sidebar'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { account } = await createClient()

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
    let profile: any = null
    try {
        const { documents } = await databases.listDocuments(
            process.env.APPWRITE_DATABASE_ID!,
            'usuarios',
            []
        )
        profile = documents.find(d => d.auth_id === user.$id) || null
    } catch (e) {
        console.error('Error fetching profile:', e)
    }

    if (profile?.status === 'pendente') {
        redirect('/completar-cadastro')
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar
                user={profile || user}
                userRole={profile?.tipo_perfil_id || 1}
            />
            <main id="main-content" style={{ padding: '60px 1rem 2rem 1rem' }}>
                {children}
            </main>
        </div>
    )
}
