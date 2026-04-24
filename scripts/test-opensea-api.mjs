#!/usr/bin/env node

/**
 * Script para testar a conexão com a API do OpenSea
 * Verifica se a chave de API é válida
 */

const API_KEY = '015ce5f1adf34f0fa4d0049bee632f4d';
const COLLECTION_SLUG = 'angry-dynomites-lab';

async function testOpenSeaAPI() {
  console.log('🔍 Testando conexão com API do OpenSea...\n');
  console.log(`API Key: ${API_KEY.substring(0, 8)}...${API_KEY.substring(-4)}`);
  console.log(`Coleção: ${COLLECTION_SLUG}\n`);

  try {
    // Teste 1: Obter informações da coleção
    console.log('📦 Teste 1: Obtendo informações da coleção...');
    const collectionUrl = `https://api.opensea.io/api/v2/collections/${COLLECTION_SLUG}`;
    
    const collectionResponse = await fetch(collectionUrl, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'x-api-key': API_KEY,
      },
    });

    if (!collectionResponse.ok) {
      throw new Error(`Erro na coleção: ${collectionResponse.status} ${collectionResponse.statusText}`);
    }

    const collectionData = await collectionResponse.json();
    console.log('✅ Sucesso! Informações da coleção:');
    console.log(`   - Nome: ${collectionData.collection}`);
    console.log(`   - Descrição: ${collectionData.description?.substring(0, 100)}...`);
    console.log(`   - Imagem: ${collectionData.image_url ? 'Disponível' : 'Não disponível'}\n`);

    // Teste 2: Obter NFTs da coleção
    console.log('🖼️  Teste 2: Obtendo NFTs da coleção...');
    const nftsUrl = `https://api.opensea.io/api/v2/collection/${COLLECTION_SLUG}/nfts?limit=5`;
    
    const nftsResponse = await fetch(nftsUrl, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'x-api-key': API_KEY,
      },
    });

    if (!nftsResponse.ok) {
      throw new Error(`Erro ao obter NFTs: ${nftsResponse.status} ${nftsResponse.statusText}`);
    }

    const nftsData = await nftsResponse.json();
    console.log(`✅ Sucesso! Total de NFTs: ${nftsData.nfts?.length || 0}`);
    
    if (nftsData.nfts && nftsData.nfts.length > 0) {
      console.log('   Primeiros NFTs:');
      nftsData.nfts.slice(0, 3).forEach((nft, index) => {
        console.log(`   ${index + 1}. ${nft.name || 'Sem nome'}`);
      });
    }
    console.log('\n');

    // Resumo final
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✨ RESULTADO: API KEY VÁLIDA E FUNCIONANDO! ✨');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\nVocê pode usar essa chave para:');
    console.log('• Integrar galeria NFT na aplicação');
    console.log('• Exibir dados da coleção Angry Dynomites Lab');
    console.log('• Buscar e listar NFTs específicos');
    console.log('• Consultar histórico de vendas e ofertas');

  } catch (error) {
    console.error('\n❌ ERRO NA CONEXÃO:');
    console.error(`   ${error.message}\n`);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('Possíveis causas:');
    console.error('1. API Key inválida ou expirada');
    console.error('2. Problemas de conectividade');
    console.error('3. Rate limiting da API');
    console.error('4. Collection slug incorreto');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    process.exit(1);
  }
}

testOpenSeaAPI();
