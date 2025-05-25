import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Obtenir le chemin du fichier actuel
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement depuis le fichier .env
dotenv.config({ path: join(__dirname, '..', '.env') });

export default {
  ia: {
    openAi: {
      key: process.env.OPENAI_API_KEY || 'sk-proj-1234567890'
    },
    ollama: {
      url: process.env.OLLAMA_URL || 'localhost',
      port: process.env.OLLAMA_PORT || '11434',
      model: process.env.OLLAMA_MODEL || 'llama2'
    }
  },
  scraper: {
    url: process.env.SCRAPER_URL || 'localhost',
    port: process.env.SCRAPER_PORT || '8000',
    username: process.env.SCRAPER_USERNAME || 'admin',
    password: process.env.SCRAPER_PASSWORD || 'admin'
  }
}; 