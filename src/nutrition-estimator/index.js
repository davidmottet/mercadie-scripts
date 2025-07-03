import AIService from '../ai/index.js';
import Logger from '../logger/index.js';

class NutritionEstimator {
  constructor() {
    this.aiService = new AIService();
    this.logger = new Logger();
  }

  async estimateNutrition(resolvedIngredients, portions) {
    await this.logger.info('NUTRITION_ESTIMATOR_START', `Calcul nutrition pour ${portions} portions`);

    try {
      // Préparer les données pour l'IA
      const ingredientsWithQuantities = resolvedIngredients.map(ing => ({
        name: ing.displayName,
        quantity: ing.quantity,
        unit: ing.unit,
        type: ing.type
      }));

      // Appeler l'IA pour calculer la nutrition
      const nutritionalValues = await this.aiService.computeNutrition(
        ingredientsWithQuantities,
        portions
      );

      // Valider et ajuster les valeurs
      const validatedValues = this.validateNutritionalValues(nutritionalValues);

      await this.logger.success('NUTRITION_ESTIMATOR_COMPLETE', 'Valeurs nutritionnelles calculées', validatedValues);
      return validatedValues;

    } catch (error) {
      await this.logger.error('NUTRITION_ESTIMATOR_ERROR', error.message);
      
      // Fallback: valeurs par défaut
      const fallbackValues = this.createFallbackNutrition();
      await this.logger.warn('NUTRITION_ESTIMATOR_FALLBACK', 'Utilisation des valeurs par défaut');
      return fallbackValues;
    }
  }

  validateNutritionalValues(values) {
    const validated = { ...values };
    
    // Valeurs par défaut et limites
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