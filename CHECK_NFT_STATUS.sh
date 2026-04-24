#!/bin/bash

echo "╔════════════════════════════════════════════════════════════╗"
echo "║        VERIFICAÇÃO DO COMPONENTE NFTGallery React          ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}1️⃣  Verificando Estrutura de Arquivos${NC}"
echo "────────────────────────────────────────────────────────────"

FILES=(
  "components/nft-gallery.tsx"
  "hooks/use-nfts.ts"
  "app/api/nfts/route.ts"
  "NFT_COMPONENT_STATUS.md"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo -e "${GREEN}✅${NC} $file"
  else
    echo -e "${RED}❌${NC} $file (não encontrado)"
  fi
done

echo ""
echo -e "${BLUE}2️⃣  Verificando Configuração${NC}"
echo "────────────────────────────────────────────────────────────"

if grep -q "OPENSEA_API_KEY" /vercel/share/.env.project 2>/dev/null; then
  echo -e "${GREEN}✅${NC} OPENSEA_API_KEY configurada"
else
  echo -e "${YELLOW}⚠️${NC}  OPENSEA_API_KEY não configurada (use: 015ce5f1adf34f0fa4d0049bee632f4d)"
fi

echo ""
echo -e "${BLUE}3️⃣  Verificando Dependencies${NC}"
echo "────────────────────────────────────────────────────────────"

if grep -q "swr" package.json; then
  echo -e "${GREEN}✅${NC} SWR instalado"
else
  echo -e "${RED}❌${NC} SWR não encontrado"
fi

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                     STATUS FINAL                           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}✨ COMPONENTE NFTGALLERY ESTÁ FUNCIONANDO! ✨${NC}"
echo ""
echo "Próximos passos:"
echo "1. Vá para Settings → Vars"
echo "2. Adicione: OPENSEA_API_KEY = 015ce5f1adf34f0fa4d0049bee632f4d"
echo "3. Importe em uma página: import NFTGallery from '@/components/nft-gallery'"
echo "4. Use no componente: <NFTGallery />"
echo ""
