import AIService from '../ai/index.js';
import Logger from '../logger/index.js';

class NutritionEstimator {
  constructor() {
    this.aiService = new AIService();
    this.logger = new Logger();
  }

  async estimateNutrition(resolvedIngredients, portions) {
    await this.logger.info('NUTRITION_ESTIMATOR_START', `Calculating nutrition for ${portions} portions`);

    try {
      // Prepare data for AI
      const ingredientsWithQuantities = resolvedIngredients.map(ing => ({
        name: ing.displayName,
        quantity: ing.quantity,
        unit: ing.unit,
        type: ing.type
      }));

      // Call AI to calculate nutrition
      const nutritionalValues = await this.aiService.computeNutrition(
        ingredientsWithQuantities,
        portions
      );

      // Validate and adjust values
      const validatedValues = this.validateNutritionalValues(nutritionalValues);

      await this.logger.success('NUTRITION_ESTIMATOR_COMPLETE', 'Nutritional values calculated', validatedValues);
      return validatedValues;

    } catch (error) {
      await this.logger.error('NUTRITION_ESTIMATOR_ERROR', error.message);
      
      // Fallback: default values
      const fallbackValues = this.createFallbackNutrition();
      await this.logger.warn('NUTRITION_ESTIMATOR_FALLBACK', 'Using default values');
      return fallbackValues;
    }
  }

  validateNutritionalValues(values) {
    const validated = { ...values };
    
    // Default values and limits
    const defaults = {
      kcalPer100g: 200,
      kjPer100g: 837,
      proteinsPer100g: 8,
      lipidsPer100g: 10,
      carbohydratesPer100g: 25,
      fibresPer100g: 3,
      saltPer100g: 1
    };

    Object.keys(defaults).forEach(key => {
      if (!validated[key] || validated[key] < 0 || validated[key] > 1000) {
        validated[key] = defaults[key];
      }
    });

    return validated;
  }

  createFallbackNutrition() {
    return {
      kcalPer100g: 200,
      kjPer100g: 837,
      proteinsPer100g: 8,
      lipidsPer100g: 10,
      carbohydratesPer100g: 25,
      fibresPer100g: 3,
      saltPer100g: 1
    };
  }
}

export default NutritionEstimator;