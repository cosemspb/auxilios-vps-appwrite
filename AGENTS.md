# Git Workflow

**Repositório:** `github.com/cosemspb/auxilios-vps-appwrite.git`
**Conta:** `cosemspb`
## Push
```bash
git add -A
git commit -m "mensagem descritiva"
git push
```

**Importante:** O git remote original pode ser perdido se sobrescrito. Sempre verificar com `git remote -v` antes de push.

## Deploy Automático (via opencode)
Após cada push, o opencode **deve disparar automaticamente o deploy** acessando a URL de deploy. Não esperar o usuário pedir — o deploy faz parte do fluxo de entrega. A menos que o usuário explicitamente peça para não fazer deploy.

**Regra:** Depois de **qualquer correção ou alteração de código**, o deploy é obrigatório para testar em produção. Exceção apenas quando o usuário disser explicitamente "não precisa de deploy" ou similar.

## Deploy (Easypanel Free Tier)
O deploy é feito pelo **console do Easypanel**, não por webhook. A autenticação é via **SSH deploy key**.

### Setup (já configurado)
- **URL do repositório (SSH):** `git@github.com:cosemspb/auxilios_sb.git`
- **Deploy key:** Gerada pelo próprio Easypanel (botão **Generate** na aba Git do projeto) e adicionada em `github.com/cosemspb/auxilios_sb/settings/keys` como deploy key com acesso de escrita.

### Fluxo
1. Push para `main` (via terminal local)
2. Acessar URL de deploy: http://108.174.151.235:3000/api/deploy/5726e0f42f128fbc4fb14e9af0416d784591bf2f6dcf4d60
3. Ou manualmente: **console Easypanel → projeto auxilios → aba Deploy → clicar Redeploy**

### URL do Deploy
```
http://108.174.151.235:3000/api/deploy/5726e0f42f128fbc4fb14e9af0416d784591bf2f6dcf4d60
```

---

# Backup do Projeto (Código Fonte)

## Script
`scripts/backup-projeto.ps1` — Gera .zip do projeto excluindo `node_modules`, `.next`, `.git`, `.env.local`, `graphify-out/cache/`, `.agents/`.

## Uso
```powershell
powershell -ExecutionPolicy Bypass -File scripts/backup-projeto.ps1
```

## Saída
`C:\_Apps\auxilios_sb_YYYY-MM-DD_HHmmss.zip`

## O que é excluído
- `node_modules/` — dependências instaláveis via `npm install`
- `.next/` — build do Next.js
- `.git/` — repositório git
- `.env.local` — segredos locais
- `graphify-out/cache/` — cache de análise
- `.agents/` — skills de agentes
