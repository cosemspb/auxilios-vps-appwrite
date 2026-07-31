import { Client, Databases, Storage, Permission } from 'node-appwrite'

try {
    process.loadEnvFile('.env.local')
} catch {
    console.log('Aviso: .env.local não encontrado — usando variáveis de ambiente existentes.')
}

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

const READ_WRITE = [Permission.read('users'), Permission.write('users')]

async function createAttributes(collectionId, attributes) {
    for (const attr of attributes) {
        try {
            const required = !!attr.required
            const type = attr.type || 'string'

            if (type === 'integer') {
                await databases.createIntegerAttribute(
                    DATABASE_ID, collectionId, attr.key, required,
                    undefined, undefined, attr.default ?? null, false
                )
            } else if (type === 'boolean') {
                await databases.createBooleanAttribute(
                    DATABASE_ID, collectionId, attr.key, required,
                    attr.default ?? null, false
                )
            } else {
                await databases.createStringAttribute(
                    DATABASE_ID, collectionId, attr.key, attr.size || 255,
                    required, attr.default ?? undefined, attr.array || false
                )
            }
            console.log(`    Atributo: ${attr.key} (${type})${required ? ' [req]' : ''}`)
        } catch (e) {
            console.log(`    Atributo ${attr.key}: ${e.message}`)
        }
    }
}

async function createIndexes(collectionId, indexes) {
    if (!indexes) return
    for (const idx of indexes) {
        try {
            await databases.createIndex(
                DATABASE_ID, collectionId, idx.key, idx.type || 'key',
                idx.attributes, idx.orders || []
            )
            console.log(`    Índice: ${idx.key}`)
        } catch (e) {
            console.log(`    Índice ${idx.key}: ${e.message}`)
        }
    }
}

async function createCollection(id, name, attributes, indexes) {
    try {
        await databases.createCollection(DATABASE_ID, id, name, READ_WRITE, false)
        console.log(`  Coleção "${name}" (${id}) criada`)
    } catch (e) {
        if (!e.message.includes('already exists')) {
            console.log(`  Coleção "${name}": ${e.message}`)
            return
        }
        console.log(`  Coleção "${name}" já existe — sincronizando atributos/índices`)
    }
    await createAttributes(id, attributes)
    await createIndexes(id, indexes)
}

async function main() {
    console.log(`\n=== Setup Appwrite - Gestão de Auxílios ===\n`)
    console.log(`Endpoint: ${ENDPOINT}`)
    console.log(`Project:  ${PROJECT_ID}`)
    console.log(`Database: ${DATABASE_ID}\n`)

    try {
        await databases.create(DATABASE_ID, 'Gestão de Auxílios', false)
        console.log(`Database "${DATABASE_ID}" criada\n`)
    } catch (e) {
        console.log(`Database: ${e.message}\n`)
    }

    // 1. perfis (legado — só backup/limpeza)
    await createCollection('perfis', 'Perfis', [
        { key: 'nome', size: 100, required: true },
        { key: 'created_at', size: 50, required: false },
    ])

    // 2. categorias (doc ids determinísticos '1'..'5' via seed)
    await createCollection('categorias', 'Categorias', [
        { key: 'nome_categoria', size: 255, required: true },
        { key: 'valor_diaria', size: 20, required: true },
        { key: 'created_at', size: 50, required: false },
    ], [
        { key: 'idx_nome', type: 'key', attributes: ['nome_categoria'] },
    ])

    // 3. usuarios
    await createCollection('usuarios', 'Usuários', [
        { key: 'auth_id', size: 255, required: true },
        { key: 'nome', size: 255, required: true },
        { key: 'email', size: 255, required: true },
        { key: 'cpf', size: 14, required: true },
        { key: 'whatsapp', size: 20, required: false },
        { key: 'tipo_perfil_id', type: 'integer', required: true },
        { key: 'categoria_id', type: 'integer', required: false },
        { key: 'status', size: 50, required: false, default: 'pendente' },
        { key: 'banco', size: 100, required: false },
        { key: 'agencia', size: 20, required: false },
        { key: 'conta', size: 20, required: false },
        { key: 'pix', size: 255, required: false },
        { key: 'dados_bancarios', size: 2000, required: false },
        { key: 'necessidades_especiais', size: 1000, required: false },
        { key: 'avatar_url', size: 1000, required: false },
        { key: 'created_at', size: 50, required: false },
    ], [
        { key: 'idx_auth_id', type: 'key', attributes: ['auth_id'] },
        { key: 'idx_cpf', type: 'unique', attributes: ['cpf'] },
        { key: 'idx_email', type: 'unique', attributes: ['email'] },
        { key: 'idx_status', type: 'key', attributes: ['status'] },
        { key: 'idx_tipo_perfil_id', type: 'key', attributes: ['tipo_perfil_id'] },
    ])

    // 4. distancias (doc ids determinísticos via seed)
    await createCollection('distancias', 'Distâncias', [
        { key: 'origem', size: 255, required: true },
        { key: 'destino', size: 255, required: true },
        { key: 'valor', size: 20, required: true },
        { key: 'created_at', size: 50, required: false },
    ])

    // 5. configuracoes_sistema (doc id '1')
    await createCollection('configuracoes_sistema', 'Configurações do Sistema', [
        { key: 'fonte_padrao', size: 500, required: false },
        { key: 'updated_at', size: 50, required: false },
    ])

    // 6. email_templates
    await createCollection('email_templates', 'Modelos de E-mail', [
        { key: 'nome', size: 100, required: true },
        { key: 'assunto', size: 500, required: true },
        { key: 'corpo_html', size: 10000, required: true },
        { key: 'ativo', size: 5, required: false, default: 'true' },
        { key: 'created_at', size: 50, required: false },
        { key: 'updated_at', size: 50, required: false },
    ], [
        { key: 'idx_nome', type: 'unique', attributes: ['nome'] },
    ])

    // 7. configuracoes_smtp (era smtp_config)
    await createCollection('configuracoes_smtp', 'Configuração SMTP', [
        { key: 'smtp_host', size: 255, required: true },
        { key: 'smtp_port', type: 'integer', required: true },
        { key: 'smtp_user', size: 255, required: true },
        { key: 'smtp_password', size: 2000, required: true },
        { key: 'smtp_from_email', size: 255, required: true },
        { key: 'smtp_from_name', size: 255, required: true },
        { key: 'smtp_secure', type: 'boolean', required: true },
        { key: 'emails_notificacao_novos_pedidos', size: 2000, required: false },
        { key: 'emails_notificacao_rede', size: 2000, required: false },
        { key: 'test_email_config', size: 2000, required: false },
        { key: 'ativo', type: 'boolean', required: false, default: false },
        { key: 'data_atualizacao', size: 50, required: false },
    ])

    // 8. solicitacoes
    await createCollection('solicitacoes', 'Solicitações', [
        { key: 'protocolo', size: 50, required: true },
        { key: 'situacao', size: 50, required: true },
        { key: 'usuario_cpf', size: 14, required: true },
        { key: 'tipo_evento', size: 255, required: false },
        { key: 'nome_evento', size: 500, required: true },
        { key: 'local_evento', size: 500, required: true },
        { key: 'instituicao_executora', size: 500, required: false },
        { key: 'data_criacao', size: 50, required: false },
        { key: 'data_partida', size: 50, required: false },
        { key: 'data_retorno', size: 50, required: false },
        { key: 'data_periodo_inicio', size: 50, required: true },
        { key: 'data_periodo_fim', size: 50, required: true },
        { key: 'data_autorizacao', size: 50, required: false },
        { key: 'data_pre_autorizacao', size: 50, required: false },
        { key: 'data_cancelamento', size: 50, required: false },
        { key: 'data_pagamento', size: 50, required: false },
        { key: 'motivo_recusa', size: 2000, required: false },
        { key: 'motivo_cancelamento', size: 2000, required: false },
        { key: 'cancelador_cpf', size: 14, required: false },
        { key: 'pre_autorizador_cpf', size: 14, required: false },
        { key: 'observacoes', size: 2000, required: false },
        { key: 'observacoes_autorizador', size: 2000, required: false },
        { key: 'em_edicao_desde', size: 50, required: false },
        { key: 'cidade_origem', size: 255, required: false },
        { key: 'cidade_destino', size: 255, required: false },
        { key: 'voo_ida', size: 255, required: false },
        { key: 'voo_volta', size: 255, required: false },
        { key: 'distancia_id', type: 'integer', required: false },
        { key: 'categoria_id', type: 'integer', required: false },
        { key: 'custo_id', type: 'integer', required: false },
        { key: 'valor_a_pagar', size: 20, required: false },
        { key: 'valor_pago', size: 20, required: false },
        { key: 'ajuda_custo_extraordinaria', size: 20, required: false },
        { key: 'desconto_outros_auxilios', size: 20, required: false },
        { key: 'ajuda_custo', size: 20, required: false },
        { key: 'desconto', size: 20, required: false },
        { key: 'tem_aereo', type: 'boolean', required: false },
        { key: 'hospedagem_cosems', type: 'boolean', required: false },
        { key: 'reducao_diarias_50', type: 'boolean', required: false },
        { key: 'auxilios_terceiros', size: 4000, required: false },
        { key: 'auth_id', size: 255, required: false },
        { key: 'created_at', size: 50, required: false },
    ], [
        { key: 'idx_protocolo', type: 'unique', attributes: ['protocolo'] },
        { key: 'idx_situacao', type: 'key', attributes: ['situacao'] },
        { key: 'idx_usuario_cpf', type: 'key', attributes: ['usuario_cpf'] },
        { key: 'idx_usuario_cpf_situacao', type: 'key', attributes: ['usuario_cpf', 'situacao'], orders: ['ASC', 'ASC'] },
        { key: 'idx_auth_id', type: 'key', attributes: ['auth_id'] },
        { key: 'idx_data_criacao', type: 'key', attributes: ['data_criacao'] },
    ])

    // 9. prestacao_contas
    await createCollection('prestacao_contas', 'Prestação de Contas', [
        { key: 'solicitacao_id', size: 255, required: true },
        { key: 'status', size: 50, required: true },
        { key: 'objetivo_participacao', size: 20000, required: false },
        { key: 'atividades_realizadas', size: 20000, required: false },
        { key: 'data_envio', size: 50, required: false },
        { key: 'data_analise', size: 50, required: false },
        { key: 'motivo_recusa', size: 2000, required: false },
        { key: 'created_at', size: 50, required: false },
    ], [
        { key: 'idx_solicitacao_id', type: 'key', attributes: ['solicitacao_id'] },
        { key: 'idx_status', type: 'key', attributes: ['status'] },
    ])

    // 10. pc_arquivos (era prestacao_contas_arquivos)
    await createCollection('pc_arquivos', 'Arquivos de Prestação', [
        { key: 'prestacao_contas_id', size: 255, required: true },
        { key: 'arquivo_url', size: 1000, required: true },
        { key: 'nome_arquivo', size: 500, required: true },
        { key: 'tipo_arquivo', size: 50, required: false },
        { key: 'data_upload', size: 50, required: false },
    ], [
        { key: 'idx_prestacao_contas_id', type: 'key', attributes: ['prestacao_contas_id'] },
    ])

    // 11. custos
    await createCollection('custos', 'Custos', [
        { key: 'descricao', size: 255, required: true },
        { key: 'valor', size: 20, required: true },
        { key: 'categoria_id', type: 'integer', required: false },
        { key: 'created_at', size: 50, required: false },
    ])

    // 12. deslocamentos
    await createCollection('deslocamentos', 'Deslocamentos', [
        { key: 'solicitacao_id', size: 255, required: true },
        { key: 'origem', size: 255, required: true },
        { key: 'destino', size: 255, required: true },
        { key: 'data', size: 50, required: true },
        { key: 'created_at', size: 50, required: false },
    ], [
        { key: 'idx_solicitacao_id', type: 'key', attributes: ['solicitacao_id'] },
    ])

    // 13. historico_solicitacoes (NOVA)
    await createCollection('historico_solicitacoes', 'Histórico de Solicitações', [
        { key: 'solicitacao_id', size: 255, required: true },
        { key: 'status_anterior', size: 50, required: false },
        { key: 'status_novo', size: 50, required: true },
        { key: 'usuario_cpf', size: 14, required: true },
        { key: 'usuario_nome', size: 255, required: false },
        { key: 'observacao', size: 2000, required: false },
    ], [
        { key: 'idx_solicitacao_id', type: 'key', attributes: ['solicitacao_id'] },
    ])

    // 14. historico_backups
    await createCollection('historico_backups', 'Histórico de Backups', [
        { key: 'data_execucao', size: 50, required: true },
        { key: 'status', size: 50, required: true },
        { key: 'nome_arquivo', size: 500, required: false },
        { key: 'tamanho_bytes', type: 'integer', required: false },
        { key: 'detalhes', size: 4000, required: false },
    ], [
        { key: 'idx_data_execucao', type: 'key', attributes: ['data_execucao'] },
    ])

    // 15. config_backup (doc único — upsert em admin/backup/actions)
    await createCollection('config_backup', 'Configuração de Backup', [
        { key: 'horario', size: 10, required: false },
        { key: 'habilitado', type: 'boolean', required: false, default: false },
        { key: 'ultima_execucao', size: 50, required: false },
        { key: 'updated_at', size: 50, required: false },
    ])

    // 16. historico_emails (legado — só backup/limpeza)
    await createCollection('historico_emails', 'Histórico de E-mails', [
        { key: 'para', size: 255, required: false },
        { key: 'assunto', size: 500, required: false },
        { key: 'status', size: 50, required: false },
        { key: 'erro', size: 2000, required: false },
        { key: 'created_at', size: 50, required: false },
    ])

    // 17. recuperacao_senhas (legado — só backup/limpeza)
    await createCollection('recuperacao_senhas', 'Recuperação de Senhas', [
        { key: 'usuario_cpf', size: 14, required: false },
        { key: 'token', size: 255, required: false },
        { key: 'expira_em', size: 50, required: false },
        { key: 'usado', type: 'boolean', required: false, default: false },
        { key: 'created_at', size: 50, required: false },
    ])

    // Create storage buckets
    console.log('\n=== Buckets de Storage ===\n')

    for (const [id, name] of [['comprovantes', 'Comprovantes'], ['avatars', 'Avatares']]) {
        try {
            await storage.createBucket(id, name, READ_WRITE, false, true)
            console.log(`  Bucket "${name}" (${id}) criado`)
        } catch (e) {
            console.log(`  Bucket "${name}": ${e.message}`)
        }
    }

    console.log('\n=== Setup concluído! ===')
    console.log(`Database ID: ${DATABASE_ID}`)
    console.log('Próximos passos: scripts/seed-categorias.mjs (IDs 1..5), doc "1" em configuracoes_sistema e config_backup.')
}

main().catch(console.error)
