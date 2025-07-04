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
    await this.logger.info('AI_GENERATE_RECIPE', `Generating recipe for: ${target}`);
    
    try {
      const prompt = generateRecipePrompt(target);
      const response = await this.provider.generateCompletion(prompt);
      
      const recipeData = response;
      
      await this.logger.success('AI_GENERATE_RECIPE', 'Recipe generated successfully', recipeData);
      return recipeData;
    } catch (error) {
      await this.logger.error('AI_GENERATE_RECIPE', `Error: ${error.message}`);
      throw new Error(`Error generating recipe: ${error.message}`);
    }
  }

  async resolveIngredient(ingredientName) {
    await this.logger.info('AI_RESOLVE_INGREDIENT', `Resolving ingredient: ${ingredientName}`);
    
    try {
      const prompt = resolveIngredientPrompt(ingredientName);
      const response = await this.provider.generateCompletion(prompt);
      
      const ingredientData = response;
      
      if (!ingredientData.name || ingredientData.name.trim() === '') {
        throw new Error(`AI response missing required 'name' field for ingredient: ${ingredientName}`);
      }
      
      await this.logger.success('AI_RESOLVE_INGREDIENT', 'Ingredient resolved', ingredientData);
      return ingredientData;
    } catch (error) {
      await this.logger.error('AI_RESOLVE_INGREDIENT', `Error: ${error.message}`);
      throw new Error(`Error resolving ingredient: ${error.message}`);
    }
  }

  async enhanceSteps(title, description, ingredients, rawSteps) {
    await this.logger.info('AI_ENHANCE_STEPS', 'Enhancing recipe steps');
    
    try {
      const prompt = enhanceStepsPrompt(title, description, ingredients, rawSteps);
      const response = await this.provider.generateCompletion(prompt);
      
      const stepsData = response;
      
      await this.logger.success('AI_ENHANCE_STEPS', 'Steps enhanced successfully', { stepCount: stepsData.steps.length });
      return stepsData.steps;
    } catch (error) {
      await this.logger.error('AI_ENHANCE_STEPS', `Error: ${error.message}`);
      throw new Error(`Error enhancing steps: ${error.message}`);
    }
  }

  async computeNutrition(ingredients, portions) {
    await this.logger.info('AI_COMPUTE_NUTRITION', `Calculating nutrition for ${portions} portions`);
    
    try {
      const prompt = computeNutritionPrompt(ingredients, portions);
      const response = await this.provider.generateCompletion(prompt);
      
      const nutritionData = response;
      
      await this.logger.success('AI_COMPUTE_NUTRITION', 'Nutritional values calculated', nutritionData);
      return nutritionData.nutritionalValues;
    } catch (error) {
      await this.logger.error('AI_COMPUTE_NUTRITION', `Error: ${error.message}`);
      throw new Error(`Error calculating nutrition: ${error.message}`);
    }
  }

  cleanJsonResponse(response) {
    if (typeof response === 'object' && response !== null) {
      return response;
    }
    
    if (typeof response === 'string') {
      let cleaned = response.trim();
      
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/```\s*$/, '');
      cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '');
      
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      
      if (firstBrace !== -1 && lastBrace !== -1) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1);
      }
      
      return cleaned;
    }
    
    throw new Error('Invalid response from AI provider');
  }
}

export default AIService;