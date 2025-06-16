import { OllamaProvider } from '../../providers/ollama.js';
import config from '../../../config/config.js';
import RecipeStep from '../../../models/RecipeStep.js';

export class StepsGenerator {
  constructor(options = {}) {
    this.ollamaProvider = new OllamaProvider(config.ia.ollama);
    this.sessionToken = options.sessionToken;
  }

  async generateSteps(recipeIdea, validatedIngredients) {
    const prompt = this._buildPrompt(recipeIdea, validatedIngredients);
    const response = await this.ollamaProvider.generateCompletion(prompt);
    
    if (!response) {
      throw new Error('No AI response for steps generation');
    }

    const stepsList = this._parseResponse(response);
    return await this._createRecipeSteps(stepsList, validatedIngredients);
  }

  _buildPrompt(recipeIdea, validatedIngredients) {
    const ingredientsList = validatedIngredients.map(ing => 
      `${ing.quantity} ${ing.unit.get('name')} of ${ing.ingredient.get('name')}`
    ).join(', ');

    return `For the recipe "${recipeIdea.name}" (${recipeIdea.description}), ` +
      `with the following ingredients: ${ingredientsList}, ` +
      `generate the preparation steps in JSON format. ` +
      `Each step must have: order (step number), text (detailed description), ` +
      `type (preparation, cooking, resting), cookingTime (in minutes, if applicable), ` +
      `temperature (in degrees, if applicable), notes (optional notes). ` +
      `The recipe is ${recipeIdea.difficulty} difficulty and for ${recipeIdea.portions} servings.`;
  }

  _parseResponse(response) {
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Invalid response format');
      }
      
      const steps = JSON.parse(jsonMatch[0]);
      
      // Basic validation
      for (const step of steps) {
        if (!step.order || !step.text || !step.type) {
          throw new Error('Invalid step format');
        }
      }

      return steps;
    } catch (error) {
      throw new Error(`Error parsing response: ${error.message}`);
    }
  }

  async _createRecipeSteps(stepsList, validatedIngredients) {
    const recipeSteps = [];

    for (const stepData of stepsList) {
      const step = new RecipeStep();
      
      // Copy basic data
      step.set('order', stepData.order);
      step.set('text', stepData.text);
      step.set('type', stepData.type);
      if (stepData.cookingTime) step.set('cookingTime', stepData.cookingTime);
      if (stepData.temperature) step.set('temperature', stepData.temperature);
      if (stepData.notes) step.set('notes', stepData.notes);

      // Add ingredients mentioned in the step
      const stepIngredients = this._extractIngredientsFromStep(stepData.text, validatedIngredients);
      if (stepIngredients.length > 0) {
        step.set('ingredients', stepIngredients);
      }

      recipeSteps.push(step);
    }

    return recipeSteps;
  }

  _extractIngredientsFromStep(stepText, validatedIngredients) {
    const stepIngredients = [];
    
    for (const ing of validatedIngredients) {
      const ingName = ing.ingredient.get('name').toLowerCase();
      if (stepText.toLowerCase().includes(ingName)) {
        stepIngredients.push({
          ingredient: ing.ingredient,
          quantity: ing.quantity,
          unit: ing.unit,
          notes: ing.notes
        });
      }
    }

    return stepIngredients;
  }
} 