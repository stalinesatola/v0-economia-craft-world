# 🚀 Deployment Guide - Craft World Economy

## Status da Aplicação

✅ **Pronta para Production**
- Next.js 16.1.6 com Node.js otimizado
- Database: Neon PostgreSQL conectado
- Integrações: Vercel AI Gateway + Neon disponíveis
- Segurança: Auditoria completa realizada

---

## 1. DEPLOYMENT NO VERCEL (Recomendado)

### Via Dashboard Vercel

1. **Acesse:** https://vercel.com/dashboard
2. **Clique em:** "Add New Project"
3. **Importe seu repositório GitHub:**
   - Selecione `stalinesatola/v0-economia-craft-world`
   - Authorize Vercel para acessar repositório

4. **Configure Environment Variables:**
   ```
   ADMIN_PASSWORD=<sua-senha-forte-aqui>
   DATABASE_URL=<fornecido-pelo-neon>
   POSTGRES_URL=<fornecido-pelo-neon>
   POSTGRES_URL_NON_POOLING=<fornecido-pelo-neon>
   ```

5. **Clique em "Deploy"**

### Via CLI (Command Line)

```bash
# 1. Instale Vercel CLI
npm i -g vercel

# 2. Faça login
vercel login

# 3. Deploy
vercel --prod

# 4. Configure env vars no prompt
```

---

## 2. ENVIRONMENT VARIABLES NECESSÁRIAS

### Obrigatórias para Production:

```env
# Autenticação Admin
ADMIN_PASSWORD=SenhaForte123!@#ABC

# Database Neon (PostgreSQL)
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
POSTGRES_URL=postgresql://user:password@host/database
POSTGRES_URL_NON_POOLING=postgresql://user:password@host/database?sslmode=require

# Cron/Bot (use a mesma senha do ADMIN_PASSWORD)
CRON_SECRET=SenhaForte123!@#ABC

# Telegram Bot (opcional)
TELEGRAM_BOT_TOKEN=<seu-token-bot-telegram>
TELEGRAM_CHAT_ID=<seu-chat-id>
```

### Obrigatórias para Desenvolvimento:

```env
# Mesmo arquivo .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000
DATABASE_URL=postgresql://...
```

---

## 3. PREPARAÇÃO PRÉ-DEPLOYMENT

### Checklist:

- [ ] Todas as variáveis de ambiente configuradas
- [ ] Database migrations executadas via scripts/
- [ ] Config inicial carregada no banco de dados
- [ ] Admin password é forte (12+ chars, complexidade)
- [ ] Telegram bot configurado (se necessário)
- [ ] Auditoria de segurança revisada (READ AUDIT_INDEX.md)

### Executar Migrations Localmente (Teste):

```bash
# 1. Instale dependências
npm install

# 2. Crie .env.local com DATABASE_URL
# 3. Execute migrations
npm run build

# 4. Teste localmente
npm run dev
```

---

## 4. PÓS-DEPLOYMENT

### Verificar se Aplicação está Online:

```bash
# Teste a aplicação
curl https://seu-projeto.vercel.app/api/status

# Resposta esperada:
# {"healthy": true, ...}
```

### Configurar Domain (Opcional):

1. Acesse https://vercel.com/projects/seu-projeto
2. Settings → Domains
3. Adicione seu domain customizado
4. Siga instruções DNS

### Monitorar Logs:

```bash
# Via CLI
vercel logs

# Via Dashboard
https://vercel.com/projects/seu-projeto/logs
```

---

## 5. TROUBLESHOOTING

### Erro: "ADMIN_PASSWORD not configured"

**Solução:** Adicione env var em Vercel Dashboard → Settings → Environment Variables

### Erro: "Database connection failed"

**Solução:** Verifique:
- DATABASE_URL está correto
- IP de Vercel está allowlisted no Neon
- SSL mode está ativado

### Erro: "Build failed"

**Solução:** 
```bash
# Teste build localmente
npm run build

# Verifique erros de TypeScript
npm run lint
```

---

## 6. DEPLOYMENT COM GITHUB ACTIONS (CI/CD)

### Arquivo: `.github/workflows/deploy.yml`

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: vercel/action@main
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

### Setup CI/CD:

1. Gere VERCEL_TOKEN: https://vercel.com/account/tokens
2. Adicione secrets no GitHub:
   - VERCEL_TOKEN
   - VERCEL_ORG_ID (encontre em vercel.com)
   - VERCEL_PROJECT_ID (encontre em vercel.json)
3. Commit `.github/workflows/deploy.yml`
4. Todo push para `main` fará deploy automático

---

## 7. ROLLBACK (Se algo der errado)

### Via Vercel Dashboard:

1. Vá para Deployments
2. Clique no deployment anterior
3. Clique em "Promote to Production"

### Via CLI:

```bash
vercel rollback
```

---

## 8. MONITORAMENTO PÓS-DEPLOY

### Health Check (diário):

```bash
#!/bin/bash
curl -f https://seu-projeto.vercel.app/api/status || {
  echo "Site DOWN!"
  # Envie alerta por email/Telegram
}
```

### Alertas Recomendados:

- [ ] Monitorar erro rates
- [ ] Uptime monitoring (Pingdom, UptimeRobot)
- [ ] Performance monitoring (Sentry, LogRocket)
- [ ] Database queries lentas

---

## 9. SEGURANÇA PÓS-DEPLOY

### Ativar em Vercel:

- [ ] HTTPS/SSL (automático ✅)
- [ ] Rate limiting (configurar no código)
- [ ] CORS headers (verificar next.config)
- [ ] Security headers (adicionar middleware)

### Adicionar Headers de Segurança:

**Arquivo:** `next.config.ts`

```typescript
export default {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        ],
      },
    ]
  },
}
```

---

## 10. PERFORMANCE & OPTIMIZATION

### CDN (Already configured):
- ✅ Vercel Edge Network
- ✅ Automatic image optimization
- ✅ Static asset caching

### Recomendações:

1. **Habilitar Incremental Static Regeneration (ISR):**
   - Páginas estáticas regeneradas em background
   - Reduz carga no banco

2. **Usar Database connection pooling:**
   - Neon já tem Pooling habilitado
   - Reduz overhead de conexões

3. **Monitorar Core Web Vitals:**
   - Vercel Analytics (free)
   - Google PageSpeed Insights

---

## 11. PRIMEIRO ACESSO

### URL: `https://seu-projeto.vercel.app`

1. **Login Admin:**
   - Username: `admin`
   - Password: `{ADMIN_PASSWORD}`

2. **Configurar:**
   - Vá para Admin Panel
   - Customize settings/branding
   - Configure Telegram bot (se necessário)

3. **Teste Funcionalidades:**
   - [ ] Dashboard carrega dados
   - [ ] Configurações salvam corretamente
   - [ ] Telegram alerts funcionam

---

## 12. PRÓXIMOS PASSOS

### Melhorias Futuras (Post-Deploy):

- [ ] Setup monitoring com Sentry
- [ ] Configurar backups automáticos Neon
- [ ] Implementar bcrypt para senhas (ao invés de SHA-256)
- [ ] Adicionar 2FA para admin
- [ ] Setup Redis cache para performance
- [ ] Implementar GraphQL API

---

## 📞 Suporte

Problemas?

1. Verifique logs: `vercel logs`
2. Consulte AUDIT_INDEX.md para documentação técnica
3. Reporte issues no GitHub

**Deployment bem-sucedido!** 🎉

