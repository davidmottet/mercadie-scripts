import ScraperService from './scraper/index.js';
import AIService from './ai/index.js';
import DatabaseService from './db/index.js';
import IngredientResolver from './ingredient-resolver/index.js';
import StepEnhancer from './step-enhancer/index.js';
import NutritionEstimator from './nutrition-estimator/index.js';
import Logger from './logger/index.js';

class RecipeEnricher {
  constructor() {
    this.scraperService = new ScraperService();
    this.aiService = new AIService();
    this.dbService = new DatabaseService();
    this.ingredientResolver = new IngredientResolver();
    this.stepEnhancer = new StepEnhancer();
    this.nutritionEstimator = new NutritionEstimator();
    this.logger = new Logger();
  }

  async enrichRecipe(source, input) {
    const enrichmentId = `enrichment-${Date.now()}`;
    await this.logger.info('ENRICHMENT_START', `Démarrage enrichissement ${enrichmentId}`, { source, input });

    try {
      // Étape 1: Récupération de la recette brute
      const rawRecipe = await this.getRawRecipe(source, input);
      await this.logger.success('STEP_1_COMPLETE', 'Recette brute récupérée', { title: rawRecipe.title });

      // Étape 2: Résolution des ingrédients
      const resolvedIngredients = await this.ingredientResolver.resolveIngredients(rawRecipe.rawIngredients);
      await this.logger.success('STEP_2_COMPLETE', `${resolvedIngredients.length} ingrédients résolus`);

      // Étape 3: Enrichissement des étapes
      const enhancedSteps = await this.stepEnhancer.enhanceSteps(rawRecipe, resolvedIngredients);
      await this.logger.success('STEP_3_COMPLETE', `${enhancedSteps.length} étapes enrichies`);

      // Étape 4: Calcul nutritionnel
      const nutritionalValues = await this.nutritionEstimator.estimateNutrition(
        resolvedIngredients, 
        rawRecipe.portions
      );
      await this.logger.success('STEP_4_COMPLETE', 'Valeurs nutritionnelles calculées');

      // Étape 5: Sauvegarde complète
      const savedRecipe = await this.saveCompleteRecipe({
        ...rawRecipe,
        nutritionalValues
      }, resolvedIngredients, enhancedSteps);

      await this.logger.success('ENRICHMENT_COMPLETE', `Recette enrichie sauvegardée: ${savedRecipe.id}`);

      return {
        success: true,
        recipeId: savedRecipe.id,
        recipe: savedRecipe,
        ingredientsCount: resolvedIngredients.length,
        stepsCount: enhancedSteps.length,
        enrichmentId
      };

    } catch (error) {
      await this.logger.error('ENRICHMENT_FAILED', error.message);
      throw new Error(`Échec de l'enrichissement: ${error.message}`);
    }
  }

  async getRawRecipe(source, input) {
    switch (source) {
      case 'scraping':
        return await this.scraperService.scrapeRecipe(input);
      
      case 'IA':
      case 'ai':
        const generatedRecipe = await this.aiService.generateRecipe(input);
        return {
          ...generatedRecipe,
          source: 'IA',
          sourceInput: input
        };
      
      default:
        throw new Error(`Source non supportée: ${source}`);
    }
  }

  async saveCompleteRecipe(recipeData, ingredients, steps) {
    // Sauvegarder la recette principale
    const recipe = await this.dbService.saveRecipe(recipeData);

    // Sauvegarder toutes les étapes
    for (const stepData of steps) {
      await this.dbService.saveRecipeStep(stepData, recipe);
    }

    return recipe;
  }

  async getEnrichmentStats() {
    return await this.dbService.getStats();
  }
}

export default RecipeEnricher;