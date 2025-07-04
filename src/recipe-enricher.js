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
    await this.logger.info('ENRICHMENT_START', `Starting enrichment ${enrichmentId}`, { source, input });

    try {
      // Step 1: Get raw recipe
      const rawRecipe = await this.getRawRecipe(source, input);
      await this.logger.success('STEP_1_COMPLETE', 'Raw recipe retrieved', { title: rawRecipe.title });

      // Step 2: Resolve ingredients
      const resolvedIngredients = await this.ingredientResolver.resolveIngredients(rawRecipe.rawIngredients);
      await this.logger.success('STEP_2_COMPLETE', `${resolvedIngredients.length} ingredients resolved`);

      // Step 3: Enhance steps
      const enhancedSteps = await this.stepEnhancer.enhanceSteps(rawRecipe, resolvedIngredients);
      await this.logger.success('STEP_3_COMPLETE', `${enhancedSteps.length} steps enhanced`);

      // Step 4: Calculate nutrition
      const nutritionalValues = await this.nutritionEstimator.estimateNutrition(
        resolvedIngredients, 
        rawRecipe.portions
      );
      await this.logger.success('STEP_4_COMPLETE', 'Nutritional values calculated');

      // Step 5: Complete save
      const savedRecipe = await this.saveCompleteRecipe({
        ...rawRecipe,
        nutritionalValues
      }, resolvedIngredients, enhancedSteps);

      await this.logger.success('ENRICHMENT_COMPLETE', `Enriched recipe saved: ${savedRecipe.id}`);

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
      throw new Error(`Enrichment failed: ${error.message}`);
    }
  }

  async getRawRecipe(source, input) {
    switch (source) {
      case 'scraping':
        return await this.scraperService.scrapeRecipe(input);
      
      case 'AI':
      case 'ai':
        const generatedRecipe = await this.aiService.generateRecipe(input);
        return {
          ...generatedRecipe,
          source: 'AI',
          sourceInput: input
        };
      
      default:
        throw new Error(`Unsupported source: ${source}`);
    }
  }

  async saveCompleteRecipe(recipeData, ingredients, steps) {
    // Save main recipe
    const recipe = await this.dbService.saveRecipe(recipeData);

    // Save all steps
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