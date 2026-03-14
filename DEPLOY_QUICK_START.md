# ⚡ Quick Start - Deploy em 5 Minutos

## Via Vercel Dashboard (Mais Fácil)

### 1️⃣ Conectar GitHub
```
https://vercel.com/new
→ Import Project from GitHub
→ Selecione: stalinesatola/v0-economia-craft-world
```

### 2️⃣ Configurar Variáveis de Ambiente
Na tela "Configure Project", clique em "Environment Variables" e adicione:

```env
ADMIN_PASSWORD=SenhaForte123!@#
```

(Outras vars já vêm do Neon que está conectado)

### 3️⃣ Deploy!
```
Clique em "Deploy"
Aguarde ~3-5 minutos
```

### 4️⃣ Acessar
```
https://seu-projeto-name.vercel.app
```

---

## Via CLI (Para Desenvolvedores)

```bash
# Install
npm i -g vercel

# Login
vercel login

# Deploy
cd /path/to/projeto
vercel --prod

# Responda às perguntas
```

---

## ⚠️ Pré-Requisitos

✅ **Já Feito:**
- Database Neon conectado
- GitHub repository conectado
- Código auditado e seguro

✅ **Você Precisa De:**
- Conta Vercel (gratuita)
- ADMIN_PASSWORD forte (será solicitado)

---

## 🔒 Senha Segura - Exemplo

```
❌ Ruim: 123456, password, admin123
✅ Bom: CraftWorld@2024!Secure123
```

Requisitos:
- Mínimo 12 caracteres
- Maiúsculas + Minúsculas + Números + Especiais

---

## ✅ Verificação Pós-Deploy

```bash
# Teste se está online
curl https://seu-projeto.vercel.app/api/status

# Esperado:
# {"healthy": true, ...}
```

---

## 📚 Documentação Completa

Para mais detalhes, leia:
→ `DEPLOYMENT_GUIDE.md` (este diretório)

---

## 🎉 Pronto!

Sua aplicação está ao vivo! 🚀

**Admin URL:** `https://seu-projeto.vercel.app/admin`
