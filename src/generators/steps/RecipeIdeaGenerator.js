import { OllamaProvider } from '../../providers/ollama.js';
import config from '../../../config/config.js';

export class RecipeIdeaGenerator {
  constructor(options = {}) {
    this.ollamaProvider = new OllamaProvider(config.ia.ollama);
    this.seed = options.seed || null;
  }

  async generateIdea() {
    const prompt = this._buildPrompt();
    const response = await this.ollamaProvider.generateCompletion(prompt);
    
    if (!response) {
      throw new Error('Pas de réponse de l\'IA pour la génération d\'idée de recette');
    }

    return this._parseResponse(response);
  }

  _buildPrompt() {
    let prompt = 'Generate a simple recipe idea in JSON format with the following fields: ' +
      'name (recipe name), description (short description), type (dish type), ' +
      'difficulty (easy, medium, hard), preparationTime (in minutes), portions (number of servings). ' +
      'The recipe should be simple and achievable with common ingredients.';

    if (this.seed) {
      prompt += ` Use these elements as inspiration: ${this.seed}`;
    }

    return prompt;
  }

  _parseResponse(response) {
    try {
      // Here, response is already a JS object (parsed JSON)
      if (typeof response !== 'object' || response === null) {
        throw new Error('Invalid AI response (not an object)');
      }
      // Basic validation of required fields
      const requiredFields = ['name', 'description', 'type', 'difficulty', 'preparationTime', 'portions'];
      for (const field of requiredFields) {
        if (!response[field]) {
          throw new Error(`Missing field in recipe idea: ${field}`);
        }
      }
      return response;
    } catch (error) {
      throw new Error(`Error parsing response: ${error.message}`);
    }
  }
} 