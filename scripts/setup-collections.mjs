import { Client, Databases, Storage, ID } from 'node-appwrite'

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'http://localhost/v1'
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || ''
const API_KEY = process.env.APPWRITE_API_KEY || ''
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
const storage = new Storage(client)

async function createCollection(id, name, permissions, attributes, indexes) {
    try {
        await databases.createCollection(DATABASE_ID, id, name, permissions, false)
        console.log(`  Coleção "${name}" criada`)

        for (const attr of attributes) {
            try {
                await databases.createStringAttribute(DATABASE_ID, id, attr.key, attr.size || 255, attr.required || false, attr.default || undefined, attr.array || false)
                console.log(`    Atributo: ${attr.key}`)
            } catch (e) {
                console.log(`    Atributo ${attr.key}: ${e.message}`)
            }
        }

        if (indexes) {
            for (const idx of indexes) {
                try {
                    await databases.createIndex(DATABASE_ID, id, idx.key, idx.type || 'key', idx.attributes, idx.orders || [])
                    console.log(`    Índice: ${idx.key}`)
                } catch (e) {
                    console.log(`    Índice ${idx.key}: ${e.message}`)
                }
            }
        }
    } catch (e) {
        console.log(`  Coleção "${name}": ${e.message}`)
    }
}

async function main() {
    console.log(`\n=== Setup Appwrite - Gestão de Auxílios ===\n`)
    console.log(`Endpoint: ${ENDPOINT}`)
    console.log(`Project:  ${PROJECT_ID}`)
    console.log(`Database: ${DATABASE_ID}\n`)

    // Create database
    try {
        await databases.create(DATABASE_ID, 'Gestão de Auxílios', false)
        console.log(`Database "${DATABASE_ID}" criada\n`)
    } catch (e) {
        console.log(`Database: ${e.message}\n`)
    }

    // 1. usuarios
    await createCollection('usuarios', 'Usuários', ['role:member'], [
        { key: 'auth_id', size: 255, required: true },
        { key: 'nome', size: 255, required: true },
        { key: 'email', size: 255, required: true },
        { key: 'cpf', size: 14, required: true },
        { key: 'whatsapp', size: 20, required: false },
        { key: 'tipo_perfil_id', size: 10, required: true },
        { key: 'categoria_id', size: 10, required: false },
        { key: 'status', size: 50, required: true, default: 'pendente' },
        { key: 'banco', size: 100, required: false },
        { key: 'agencia', size: 20, required: false },
        { key: 'conta', size: 20, required: false },
        { key: 'pix', size: 255, required: false },
        { key: 'created_at', size: 50, required: false },
    ], [
        { key: 'idx_auth_id', type: 'key', attributes: ['auth_id'] },
        { key: 'idx_cpf', type: 'unique', attributes: ['cpf'] },
        { key: 'idx_email', type: 'unique', attributes: ['email'] },
        { key: 'idx_status', type: 'key', attributes: ['status'] },
    ])

    // 2. solicitacoes
    await createCollection('solicitacoes', 'Solicitações', ['role:member'], [
        { key: 'protocolo', size: 50, required: true },
        { key: 'situacao', size: 50, required: true },
        { key: 'usuario_cpf', size: 14, required: true },
        { key: 'nome_evento', size: 500, required: true },
        { key: 'local_evento', size: 500, required: true },
        { key: 'data_criacao', size: 50, required: true },
        { key: 'data_partida', size: 50, required: false },
        { key: 'data_retorno', size: 50, required: false },
        { key: 'data_periodo_inicio', size: 50, required: true },
        { key: 'data_periodo_fim', size: 50, required: true },
        { key: 'data_autorizacao', size: 50, required: false },
        { key: 'data_pre_autorizacao', size: 50, required: false },
        { key: 'motivo_recusa', size: 2000, required: false },
        { key: 'valor_a_pagar', size: 20, required: false },
        { key: 'pre_autorizador_cpf', size: 14, required: false },
        { key: 'categoria_id', size: 10, required: false },
        { key: 'distancia_id', size: 10, required: false },
        { key: 'custo_id', size: 10, required: false },
        { key: 'auth_id', size: 255, required: false },
        { key: 'ajuda_custo', size: 20, required: false },
        { key: 'desconto', size: 20, required: false },
        { key: 'locked_by', size: 255, required: false },
        { key: 'locked_at', size: 50, required: false },
        { key: 'data_pagamento', size: 50, required: false },
        { key: 'valor_pago', size: 20, required: false },
        { key: 'assinatura_hash', size: 255, required: false },
        { key: 'created_at', size: 50, required: false },
    ], [
        { key: 'idx_protocolo', type: 'unique', attributes: ['protocolo'] },
        { key: 'idx_situacao', type: 'key', attributes: ['situacao'] },
        { key: 'idx_usuario_cpf', type: 'key', attributes: ['usuario_cpf'] },
        { key: 'idx_auth_id', type: 'key', attributes: ['auth_id'] },
        { key: 'idx_data_criacao', type: 'key', attributes: ['data_criacao'] },
    ])

    // 3. prestacao_contas
    await createCollection('prestacao_contas', 'Prestação de Contas', ['role:member'], [
        { key: 'solicitacao_id', size: 255, required: true },
        { key: 'status', size: 50, required: true },
        { key: 'data_envio', size: 50, required: true },
        { key: 'motivo_recusa', size: 2000, required: false },
        { key: 'data_pagamento', size: 50, required: false },
        { key: 'valor_pago', size: 20, required: false },
        { key: 'created_at', size: 50, required: false },
    ], [
        { key: 'idx_solicitacao_id', type: 'key', attributes: ['solicitacao_id'] },
        { key: 'idx_status', type: 'key', attributes: ['status'] },
    ])

    // 4. prestacao_contas_arquivos
    await createCollection('prestacao_contas_arquivos', 'Arquivos de Prestação', ['role:member'], [
        { key: 'accountability_id', size: 255, required: true },
        { key: 'tipo', size: 50, required: true },
        { key: 'nome_original', size: 500, required: true },
        { key: 'appwrite_file_id', size: 255, required: true },
        { key: 'mime_type', size: 100, required: false },
        { key: 'tamanho', size: 20, required: false },
        { key: 'created_at', size: 50, required: false },
    ], [
        { key: 'idx_accountability_id', type: 'key', attributes: ['accountability_id'] },
    ])

    // 5. categorias
    await createCollection('categorias', 'Categorias', ['role:member'], [
        { key: 'nome_categoria', size: 255, required: true },
        { key: 'valor_diaria', size: 20, required: true },
        { key: 'created_at', size: 50, required: false },
    ], [
        { key: 'idx_nome', type: 'key', attributes: ['nome_categoria'] },
    ])

    // 6. distancias
    await createCollection('distancias', 'Distâncias', ['role:member'], [
        { key: 'origem', size: 255, required: true },
        { key: 'destino', size: 255, required: true },
        { key: 'valor', size: 20, required: true },
        { key: 'created_at', size: 50, required: false },
    ])

    // 7. custos
    await createCollection('custos', 'Custos', ['role:member'], [
        { key: 'descricao', size: 255, required: true },
        { key: 'valor', size: 20, required: true },
        { key: 'categoria_id', size: 10, required: false },
        { key: 'created_at', size: 50, required: false },
    ])

    // 8. deslocamentos
    await createCollection('deslocamentos', 'Deslocamentos', ['role:member'], [
        { key: 'solicitacao_id', size: 255, required: true },
        { key: 'origem', size: 255, required: true },
        { key: 'destino', size: 255, required: true },
        { key: 'data', size: 50, required: true },
        { key: 'created_at', size: 50, required: false },
    ], [
        { key: 'idx_solicitacao_id', type: 'key', attributes: ['solicitacao_id'] },
    ])

    // 9. email_templates
    await createCollection('email_templates', 'Modelos de E-mail', ['role:member'], [
        { key: 'nome', size: 100, required: true },
        { key: 'assunto', size: 500, required: true },
        { key: 'corpo_html', size: 10000, required: true },
        { key: 'ativo', size: 5, required: false, default: 'true' },
        { key: 'created_at', size: 50, required: false },
        { key: 'updated_at', size: 50, required: false },
    ], [
        { key: 'idx_nome', type: 'unique', attributes: ['nome'] },
    ])

    // 10. smtp_config
    await createCollection('smtp_config', 'Configuração SMTP', ['role:member'], [
        { key: 'host', size: 255, required: true },
        { key: 'port', size: 10, required: true },
        { key: 'user', size: 255, required: true },
        { key: 'pass', size: 500, required: true },
        { key: 'from_email', size: 255, required: true },
        { key: 'from_name', size: 255, required: true },
        { key: 'ativo', size: 5, required: false, default: 'false' },
        { key: 'created_at', size: 50, required: false },
        { key: 'updated_at', size: 50, required: false },
    ])

    // 11. configuracoes_sistema
    await createCollection('configuracoes_sistema', 'Configurações do Sistema', ['role:member'], [
        { key: 'chave', size: 100, required: true },
        { key: 'valor', size: 2000, required: true },
        { key: 'created_at', size: 50, required: false },
        { key: 'updated_at', size: 50, required: false },
    ], [
        { key: 'idx_chave', type: 'unique', attributes: ['chave'] },
    ])

    // 12. config_backup
    await createCollection('config_backup', 'Configuração de Backup', ['role:member'], [
        { key: 'horario', size: 10, required: false },
        { key: 'habilitado', size: 5, required: false, default: 'false' },
        { key: 'ultima_execucao', size: 50, required: false },
        { key: 'created_at', size: 50, required: false },
        { key: 'updated_at', size: 50, required: false },
    ])

    // 13. historico_backups
    await createCollection('historico_backups', 'Histórico de Backups', ['role:member'], [
        { key: 'tipo', size: 50, required: true },
        { key: 'status', size: 50, required: true },
        { key: 'arquivo', size: 500, required: false },
        { key: 'tamanho', size: 20, required: false },
        { key: 'erro', size: 2000, required: false },
        { key: 'created_at', size: 50, required: false },
    ], [
        { key: 'idx_created_at', type: 'key', attributes: ['created_at'] },
    ])

    // 14. historico_pagamentos (from report-actions)
    await createCollection('historico_pagamentos', 'Histórico de Pagamentos', ['role:member'], [
        { key: 'solicitacao_id', size: 255, required: true },
        { key: 'usuario_cpf', size: 14, required: true },
        { key: 'valor', size: 20, required: true },
        { key: 'data_pagamento', size: 50, required: true },
        { key: 'created_at', size: 50, required: false },
    ], [
        { key: 'idx_usuario_cpf', type: 'key', attributes: ['usuario_cpf'] },
        { key: 'idx_data_pagamento', type: 'key', attributes: ['data_pagamento'] },
    ])

    // Create storage buckets
    console.log('\n=== Buckets de Storage ===\n')

    for (const [id, name] of [['comprovantes', 'Comprovantes'], ['avatars', 'Avatares']]) {
        try {
            await storage.createBucket(id, name, [
                'role:member'
            ], false, undefined, undefined, ['role:member'])
            console.log(`  Bucket "${name}" (${id}) criado`)
        } catch (e) {
            console.log(`  Bucket "${name}": ${e.message}`)
        }
    }

    console.log('\n=== Setup concluído! ===')
    console.log(`Database ID: ${DATABASE_ID}`)
    console.log('Execute o seed de categorias após criar as coleções.')
}

main().catch(console.error)
