#  Craft World Economy

<p align="center">
  <img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEixGz3zwNdZ4IcLNeHbbH7YmTY9HThGYKFK9bppgQKOK4hjXMM0L11CYsIxtZgTHtk-SVWwylD2V9YUbswX2Lo1DqHvnlXRANtbt6QsWLwJlc9eZszsNpNxqZW4s2Ju0HIT29joyCdPcgNsSsBPvEf3pJN6yIrCBaqSlzQSar-B3OsfFotVNPJVBnyf3x8/s320/log_cwe.png?format=webp&resize=400x300&vertical=center" width="300"/>
</p>

<h1 align="left">🎮 Craft World Economy</h1>
<p align="left">Dashboard de monitoramento de preços e oportunidades de trading com alertas pelo Telegram para o jogo Craft World na rede Ronin Network.</p>

---

## 📌 Sobre o Projeto

O **Craft World Economy** é uma plataforma web profissional desenvolvida para monitorar, analisar e identificar oportunidades de trading dentro da economia do jogo Craft World.

A aplicação integra dados em tempo real via GeckoTerminal API, calcula oportunidades com base em thresholds configuráveis e permite automação de alertas para **Telegram** e **X**.

O sistema foi projetado com arquitetura modular, preparado para futura expansão SaaS.

---

# 🌍 Funcionalidades

## 🔓 Dashboard Público (`/`)

### 📊 Tabela de Preços em Tempo Real

* Integração com GeckoTerminal API
* Preço atual
* Liquidez
* Volume
* Spread
* Desvio percentual
* Atualização automática

### 📈 Cards de Estatísticas

* Total de pools monitoradas
* Recursos cadastrados
* Média de desvio
* Oportunidades ativas
* Status da API

### 💹 Painel de Oportunidades

* Compra abaixo do threshold configurado
* Venda acima do threshold configurado
* Indicadores visuais
* Atualização dinâmica

### 🏗 Cadeia de Produção Visual

* Estrutura hierárquica em árvore
* Baseado em JSON
* Cálculo automático de custo total

### 🪙 Preço do RON em Tempo Real

* Cotação atual do token da rede Ronin
* Atualização automática
* Impacto direto no cálculo produtivo

### 📢 Banners Publicitários

* Upload de imagem
* Inserção de scripts HTML/Ad
* Controle por posição (header, sidebar, footer)

### 🌐 Suporte Bilíngue

* Português 🇦🇴
* English 🇺🇸
* Alternância dinâmica

---

# 🔐 Painel Administrativo (`/admin`)

## 🔑 Autenticação

* Superadmin via variável de ambiente (`.env`)
* Sistema de utilizadores
* Senhas com hash seguro
* Middleware de proteção

## 👥 Sistema de Roles

* **Admin** – acesso total
* **Viewer** – permissões granulares

---

## ⚙️ Gestão de Módulos

### 🏦 Pools

* Editar endereços de pools
* Definir custos de produção
* Configurar alertas individuais
* Ativar/desativar pools

### 🌳 Cadeias de Produção

* Editor JSON da árvore produtiva
* Estrutura dinâmica
* Cálculo automático

### 🤖 Telegram Bot

* Configurar Bot Token
* Definir Chat ID
* Intervalo de envio
* Teste manual de alertas

### 🔄 Partilha Automática

Publicação automática de alertas em:

* X (Twitter)
* Canais Telegram

Inclui:

* Mensagem formatada
* Hashtags automáticas
* Link direto para o dashboard

### 🖼 Gestão de Banners

* Upload de imagem
* Inserção de script
* Controle por posição
* Ativar/desativar

### 🛠 Configurações Gerais

* Threshold global de compra
* Threshold global de venda
* Seleção de rede
* Personalização de header, footer e login
* Gestão de utilizadores

---

# 🏗 Arquitetura

## 🔹 Frontend

* Next.js
* React
* Tailwind CSS
* Sistema i18n

## 🔹 Backend

* Node.js
* API REST
* Cron jobs para alertas
* Integração GeckoTerminal

## 🔹 Banco de Dados

* PostgreSQL ou MongoDB

## 🔹 Deploy

* VPS ou Vercel
* Variáveis sensíveis em `.env`

---

# ⚙️ Instalação

```bash
# Clonar repositório
git clone https://github.com/seu-usuario/craft-world-economy.git

# Entrar na pasta
cd craft-world-economy

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env

# Rodar em desenvolvimento
npm run dev
```

---

# 🔐 Variáveis de Ambiente (.env)

```env
SUPERADMIN_PASSWORD=
DATABASE_URL=
GECKO_API_URL=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
X_API_KEY=
X_API_SECRET=
RONIN_NETWORK=
```

---

# 📊 Roadmap

* [ ] Sistema avançado de alertas com histórico
* [ ] Gráficos de variação histórica
* [ ] Sistema de assinatura premium
* [ ] API pública do projeto
* [ ] Versão SaaS multi-tenant

---

# 💰 Monetização

* Banners patrocinados
* Publicidade integrada
* Planos premium (futuro)

---

# 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`feature/nova-funcionalidade`)
3. Commit suas alterações
4. Push para a branch
5. Abra um Pull Request

---

# 📄 Licença

Este projeto pode ser distribuído sob licença MIT

---

# 👨‍💻 Autor

Desenvolvido por **Staline Satola** https://t.me/bondsbtc
Projeto focado na economia do jogo Craft World na rede Ronin.
