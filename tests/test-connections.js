import { getAIProvider } from './src/providers/index.js';
import { initializeParse, testParseConnection } from './config/parseConfig.js';
import './config/config.js';

async function testOllama() {
  try {
    const ollamaProvider = getAIProvider('ollama');
    const result = await ollamaProvider.generateCompletion('Réponds avec un simple "ok"');
    return result ? true : false;
  } catch (error) {
    console.error('❌ Ollama Error:', error.message);
    return false;
  }
}

async function main() {
  console.log('Testing connections...\n');

  // Test Parse Server
  console.log('Testing Parse Server...');
  try {
    initializeParse();
    const parseConnected = await testParseConnection();
    console.log(parseConnected ? '✅ Parse Server connection successful' : '❌ Parse Server connection failed');
  } catch (error) {
    console.error('❌ Parse Server Error:', error.message);
  }

  // Test Ollama
  console.log('\nTesting Ollama...');
  const ollamaConnected = await testOllama();
  console.log(ollamaConnected ? '✅ Ollama connection successful' : '❌ Ollama connection failed');

  console.log('\nTests completed');
}

main(); 