# TODO — 09/07/2026

## Sessão de hoje (09/07)

### 15. Protocolo 260706-14478 duplicado (Chris) — ✅ RESOLVIDO
- **Problema:** aparecia em "Pendentes de Comprovação" e "Aguardando Pagamento" simultaneamente
- **Causa:** `getAuthorizedRequests()` buscava `situacao IN ('autorizada', 'paga', 'paga_nao_comprovada')` sem excluir as que já têm PC aprovada
- **Tentativa 1 (falha):** `.not('prestacao_contas.status', 'eq', 'aprovada')` — PostgREST não filtra pais por condição em filhos, apenas filtra quais filhos aparecem no JSON
- **Tentativa 2 (sucesso):** filtro JS `(data || []).filter(req => !req.prestacao_contas.some(pc => pc.status === 'aprovada'))` — aplicado em `getAuthorizedRequests()` e `getDashboardData()`. Count ajustado subtraindo registros removidos.

### 16. Quebra de página no PDF de prestação de contas — ✅ RESOLVIDO
- **Problema:** `writeWrapped()` escrevia todas as linhas sequencialmente sem verificar o fim da página. Textos longos em objetivo/descrição de atividades/observações eram truncados.
- **Fix:** adicionado `if (y + lineHeight > PAGE_H - BOTTOM_MARGIN)` → `doc.addPage()` + reset `y` antes de cada linha

---

## O que está funcionando

✅ Dashboard com `getDashboardData()` em produção (1 auth check vs 7 antes)\
✅ 7 novos índices de FK aplicados no banco\
✅ `exec_sql()` disponível para migrações futuras\
✅ RLS corrigida com initplan\
✅ QuickPDFViewer funcional em Autorizadas + Relatório de Solicitações\
✅ Data do selo de autorizado com fallback chain\
✅ Scroll suave na paginação\
✅ Hover no botão Sair\
✅ `registerPayment` respeita PC aprovada (não mais `paga_nao_comprovada` indevida)\
✅ Locks expiram automaticamente e limpam o banco\
✅ Unlock ao sair da página de edição (UnlockOnUnmount)\
✅ Motivo da recusa visível na página de análise admin\
✅ `approveAccountability` não força pagamento — aprova PC separadamente\
✅ PC duplicata do 260617-4DB89 limpa\
✅ Protocolo não duplica mais entre seções (PC aprovada → só "Aguardando Pagamento")\
✅ PDF quebra texto longo entre páginas automaticamente

---

## Bugs conhecidos / Pendências

### 🟡 Importante
- "Relatório de Solicitações" visível apenas para admin (perfil 4) — usuário recusou liberar para autorizadores
- `exec_sql()` com `search_path = 'public'` — função criada mas precisa de teste de restore completo
- Dashboard da Rede (perfil 2) carrega apenas "Pendentes de Autorização" — demais 6 seções não foram implementadas

### 🟢 Melhorias
- `data/melhorias.json` — relatório original do Supabase Linter, mantido para referência

---

### ✅ Validado em produção (09/07)
- Protocolo 260706-14478 aparece **apenas** em "Comprovadas (Aguardando Pagamento)" ✅
- PDF quebra texto longo entre páginas corretamente ✅

## Próximo passo exato

**A definir** — todas as correções pendentes foram resolvidas. Próximo ciclo de desenvolvimento pode começar.
