import { getAIProvider } from '../../providers/index.js';
import { 
  generateRecipePrompt, 
  resolveIngredientPrompt, 
  enhanceStepsPrompt, 
  computeNutritionPrompt 
} from './prompts.js';
import Logger from '../logger/index.js';

class AIService {
  constructor(providerName = 'ollama') {
    this.provider = getAIProvider(providerName);
    this.logger = new Logger();
  }

  async generateRecipe(target) {
    await this.logger.info('AI_GENERATE_RECIPE', `Génération de recette pour: ${target}`);
    
    try {
      const prompt = generateRecipePrompt(target);
      const response = await this.provider.generateCompletion(prompt);
      
      // Parser la réponse JSON
      const cleanResponse = this.cleanJsonResponse(response);
      const recipeData = JSON.parse(cleanResponse);
      
      await this.logger.success('AI_GENERATE_RECIPE', 'Recette générée avec succès', recipeData);
      return recipeData;
    } catch (error) {
      await this.logger.error('AI_GENERATE_RECIPE', `Erreur: ${error.message}`);
      throw new Error(`Erreur lors de la génération de recette: ${error.message}`);
    }
  }

  async resolveIngredient(ingredientName) {
    await this.logger.info('AI_RESOLVE_INGREDIENT', `Résolution de l'ingrédient: ${ingredientName}`);
    
    try {
      const prompt = resolveIngredientPrompt(ingredientName);
      const response = await this.provider.generateCompletion(prompt);
      
      const cleanResponse = this.cleanJsonResponse(response);
      const ingredientData = JSON.parse(cleanResponse);
      
      await this.logger.success('AI_RESOLVE_INGREDIENT', 'Ingrédient résolu', ingredientData);
      return ingredientData;
    } catch (error) {
      await this.logger.error('AI_RESOLVE_INGREDIENT', `Erreur: ${error.message}`);
      throw new Error(`Erreur lors de la résolution d'ingrédient: ${error.message}`);
    }
  }

  async enhanceSteps(title, description, ingredients, rawSteps) {
    await this.logger.info('AI_ENHANCE_STEPS', 'Enrichissement des étapes de recette');
    
    try {
      const prompt = enhanceStepsPrompt(title, description, ingredients, rawSteps);
      const response = await this.provider.generateCompletion(prompt);
      
      const cleanResponse = this.cleanJsonResponse(response);
      const stepsData = JSON.parse(cleanResponse);
      
      await this.logger.success('AI_ENHANCE_STEPS', 'Étapes enrichies avec succès', { stepCount: stepsData.steps.length });
      return stepsData.steps;
    } catch (error) {
      await this.logger.error('AI_ENHANCE_STEPS', `Erreur: ${error.message}`);
      throw new Error(`Erreur lors de l'enrichissement des étapes: ${error.message}`);
    }
  }

  async computeNutrition(ingredients, portions) {
    await this.logger.info('AI_COMPUTE_NUTRITION', `Calcul nutrition pour ${portions} portions`);
    
    try {
      const prompt = computeNutritionPrompt(ingredients, portions);
      const response = await this.provider.generateCompletion(prompt);
      
      const cleanResponse = this.cleanJsonResponse(response);
      const nutritionData = JSON.parse(cleanResponse);
      
      await this.logger.success('AI_COMPUTE_NUTRITION', 'Valeurs nutritionnelles calculées', nutritionData);
      return nutritionData.nutritionalValues;
    } catch (error) {
      await this.logger.error('AI_COMPUTE_NUTRITION', `Erreur: ${error.message}`);
      throw new Error(`Erreur lors du calcul nutritionnel: ${error.message}`);
    }
  }

  cleanJsonResponse(response) {
    // Nettoie la réponse pour extraire le JSON pur
    let cleaned = response.trim();
    
    // Retire les éventuels backticks markdown
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/```\s*$/, '');
    cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '');
    
    // Trouve le premier { et le dernier }
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
    
    return cleaned;
  }
}

export default AIService;