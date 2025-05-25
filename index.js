import { getAIProvider } from './src/providers/index.js';
import './config/config.js';

async function main() {
  try {
    const ollamaProvider = getAIProvider('ollama');
    const result = await ollamaProvider.generateCompletion('Donne-moi un exemple de JSON avec un objet simple contenant un nom et un âge');
    console.log('Result:', result);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
