
// Script para testar a geração de URLs (simula o N8N)
// Execute: node test-url-generator.js

const fetch = require('node-fetch');

async function generateTestUrl() {
  try {
    const response = await fetch('http://localhost:5000/generate-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        company_id: 1,
        whatsapp: '+5511999887766',
        codigo: 'ABC123',
        expires_hours: 24
      })
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ URL gerada com sucesso!');
      console.log('🔗 URL de acesso:', data.access_url);
      console.log('📅 Expira em:', data.expires_at);
      console.log('🆔 ID da validação:', data.validation_id);
    } else {
      console.log('❌ Erro:', data.error);
    }
  } catch (error) {
    console.log('❌ Erro de conexão:', error.message);
  }
}

generateTestUrl();
