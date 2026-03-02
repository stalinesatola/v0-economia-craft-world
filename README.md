<div align="center">
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="MIT License" />
</div>

# Craft World Economy

Dashboard de monitoramento de precos e oportunidades de trading para o jogo Craft World na rede Ronin.

## Funcionalidades

### Dashboard Publico (`/`)
- Tabela de precos em tempo real via GeckoTerminal API
- Cards de estatisticas com contagem de pools e desvios
- Painel de oportunidades de compra/venda com thresholds configuraveis
- Cadeia de producao visual dos recursos
- Preco do RON em tempo real
- Banners de publicidade configuraveis (imagem ou ad scripts)
- Suporte bilingue (PT/EN)

### Painel Admin (`/admin`)
- Autenticacao com password (superadmin via env var + utilizadores com roles)
- Sistema de roles: `admin` (acesso total) e `viewer` (permissoes granulares)
- **Pools**: Editar enderecos de pools, custos de producao, alertas
- **Cadeias de Producao**: Editor JSON da arvore de producao
- **Telegram Bot**: Configurar bot token, chat ID, intervalo e testes
- **Partilha Automatica**: Publicar alertas no X.com (Twitter) e canais Telegram
- **Banners**: Configurar banners de imagem ou scripts de ad por posicao
- **Config Geral**: Thresholds, rede, personalizacao de header/footer/login, gestao de utilizadores

### Bot Telegram (Cron)
- Verificacao automatica a cada 5 minutos via Vercel Cron
- Envia alertas quando recursos desviam dos custos de producao
- Configuravel via painel admin

## Stack Tecnica

- **Framework**: Next.js 16 (App Router)
- **UI**: shadcn/ui + Tailwind CSS v4
- **Dados**: JSON file-based (`data/config.json`) com cache em memoria
- **Auth**: Cookie-based com tokens assinados (SHA-256)
- **API de Precos**: GeckoTerminal (rede Ronin)
- **Bot**: Telegram Bot API
- **Deploy**: Vercel

## Variaveis de Ambiente

| Variavel | Descricao | Obrigatoria |
|---|---|---|
| `ADMIN_PASSWORD` | Password do superadmin | Sim |
| `CRON_SECRET` | Segredo para proteger o endpoint cron | Sim (para cron) |
| `TELEGRAM_BOT_TOKEN` | Token do bot Telegram (configuravel via admin) | Nao |
| `TELEGRAM_CHAT_ID` | Chat ID do Telegram (configuravel via admin) | Nao |

## Instalacao

```bash
# Clonar o repositorio
git clone <repo-url>
cd craft-world-economy

# Instalar dependencias
pnpm install

# Configurar variaveis de ambiente
cp .env.example .env.local
# Editar .env.local com as variaveis necessarias

# Iniciar em desenvolvimento
pnpm dev
```

## Estrutura do Projeto

```
app/
  page.tsx              # Dashboard publico
  admin/page.tsx        # Painel admin (login + dashboard)
  api/
    prices/             # GET precos do GeckoTerminal
    ron-price/          # GET preco do RON
    customization/      # GET personalizacao publica
    admin/
      login/            # POST autenticacao
      logout/           # POST logout
      check/            # GET verificar sessao
      config/           # GET config completa
      config/[section]/ # PUT actualizar seccao
      users/            # GET/POST/DELETE gestao de utilizadores
      telegram/test/    # POST enviar mensagem de teste
      telegram/check/   # POST executar verificacao manual
      share/test/       # POST teste de partilha
    cron/monitor/       # POST cron do bot Telegram
    ohlcv/[pool]/       # GET dados OHLCV
components/
  admin/                # Componentes do painel admin
    tabs/               # Tabs: pools, chains, telegram, sharing, banners, settings
  dashboard-header.tsx  # Header do dashboard publico
  price-table.tsx       # Tabela de precos
  opportunities-panel.tsx
  production-chain.tsx
  ad-banner.tsx         # Componente de banners
lib/
  auth.ts               # Autenticacao e sessoes
  config-manager.ts     # Leitura/escrita do config.json
  craft-data.ts         # Dados default (fallback)
  i18n.tsx              # Internacionalizacao PT/EN
  telegram.ts           # Funcoes do bot Telegram
data/
  config.json           # Configuracao editavel via admin
```

## Licenca

This project is licensed under the MIT License — see the LICENSE file for details.

You are free to use, modify, and distribute this code in personal and commercial projects.
