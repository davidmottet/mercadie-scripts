import { getAIProvider } from './src/providers/index.js';
import './config/config.js';

async function main() {
  try {
    const ollamaProvider = getAIProvider('ollama');
    const result = await ollamaProvider.generateCompletion('Réponds avec un simple "ok"');
    
    if (result) {
      console.log('✅ Ollama connection successful');
    } else {
      console.error('❌ Ollama connection failed');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main(); 