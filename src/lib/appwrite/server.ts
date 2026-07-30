import 'server-only'
import { Client, Account, Users, Databases, Storage, Query } from 'node-appwrite'

let adminClientInstance: Client | null = null
let userClientInstance: Client | null = null

export function createClient() {
    if (!userClientInstance) {
        userClientInstance = new Client()
            .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
            .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    }
    return {
        client: userClientInstance,
        account: new Account(userClientInstance),
        databases: new Databases(userClientInstance),
        storage: new Storage(userClientInstance),
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

export { Query }
