import { Client, Databases, Query } from 'node-appwrite'

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

const categorias = [
    { id: '1', nome_categoria: 'Secretário(a) Municipal de Saúde', valor_diaria: '520.00' },
    { id: '2', nome_categoria: 'Técnico(a) da Secretaria de Saúde', valor_diaria: '380.00' },
    { id: '3', nome_categoria: 'Conselheiro(a) de Saúde', valor_diaria: '320.00' },
    { id: '4', nome_categoria: 'Motorista', valor_diaria: '250.00' },
    { id: '5', nome_categoria: 'Acompanhante', valor_diaria: '280.00' },
]

async function main() {
    console.log('=== Seed de Categorias ===\n')

    const { documents } = await databases.listDocuments(DATABASE_ID, 'categorias', [Query.limit(1)])

    if (documents.length > 0) {
        console.log('Categorias já existem. Pulando seed.')
        return
    }

    for (const cat of categorias) {
        await databases.createDocument(DATABASE_ID, 'categorias', cat.id, {
            nome_categoria: cat.nome_categoria,
            valor_diaria: cat.valor_diaria,
            created_at: new Date().toISOString(),
        })
        console.log(`  Criada: [${cat.id}] ${cat.nome_categoria} - R$${cat.valor_diaria}`)
    }

    console.log(`\n${categorias.length} categorias criadas com IDs determinísticos 1..5.`)
}

main().catch(console.error)
