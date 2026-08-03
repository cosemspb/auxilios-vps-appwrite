# TODO — Migração Supabase → Appwrite (Port)

> Última atualização: 03/08/2026 — Projeto: `C:\_Apps\auxilios-vps-appwrite`
> Servidor: `https://vps.cosemspb.org/v1` (Appwrite 1.8.1) · Projeto: `auxilios` · Repo: `cosemspb/auxilios-vps-appwrite` (master)

---

## ✅ Já realizado

### Infra + Banco (03/08 — commits `bc8769c` e `153da8d`, push OK)
- [x] `public/` (12 assets: logos, `pdf.worker.min.mjs`, favicons) copiado para a raiz e commitado
- [x] `scripts/setup-collections.mjs` reescrito e **executado contra o servidor**
- [x] **17 coleções + 2 buckets criados na VPS** (validado via API): `categorias`, `usuarios`, `distancias`, `configuracoes_sistema`, `email_templates`, `configuracoes_smtp`, `solicitacoes`, `prestacao_contas`, `pc_arquivos`, `custos`, `deslocamentos`, `historico_solicitacoes`, `historico_backups`, `config_backup`, `recuperacao_senhas`, `perfis`, `historico_emails` + buckets `comprovantes`, `avatars`
- [x] Atributos/índices conferidos coleção a coleção via `listAttributes`/`listIndexes` (usuários 16/5, solicitacoes 42/6 incl. composite `usuario_cpf+situacao`, pc_arquivos 5/1, prestacao_contas 8/2, email_templates 6/1)
- [x] Seeds executados: 5 **categorias com IDs determinísticos `1..5`** (`seed-categorias.mjs`) + `seed-configs.mjs` (doc `'1'` em `configuracoes_sistema` e `config_backup`)
- [x] Scripts idempotentes e carregam `.env.local` via `process.loadEnvFile()`

### Decisões tomadas no schema (03/08)
- [x] Valores monetários (`valor_a_pagar`, `valor_pago`, `ajuda_custo_extraordinaria`, `desconto_outros_auxilios`) como **string** — Appwrite não tem tipo float, e o admin envia casas decimais (`(diffDays * dailyRate) + distanceValue`); integer quebraria o fluxo de aprovação
- [x] IDs numéricos (`tipo_perfil_id`, `categoria_id`, `distancia_id`, `custo_id`) como **integer** (código grava `parseInt`/`Number`)
- [x] Campos grandes (`objetivo_participacao`, `atividades_realizadas`) com size **20000** — Appwrite/MariaDB limita 16KB por coleção; size ≥16384 vira TEXT e não conta no orçamento
- [x] `status` em `usuarios`: `required=false` + default `'pendente'` (Appwrite 1.8 não aceita default em atributo required)
- [x] `historico_pagamentos` **não criada** — nada no código a referencia (fonte canônica = `backup-service.ts`, 17 coleções)
- [x] Coleções **não são** documentSecurity (tudo via API key/`createAdminClient`)

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

### 1. Corrigir `scripts/setup-collections.mjs` ✅
- [x] Permissões: `Permission.read('users')` + `Permission.write('users')` (helper do node-appwrite) — coleções e buckets
- [x] Alinhar nomes/campos ao código (auditoria): `pc_arquivos`, `configuracoes_smtp`, `configuracoes_sistema`, `config_backup`, `historico_backups`, `historico_solicitacoes` (nova), `usuarios`, `solicitacoes`, `prestacao_contas` + 8 coleções menores
- [x] Buckets: `comprovantes` + `avatars`
- [x] Índices: `usuarios.cpf` único, `solicitacoes.protocolo` único, composite `usuario_cpf+situacao`, keys em `situacao`, `status`, etc.
- [x] Script idempotente: re-executar sincroniza atributos/índices faltantes (rede do VPS cai às vezes — rerun resolve)
- [x] **Decisão**: valores em reais (`valor_a_pagar`, `valor_pago`, `ajuda_custo_extraordinaria`, `desconto_outros_auxilios`) como **string** (Appwrite não tem float; integer quebraria decimais do fluxo admin) — IDs (`tipo_perfil_id`, `categoria_id`, `distancia_id`, `custo_id`) como **integer**
- [x] **Decisão**: campos grandes (`objetivo_participacao`, `atividades_realizadas`) com size 20000 (≥16384 = TEXT, não conta no limite MariaDB de 16KB/coleção)

### 2. Executar setup + seeds ✅ (03/08)
- [x] `scripts/setup-collections.mjs` rodado — **17 coleções + 2 buckets criados** no servidor (validado via API)
- [x] `scripts/seed-categorias.mjs` — 5 categorias com IDs determinísticos `1..5` (casa com `categoria_id` numérico via `getDocument(String(id))`)
- [x] `scripts/seed-configs.mjs` (NOVO) — doc `'1'` em `configuracoes_sistema` (fonte_padrao Arial) e `config_backup` (03:00, desabilitado)
- [x] Scripts carregam `.env.local` via `process.loadEnvFile()`

---

## ✅ O que está funcionando (03/08)
- [x] **Banco na VPS**: 17 coleções com atributos/índices corretos + buckets `comprovantes` e `avatars`
- [x] **Seeds**: 5 categorias (IDs `1..5`), `configuracoes_sistema` doc `'1'` (fonte Arial), `config_backup` doc `'1'` (03:00, desabilitado)
- [x] **Auth Appwrite SSR**: login/logout + cookie `a_session_auxilios`, middleware `src/app/proxy.ts`, `hasValidSession()`
- [x] **Build/typecheck**: `npx tsc --noEmit` e `npm run build` OK no último commit de código (`f9f155f`)
- [x] **Assets**: `public/` completo no repo (selo autorizado, assinatura eletrônica, logos, `pdf.worker.min.mjs`)

---

## 🔴 Bugs conhecidos / pendentes

### 3. Fixes de runtime (auditoria) — **PRÓXIMO PASSO**
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

## ▶️ Próximo passo exato (passo 3 — fix de runtime, `dados_bancarios`)

**Objetivo:** fazer o app escrever/ler campos do tipo objeto/array como **string JSON** no Appwrite (única forma aceita pelo 1.8.1).

1. `src/app/dashboard/profile/actions.ts` — ao salvar perfil, gravar `dados_bancarios: JSON.stringify({ banco, agencia, conta, pix })` em vez do objeto (linha ~85)
2. `src/app/dashboard/requests/actions.ts` — ao criar solicitação, gravar `auxilios_terceiros: JSON.stringify(auxilios_terceiros)` (linha ~167)
3. Todos os pontos que **leem** `dados_bancarios` (forma: `profile.dados_bancarios?.banco` etc.) e `auxilios_terceiros` → aplicar `JSON.parse` defensivo (helper `safeJsonParse` ou try/catch)
   - `src/app/dashboard/requests/actions.ts` (validação de cadastro completo, linhas ~91-96)
   - admin users (`src/app/actions/admin-actions.ts`, `formatDoc`) e páginas que exibem/permitem editar
4. Rodar `npx tsc --noEmit` e `npm run build`
5. (Se necessário) gerar 1 usuário de teste + `createDocument` via API para validar gravação de JSON

Depois: fechar itens `requests/page.tsx` env, `historico_backups.arquivo_backup` (linha: páginas usam `arquivo_backup`, service grava `nome_arquivo`), e permissões docs — então avançar p/ **passo 4 (Site Appwrite + Deploy)**.

---

## ⚠️ Regras
- **NÃO tocar** `acomoda-facil` (produção) nem `relatorios`
- Credenciais só em `.env.local` (gitignored) — nunca commitar
- Deploy obrigatório após cada alteração de código (padrão AGENTS.md)
