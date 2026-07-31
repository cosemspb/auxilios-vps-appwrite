import 'server-only'
import { cookies } from 'next/headers'
import { Client, Account, Users, Databases, Storage, Query } from 'node-appwrite'
import { SESSION_COOKIE_NAME } from '@/lib/appwrite/session-cookie'

let adminClientInstance: Client | null = null

export async function createClient() {
    const client = new Client()
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)

    try {
        const cookieStore = await cookies()
        const session = cookieStore.get(SESSION_COOKIE_NAME)?.value
        if (session) client.setSession(session)
    } catch {
        // cookies() unavailable (e.g., non-request context) — no session
    }

    return {
        client,
        account: new Account(client),
        databases: new Databases(client),
        storage: new Storage(client),
        Query,
    }
}

export function createAdminClient() {
    if (!adminClientInstance) {
        adminClientInstance = new Client()
            .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
            .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
            .setKey(process.env.APPWRITE_API_KEY!)
    }
    return {
        client: adminClientInstance,
        account: new Account(adminClientInstance),
        users: new Users(adminClientInstance),
        databases: new Databases(adminClientInstance),
        storage: new Storage(adminClientInstance),
        Query,
    }
}

export { Query, SESSION_COOKIE_NAME }
