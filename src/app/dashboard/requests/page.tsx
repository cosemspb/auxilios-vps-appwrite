import { createClient } from '@/lib/appwrite/server'
import { Query } from 'node-appwrite'
import { RequestsList } from '@/components/dashboard/requests-list'

export default async function RequestsPage() {
    const { account, databases } = await createClient()

    try {
        const user = await account.get()

        const { documents } = await databases.listDocuments(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            'usuarios',
            []
        )
        const profile = documents.find(d => d.auth_id === user.$id)
        if (!profile?.cpf) return <RequestsList requests={[]} />

        const { documents: requests } = await databases.listDocuments(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            'solicitacoes',
            [Query.equal('usuario_cpf', profile.cpf)]
        )

        return <RequestsList requests={requests} />
    } catch (err) {
        console.error('Error fetching requests:', err)
        return <RequestsList requests={[]} />
    }
}
