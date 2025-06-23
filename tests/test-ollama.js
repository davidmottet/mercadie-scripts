import { OllamaProvider } from '../providers/ollama.js';
import config from '../config/config.js';

async function main() {
  try {
    const ollamaProvider = new OllamaProvider(config.ia.ollama);
    console.log('🔄 Testing Ollama connection...');
    
    const result = await ollamaProvider.generateCompletion('Réponds avec un simple "ok"');
    
    if (result) {
      console.log('✅ Ollama connection successful');
      console.log('📝 Response:', result);
    } else {
      console.error('❌ Ollama connection failed - no response received');
    }
  } catch (error) {
    console.error('❌ Error:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    process.exit(1);
  }
}

// Exécution du test
main(); 