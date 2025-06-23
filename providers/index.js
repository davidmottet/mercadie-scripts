import config from '../config/config.js';
import { OpenAIProvider } from './openai.js';
import { OllamaProvider } from './ollama.js';
import { ScraperProvider } from './scraper.js';

export function getAIProvider(providerName) {
  switch (providerName) {
    case 'openai':
      return new OpenAIProvider(config.ia.openAi.key);
    case 'ollama':
      return new OllamaProvider(config.ia.ollama);
    default:
      throw new Error('Unknown AI provider');
  }
}

export function getScraperProvider() {
  return new ScraperProvider(config.scraper);
}

export { OpenAIProvider } from './openai.js';
export { OllamaProvider } from './ollama.js';
export { ScraperProvider } from './scraper.js'; 