# TODO After: Restore (Recuperação de Desastres)

> Implementado em 05/06/2026

## O que foi implementado

### 1. Formato do backup alterado
- `DELETE FROM table;` → `TRUNCATE TABLE table CASCADE;`
- Resolve FK constraints durante restore (CASCADE trunca dependentes automaticamente)
- Reseta sequences (INSERTs com IDs explícitos funcionam sem conflito)

### 2. Função `exec_sql` no banco
- `scripts/add_exec_sql_function.sql` — RPC function que executa SQL arbitrário via `SECURITY DEFINER`
- Permissão: apenas `service_role` (admin) pode chamar
- Adicionada também ao `scripts/reset_complete.sql` para sobreviver a reset total

### 3. `src/lib/backup/restore-service.ts`
| Função | Descrição |
|--------|-----------|
| `listBackups()` | Lista diretórios `backups/{timestamp}/` no R2, agrupa SQL + manifests de storage |
| `previewRestore(ts)` | Baixa o SQL, parseia comentários `-- tabela (N registros)` para preview |
| `runFullRestore(ts)` | Auto-backup → baixa SQL → executa via `rpc('exec_sql')` → restaura storage com verificação SHA-256 |

### 4. UI de Restore
- `src/app/dashboard/admin/restore/actions.ts` — server actions
- `src/app/dashboard/admin/restore/page.tsx` — fluxo: listar backups → preview → confirmar ("RESTAURAR") → resultado
- Link no sidebar e na página de backup

### 5. Verificação de integridade
- Cada arquivo baixado do R2 tem SHA-256 recalculado e comparado com o `manifest.json`
- Se divergir, o restore daquele arquivo falha (arquivo corrompido no R2)

## Pendente (antes de usar)

### ⚠️ Executar script SQL no banco
```bash
# Via Supabase Dashboard SQL Editor:
# 1. Abrir scripts/add_exec_sql_function.sql
# 2. Executar (ou rodar reset_complete.sql que já inclui a função)
```

### Teste recomendado
1. Backup → R2 (página Backup)
2. Reset Completo (página Reset Banco)
3. Restaurar (página Restaurar Backup) — selecionar o backup do passo 1
4. Verificar: dados idênticos antes do passo 2?

## Arquivos novos
- `src/lib/backup/restore-service.ts`
- `src/app/dashboard/admin/restore/actions.ts`
- `src/app/dashboard/admin/restore/page.tsx`
- `scripts/add_exec_sql_function.sql`

## Arquivos modificados
- `src/lib/backup/backup-service.ts` — `DELETE FROM` → `TRUNCATE ... CASCADE`
- `scripts/reset_complete.sql` — adicionado `exec_sql` function
- `src/components/dashboard/sidebar.tsx` — link "Restaurar Backup"
- `src/app/dashboard/admin/backup/page.tsx` — link para restore
