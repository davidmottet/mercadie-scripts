import { OllamaProvider } from '../../providers/ollama.js';
import config from '../../../config/config.js';
import Parse from 'parse/node.js';
import Ingredient from '../../../models/Ingredient.js';
import MeasurementUnit from '../../../models/MeasurementUnit.js';

export class IngredientsGenerator {
  constructor(options = {}) {
    this.ollamaProvider = new OllamaProvider(config.ia.ollama);
    this.sessionToken = null;
    
    // Initialisation de Parse si nécessaire
    if (!Parse.applicationId) {
      Parse.initialize(config.parse.appId, config.parse.jsKey);
      Parse.serverURL = config.parse.serverUrl;
    }
  }

  async _ensureSessionToken() {
    if (!this.sessionToken) {
      try {
        const user = await Parse.User.logIn(
          config.parse.serviceUser.username,
          config.parse.serviceUser.password
        );
        this.sessionToken = user.getSessionToken();
        console.log('✅ Service user logged in successfully:', {
          username: user.get('username'),
          sessionToken: this.sessionToken.substring(0, 10) + '...'
        });
      } catch (error) {
        console.error('❌ Error logging in service user:', error);
        throw new Error('Unable to login with service user');
      }
    }
    return this.sessionToken;
  }

  async generateIngredients(recipeIdea) {
    // Ensure we have a valid session token
    await this._ensureSessionToken();

    const prompt = this._buildPrompt(recipeIdea);
    const response = await this.ollamaProvider.generateCompletion(prompt);
    
    if (!response) {
      throw new Error('No AI response for ingredient generation');
    }

    const ingredientsList = this._parseResponse(response);
    return await this._validateIngredients(ingredientsList);
  }

  _buildPrompt(recipeIdea) {
    return `For the recipe "${recipeIdea.name}" (${recipeIdea.description}), generate a list of ingredients in JSON format.

IMPORTANT: The response MUST be a JSON array of objects, where each object represents an ingredient with exactly these fields:
- name: string (exact ingredient name, e.g. "carrot", "apple", "chicken")
- quantity: number (positive number, e.g. 200, 1.5)
- unit: string (valid measurement unit, e.g. "g", "kg", "ml", "l", "unit")
- notes: string (optional text for details, e.g. "peeled", "diced")

Example of the expected format:
[
  {
    "name": "carrot",
    "quantity": 200,
    "unit": "g",
    "notes": "peeled and diced"
  },
  {
    "name": "onion",
    "quantity": 1,
    "unit": "unit",
    "notes": "finely chopped"
  }
]

Requirements:
1. The response MUST be a JSON array (starting with [ and ending with ])
2. Each ingredient MUST have all required fields (name, quantity, unit)
3. The name field MUST be a string and MUST be the exact ingredient name
4. The quantity field MUST be a positive number
5. The unit field MUST be a valid measurement unit
6. The notes field is optional but MUST be a string if provided

The recipe is for ${recipeIdea.portions} servings. Please ensure all ingredients are common and easily available.`;
  }

  _parseResponse(response) {
    try {
      // Response is already a JSON object, we extract the content directly
      const ingredients = Array.isArray(response) ? response : [response];
      
      // Basic validation
      for (const ing of ingredients) {
        if (!ing.name || typeof ing.name !== 'string') {
          throw new Error('Invalid ingredient name');
        }
        if (!ing.quantity || typeof ing.quantity !== 'number' || ing.quantity <= 0) {
          throw new Error(`Invalid quantity for ingredient ${ing.name}`);
        }
        if (!ing.unit || typeof ing.unit !== 'string') {
          throw new Error(`Invalid measurement unit for ingredient ${ing.name}`);
        }
        if (ing.notes && typeof ing.notes !== 'string') {
          throw new Error(`Invalid notes for ingredient ${ing.name}`);
        }
      }

      return ingredients;
    } catch (error) {
      throw new Error(`Error parsing response: ${error.message}`);
    }
  }

  async _validateIngredients(ingredientsList) {
    const validatedIngredients = [];
    const missingIngredients = [];

    // Initialisation de Parse et connexion service user (copie du test)
    if (!Parse.applicationId) {
      Parse.initialize(config.parse.appId, config.parse.jsKey);
      Parse.serverURL = config.parse.serverUrl;
    }
    let sessionToken;
    try {
      const user = await Parse.User.logIn(
        config.parse.serviceUser.username,
        config.parse.serviceUser.password
      );
      sessionToken = user.getSessionToken();
      // On force l'utilisateur courant pour la durée de la validation
      Parse.User._setCurrentUser(user);
    } catch (error) {
      throw new Error('Unable to login with service user for ingredient validation');
    }

    // Création des classes Parse comme dans le test
    const IngredientClass = Parse.Object.extend('Ingredient');
    const MeasurementUnitClass = Parse.Object.extend('MeasurementUnit');

    for (const ing of ingredientsList) {
      try {
        // Recherche de l'ingrédient par nom
        const query = new Parse.Query(IngredientClass);
        query.equalTo('name', ing.name);
        const ingredient = await query.first({ sessionToken });

        // Recherche de l'unité de mesure par nom
        const unitQuery = new Parse.Query(MeasurementUnitClass);
        unitQuery.equalTo('name', ing.unit);
        const unit = await unitQuery.first({ sessionToken });

        if (ingredient && unit) {
          validatedIngredients.push({
            ingredient,
            quantity: ing.quantity,
            unit,
            notes: ing.notes || ''
          });
        } else {
          missingIngredients.push({
            name: ing.name,
            reason: !ingredient ? 'ingredient not found' : 'measurement unit not found'
          });
        }
      } catch (error) {
        console.error(`Error validating ingredient ${ing.name}:`, error);
        missingIngredients.push({
          name: ing.name,
          reason: 'validation error'
        });
      }
    }

    // Optionnel : nettoyage du contexte utilisateur
    // Parse.User.logOut();

    return {
      validatedIngredients,
      missingIngredients
    };
  }
} 