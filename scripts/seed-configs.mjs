import { Client, Databases } from 'node-appwrite'

try {
    process.loadEnvFile('.env.local')
} catch {
    console.log('Aviso: .env.local não encontrado — usando variáveis de ambiente existentes.')
}

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID
const API_KEY = process.env.APPWRITE_API_KEY
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'auxilios'

if (!API_KEY) {
    console.error('APPWRITE_API_KEY não definida')
    process.exit(1)
}

const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY)

const databases = new Databases(client)

async function main() {
    console.log('=== Seed de Configurações ===\n')

    try {
        await databases.createDocument(DATABASE_ID, 'configuracoes_sistema', '1', {
            fonte_padrao: 'Arial',
            updated_at: new Date().toISOString(),
        })
        console.log('  configuracoes_sistema doc "1" criado (fonte_padrao: Arial)')
    } catch (e) {
        console.log(`  configuracoes_sistema: ${e.message}`)
    }

    try {
        await databases.createDocument(DATABASE_ID, 'config_backup', '1', {
            horario: '03:00',
            habilitado: false,
            ultima_execucao: null,
            updated_at: new Date().toISOString(),
        })
        console.log('  config_backup doc "1" criado (horario 03:00, desabilitado)')
    } catch (e) {
        console.log(`  config_backup: ${e.message}`)
    }

    console.log('\n=== Seed concluído! ===')
}

main().catch(console.error)
