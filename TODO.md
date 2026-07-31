# TODO — Migração Supabase → Appwrite (Port)

> Última atualização: 31/07/2026 — Projeto: `C:\_Apps\auxilios-vps-appwrite`
> Servidor: `https://vps.cosemspb.org/v1` (Appwrite 1.8.1) · Projeto: `auxilios` · Repo: `cosemspb/auxilios-vps-appwrite` (master)

---

## ✅ Já realizado

### Código (commit `f9f155f` — push OK)
- [x] `src/lib/appwrite/server.ts`: `createClient()` async com novo `Client` por request + `setSession()` via cookie; `createAdminClient()` singleton
- [x] `src/lib/appwrite/session-cookie.ts`: cookie `a_session_{projectId}` (const `SESSION_COOKIE_NAME`)
- [x] `src/app/proxy.ts`: middleware valida sessão com cookie + `setSession`
- [x] `src/app/auth/actions.ts`: login seta cookie (httpOnly, secure prod, sameSite lax, expires = `session.expire`); logout deleta
- [x] `src/app/actions/auth-actions.ts`: `hasValidSession()`; removidos imports dinâmicos
- [x] `await createClient()` aplicado em 17 arquivos server
- [x] `src/app/dashboard/requests/page.tsx` → server component (SSR) + `src/components/dashboard/requests-list.tsx` (client)
- [x] `/update-password` com `Suspense` + `update-password-content.tsx` (check via `hasValidSession()`)
- [x] SDKs alinhados ao servidor 1.8.1: `appwrite@22.4.1` (web), `node-appwrite@22.1.3` (server)
- [x] `npx tsc --noEmit` sem erros · `npm run build` OK
- [x] Badge "AW" bordô (#800020) na tela de login e na sidebar (`.appwrite-badge` em `globals.css`)

### Infra
- [x] Projeto Appwrite `auxilios` criado manualmente no console (sessão CLI não tem scope `projects.write`)
- [x] `.env.local` com credenciais reais (gitignored): endpoint, project `auxilios`, API key, `APPWRITE_DATABASE_ID=auxilios`, `SMTP_ENCRYPTION_KEY`
- [x] CLI Appwrite configurado: `appwrite client -e https://vps.cosemspb.org/v1 -p auxilios -k <key>` (comandos de dados OK)
- [x] Database **`auxilios` criada** no servidor (nenhuma coleção ainda)
- [x] Auditoria de coleções/campos concluída (fonte canônica: `src/lib/backup/backup-service.ts` — 17 coleções; `src/app/dashboard/admin/reset/actions.ts` — 9 transacionais)

---

## 🔄 Em andamento / Pendente

### 1. Corrigir `scripts/setup-collections.mjs` (PRÓXIMO PASSO)
- [ ] Permissões: usar helper `Permission` do node-appwrite (ex.: `Permission.read('users')`, `Permission.write('users')`) — servidor 1.8.1 rejeita `role:` e role nua (`"users"`); exige strings `read("users")`
- [ ] Alinhar nomes/campos ao código (auditoria):
  - `prestacao_contas_arquivos` → **`pc_arquivos`** (campos `prestacao_contas_id`, `arquivo_url`, `nome_arquivo`, `tipo_arquivo`, `data_upload`)
  - `smtp_config` → **`configuracoes_smtp`** (`smtp_host`, `smtp_port` int, `smtp_user`, `smtp_password`, `smtp_from_email`, `smtp_from_name`, `smtp_secure` bool, `emails_notificacao_novos_pedidos`, `emails_notificacao_rede`, `test_email_config`, `ativo` bool, `data_atualizacao`)
  - `configuracoes_sistema` → campos `fonte_padrao`, `updated_at` (doc id `'1'`)
  - `config_backup` → `horario`, `habilitado` bool, `ultima_execucao`, `updated_at`
  - `historico_backups` → `data_execucao`, `status`, `nome_arquivo`, `tamanho_bytes` int, `detalhes` (≠ `arquivo_backup`)
  - `historico_solicitacoes` (NOVA) → `solicitacao_id`, `status_anterior`, `status_novo`, `usuario_cpf`, `usuario_nome`, `observacao`
  - `usuarios` → + `dados_bancarios` (string JSON), `necessidades_especiais`, `avatar_url`; `tipo_perfil_id`/`categoria_id` como **integer**
  - `solicitacoes` → `distancia_id`, `valor_a_pagar`, `valor_pago`, `ajuda_custo_extraordinaria`, `desconto_outros_auxilios` como **integer**; `tem_aereo`, `hospedagem_cosems`, `reducao_diarias_50` como **bool**; `data_criacao` **não-required**; `auxilios_terceiros` como string JSON
  - `prestacao_contas` → `solicitacao_id`, `status`, `objetivo_participacao`, `atividades_realizadas`, `data_envio`, `data_analise`, `motivo_recusa`, `created_at`
  - Coleções menores p/ backup não falhar: `perfis`, `historico_emails`, `recuperacao_senhas`, `historico_pagamentos`, `email_templates`, `custos`, `deslocamentos`
- [ ] Buckets: `comprovantes` + `avatares` (uploads via `createAdminClient`; arquivos servidos por `/api/storage/proxy` e view URLs)
- [ ] Índices: `usuarios.cpf` único, `solicitacoes.protocolo` único, composite `usuario_cpf+situacao`, keys em `situacao`, `status`, etc.

### 2. Executar setup + seeds
- [ ] Rodar `scripts/setup-collections.mjs` e validar via `appwrite databases list` + console
- [ ] Rodar `scripts/seed-categorias.mjs` (IDs determinísticos p/ casar com `categoria_id` numérico)
- [ ] Seed doc `'1'` em `configuracoes_sistema` e `config_backup`

### 3. Fixes de runtime (auditoria)
- [ ] `dados_bancarios` e `auxilios_terceiros`: código grava **objeto/array** — Appwrite não tem tipo objeto/JSON → patch de código (`JSON.stringify`/`JSON.parse`) nos pontos de escrita/leitura (profile/actions.ts, admin users, requests)
- [ ] `requests/page.tsx` usa `NEXT_PUBLIC_APPWRITE_DATABASE_ID` → trocar por `APPWRITE_DATABASE_ID` ou renomear env
- [ ] `historico_backups`: página admin/backup lê `arquivo_backup` mas service grava `nome_arquivo` → alinhar
- [ ] Verificar uso de `documentSecurity`/permissões de documento nos `listDocuments` admin

### 4. Site + Deploy (Appwrite Sites)
- [ ] Verificar escopos da API key (`sites.*` p/ deploy) — se faltar, pedir nova key ao usuário
- [ ] Criar site `auxilios-web` (framework `nextjs`, adapter `ssr`, buildRuntime node-22, install `npm install`, build `npm run build`, output `.next`, start `bash helpers/next-js/server.sh`)
- [ ] Variáveis do site: `NEXT_PUBLIC_APPWRITE_ENDPOINT`, `NEXT_PUBLIC_APPWRITE_PROJECT_ID=auxilios`, `APPWRITE_API_KEY`, `APPWRITE_DATABASE_ID=auxilios`, `NEXT_PUBLIC_APP_URL=https://auxilios.cosemspb.org`, `SMTP_ENCRYPTION_KEY`
- [ ] Resolver `output: 'standalone'` em `next.config.ts` vs adapter ssr dos Sites
- [ ] Confirmar DNS A `auxilios.cosemspb.org → 108.174.151.235`
- [ ] Empacotar `.next` + `public` + `package.json` + node_modules em tar.gz → `POST /v1/sites/auxilios-web/deployments` com `activate=true` (padrão roomlist-web)
- [ ] Testar produção: login, fluxo completo de solicitação, upload de comprovantes, PC, backup/restore

---

## ⚠️ Regras
- **NÃO tocar** `acomoda-facil` (produção) nem `relatorios`
- Credenciais só em `.env.local` (gitignored) — nunca commitar
- Deploy obrigatório após cada alteração de código (padrão AGENTS.md)
