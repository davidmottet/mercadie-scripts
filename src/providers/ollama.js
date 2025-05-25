import { AIProvider } from './base.js';

export class OllamaProvider extends AIProvider {
  constructor(_config) {
    super();
    this.baseUrl = `http://${_config.url}:${_config.port}`;
    this.model = _config.model;
    this.maxRetries = 3;
    this.timeout = 30000; // 30 secondes
    console.log('OllamaProvider initialized with config:', {
      baseUrl: this.baseUrl,
      model: this.model,
      timeout: this.timeout
    });
  }

  async fetchWithTimeout(url, options) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      console.log(`Making request to ${url}...`);
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
          const jsonStr = data.response.replace(/^[^{]*({.*})[^}]*$/s, '$1');
          const result = JSON.parse(jsonStr);
          console.log('Successfully parsed JSON response');
          return result;
        } catch (error) {
          console.error('Error parsing JSON:', error);
          throw new Error('Invalid JSON response from Ollama');
        }
      } catch (error) {
        console.error(`Attempt ${attempt} failed:`, error.message);
        lastError = error;

        if (attempt < this.maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(`Failed after ${this.maxRetries} attempts. Last error: ${lastError.message}`);
  }
} 