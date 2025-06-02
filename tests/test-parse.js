import { initializeParse, testParseConnection } from '../config/parseConfig.js';
import '../config/config.js';

async function main() {
  try {
    initializeParse();
    const isConnected = await testParseConnection();
    
    if (isConnected) {
      console.log('✅ Parse Server connection successful');
    } else {
      console.error('❌ Parse Server connection failed');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main(); 