import { AIProvider } from './base.js';

export class OllamaProvider extends AIProvider {
  constructor(_config) {
    super();
    this.baseUrl = `http://${_config.url}:${_config.port}`;
    this.model = _config.model;
    this.maxRetries = _config.maxRetries || 3;
    // Timeout par défaut à 5 minutes, ou désactivé si configuré à 0
    this.timeout = _config.timeout === 0 ? 0 : (_config.timeout || 300000);
    this.retryDelay = _config.retryDelay || 1000;
    console.log('OllamaProvider initialized with config:', {
      baseUrl: this.baseUrl,
      model: this.model,
      timeout: this.timeout === 0 ? 'disabled' : `${this.timeout}ms`,
      maxRetries: this.maxRetries,
      retryDelay: this.retryDelay
    });
  }

  async fetchWithTimeout(url, options) {
    // Si le timeout est désactivé (0), on fait une requête normale
    if (this.timeout === 0) {
      console.log(`Making request to ${url} (no timeout)...`);
      return fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
    }

    // Sinon, on utilise le timeout configuré
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      console.log(`Making request to ${url} (timeout: ${this.timeout}ms)...`);
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`Connection timeout after ${this.timeout}ms to ${url}`);
      }
      throw error;
    }
  }

  async generateCompletion(prompt) {
    console.log('Generating completion with prompt:', prompt);

    let lastError;
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`Attempt ${attempt}/${this.maxRetries}...`);
        const response = await this.fetchWithTimeout(`${this.baseUrl}/api/generate`, {
          method: 'POST',
          body: JSON.stringify({
            model: this.model,
            prompt: prompt + "\n\nRéponds UNIQUEMENT avec un objet JSON valide, sans texte avant ni après.",
            stream: false
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Ollama API error: ${response.statusText} (${response.status}) - ${errorText}`);
        }

        const data = await response.json();
        console.log('Received response:', data);

        try {
          // Nettoyage de la réponse
          let jsonStr = data.response;
          
          // Suppression des backticks et du mot "json" s'ils sont présents
          jsonStr = jsonStr.replace(/```json\n?|\n?```/g, '');
          
          // Suppression des espaces et retours à la ligne au début et à la fin
          jsonStr = jsonStr.trim();
          
          // Si la réponse commence par un tableau ou un objet, on le prend tel quel
          // Sinon, on essaie d'extraire le premier objet JSON valide
          if (!jsonStr.startsWith('[') && !jsonStr.startsWith('{')) {
            const match = jsonStr.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
            if (match) {
              jsonStr = match[0];
            }
          }

          // Tentative de parsing
          const result = JSON.parse(jsonStr);
          console.log('Successfully parsed JSON response');
          return result;
        } catch (error) {
          console.error('Error parsing JSON:', error);
          console.error('Raw response:', data.response);
          throw new Error('Invalid JSON response from Ollama');
        }
      } catch (error) {
        console.error(`Attempt ${attempt} failed:`, error.message);
        lastError = error;

        if (attempt < this.maxRetries) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(`Failed after ${this.maxRetries} attempts. Last error: ${lastError.message}`);
  }
} 