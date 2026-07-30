import { Client, Account, Databases, Storage } from 'appwrite'

let clientInstance: Client | null = null

export function createClient() {
    if (typeof window === 'undefined') {
        throw new Error('appwrite client-side SDK cannot be used in server context')
    }
    if (!clientInstance) {
        clientInstance = new Client()
            .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
            .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    }
    return {
        client: clientInstance,
        account: new Account(clientInstance),
        databases: new Databases(clientInstance),
        storage: new Storage(clientInstance),
    }
}
