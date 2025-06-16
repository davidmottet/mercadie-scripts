import { OllamaProvider } from '../../providers/ollama.js';
import config from '../../../config/config.js';
import Recipe from '../../../models/Recipe.js';

export class RecipeEnricher {
  constructor(options = {}) {
    this.ollamaProvider = new OllamaProvider(config.ia.ollama);
    this.sessionToken = options.sessionToken;
  }

  async enrichRecipe(recipeIdea, validatedIngredients, recipeSteps) {
    const prompt = this._buildPrompt(recipeIdea, validatedIngredients, recipeSteps);
    const response = await this.ollamaProvider.generateCompletion(prompt);
    
    if (!response) {
      throw new Error('Pas de réponse de l\'IA pour l\'enrichissement de la recette');
    }

    const enrichmentData = this._parseResponse(response);
    return this._createEnrichedRecipe(recipeIdea, validatedIngredients, recipeSteps, enrichmentData);
  }

  _buildPrompt(recipeIdea, validatedIngredients, recipeSteps) {
    const ingredientsList = validatedIngredients.map(ing => 
      `${ing.quantity} ${ing.unit.get('name')} de ${ing.ingredient.get('name')}`
    ).join(', ');

    const stepsList = recipeSteps.map(step => 
      `${step.get('order')}. ${step.get('text')}`
    ).join('\n');

    return `Pour la recette "${recipeIdea.name}" (${recipeIdea.description}), ` +
      `avec les ingrédients suivants : ${ingredientsList}, ` +
      `et les étapes suivantes :\n${stepsList}\n\n` +
      `Génère des informations complémentaires au format JSON avec les champs suivants : ` +
      `generalTips (conseils généraux), benefits (bénéfices nutritionnels), ` +
      `nutriscore (A à E), kcalPer100g, kjPer100g, lipidsPer100g, ` +
      `saturatedFattyAcidsPer100g, carbohydratesPer100g, simpleSugarsPer100g, ` +
      `fibresPer100g, proteinsPer100g, saltPer100g, ` +
      `pnnsFruitPer100g, pnnsVegetablePer100g, oilsPer100g, ` +
      `pnnsNutsPer100g, pnnsDriedVegetablePer100g. ` +
      `Les valeurs nutritionnelles doivent être réalistes pour ce type de recette.`;
  }

  _parseResponse(response) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Format de réponse invalide');
      }
      
      const enrichment = JSON.parse(jsonMatch[0]);
      
      // Validation des champs nutritionnels
      const nutritionalFields = [
        'kcalPer100g', 'kjPer100g', 'lipidsPer100g', 'saturatedFattyAcidsPer100g',
        'carbohydratesPer100g', 'simpleSugarsPer100g', 'fibresPer100g',
        'proteinsPer100g', 'saltPer100g', 'pnnsFruitPer100g', 'pnnsVegetablePer100g',
        'oilsPer100g', 'pnnsNutsPer100g', 'pnnsDriedVegetablePer100g'
      ];

      for (const field of nutritionalFields) {
        if (typeof enrichment[field] !== 'number' || enrichment[field] < 0) {
          throw new Error(`Valeur nutritionnelle invalide pour ${field}`);
        }
      }

      if (!enrichment.nutriscore || !['A', 'B', 'C', 'D', 'E'].includes(enrichment.nutriscore)) {
        throw new Error('Nutri-Score invalide');
      }

      return enrichment;
    } catch (error) {
      throw new Error(`Erreur lors du parsing de la réponse : ${error.message}`);
    }
  }

  _createEnrichedRecipe(recipeIdea, validatedIngredients, recipeSteps, enrichmentData) {
    const recipe = new Recipe();

    // Données de base de la recette
    recipe.set('name', recipeIdea.name);
    recipe.set('slug', this._generateSlug(recipeIdea.name));
    recipe.set('description', recipeIdea.description);
    recipe.set('type', recipeIdea.type);
    recipe.set('difficulty', recipeIdea.difficulty);
    recipe.set('preparationTime', recipeIdea.preparationTime);
    recipe.set('portions', recipeIdea.portions);
    recipe.set('published', false);
    recipe.set('archived', false);

    // Données enrichies
    recipe.set('generalTips', enrichmentData.generalTips);
    recipe.set('benefits', enrichmentData.benefits);
    recipe.set('nutriscore', enrichmentData.nutriscore);
    
    // Valeurs nutritionnelles
    const nutritionalFields = [
      'kcalPer100g', 'kjPer100g', 'lipidsPer100g', 'saturatedFattyAcidsPer100g',
      'carbohydratesPer100g', 'simpleSugarsPer100g', 'fibresPer100g',
      'proteinsPer100g', 'saltPer100g', 'pnnsFruitPer100g', 'pnnsVegetablePer100g',
      'oilsPer100g', 'pnnsNutsPer100g', 'pnnsDriedVegetablePer100g'
    ];

    for (const field of nutritionalFields) {
      recipe.set(field, enrichmentData[field]);
    }

    // Calcul des temps totaux
    const totalTime = recipeSteps.reduce((total, step) => {
      return total + (step.get('cookingTime') || 0);
    }, recipeIdea.preparationTime);

    recipe.set('bakingTime', totalTime - recipeIdea.preparationTime);

    return recipe;
  }

  _generateSlug(name) {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
} 