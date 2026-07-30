import { Client, Databases, ID, Query } from 'node-appwrite'

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
    { nome_categoria: 'Secretário(a) Municipal de Saúde', valor_diaria: '520.00' },
    { nome_categoria: 'Técnico(a) da Secretaria de Saúde', valor_diaria: '380.00' },
    { nome_categoria: 'Conselheiro(a) de Saúde', valor_diaria: '320.00' },
    { nome_categoria: 'Motorista', valor_diaria: '250.00' },
    { nome_categoria: 'Acompanhante', valor_diaria: '280.00' },
]

async function main() {
    console.log('=== Seed de Categorias ===\n')

    const { documents } = await databases.listDocuments(DATABASE_ID, 'categorias', [Query.limit(1)])

    if (documents.length > 0) {
        console.log('Categorias já existem. Pulando seed.')
        return
    }

    for (const cat of categorias) {
        await databases.createDocument(DATABASE_ID, 'categorias', ID.unique(), {
            ...cat,
            created_at: new Date().toISOString(),
        })
        console.log(`  Criada: ${cat.nome_categoria} - R$${cat.valor_diaria}`)
    }

    console.log(`\n${categorias.length} categorias criadas com sucesso.`)
}

main().catch(console.error)
