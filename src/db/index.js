import Recipe from '../../models/Recipe.js';
import Ingredient from '../../models/Ingredient.js';
import RecipeStep from '../../models/RecipeStep.js';
import MeasurementUnit from '../../models/MeasurementUnit.js';
import Logger from '../logger/index.js';

class DatabaseService {
  constructor() {
    this.logger = new Logger();
  }

  // ==================== RECIPES ====================

  async saveRecipe(recipeData) {
    await this.logger.info('DB_SAVE_RECIPE', `Saving recipe: ${recipeData.title}`);

    try {
      const recipe = new Recipe();
      
      // Map data
      recipe.name = recipeData.title;
      recipe.slug = this.generateSlug(recipeData.title);
      recipe.preparationTime = recipeData.preparationTime || 0;
      recipe.bakingTime = recipeData.cookingTime || 0;
      recipe.portions = recipeData.portions || 4;
      recipe.difficulty = recipeData.difficulty || 'Medium';
      recipe.published = false; // Not published by default
      
      // Nutritional values if present
      if (recipeData.nutritionalValues) {
        Object.entries(recipeData.nutritionalValues).forEach(([key, value]) => {
          if (recipe.hasOwnProperty(key)) {
            recipe[key] = value;
          }
        });
      }

      await recipe.save();
      await this.logger.success('DB_SAVE_RECIPE', `Recipe saved with ID: ${recipe.id}`);
      
      return recipe;
    } catch (error) {
      await this.logger.error('DB_SAVE_RECIPE', error.message);
      throw new Error(`Error saving recipe: ${error.message}`);
    }
  }

  async findRecipeByName(name) {
    try {
      return await Recipe.findByName(name);
    } catch (error) {
      await this.logger.error('DB_FIND_RECIPE', error.message);
      return null;
    }
  }

  // ==================== INGREDIENTS ====================

  async findIngredientByName(name) {
    await this.logger.debug('DB_FIND_INGREDIENT', `Searching ingredient: ${name}`);
    
    try {
      // Search by exact name
      let ingredient = await Ingredient.findByName(name);
      
      if (!ingredient) {
        // Search by displayName
        const query = new Parse.Query(Ingredient);
        query.equalTo('displayName', name);
        ingredient = await query.first();
      }
      
      if (ingredient) {
        await this.logger.debug('DB_FIND_INGREDIENT', `Ingredient found: ${ingredient.id}`);
      }
      
      return ingredient;
    } catch (error) {
      await this.logger.error('DB_FIND_INGREDIENT', error.message);
      return null;
    }
  }

  async saveIngredient(ingredientData) {
    // Validate required fields
    if (!ingredientData.name || ingredientData.name.trim() === '') {
      throw new Error('Ingredient name is required');
    }

    await this.logger.info('DB_SAVE_INGREDIENT', `Saving ingredient: ${ingredientData.name}`);

    try {
      const ingredient = new Ingredient();
      
      // Map all properties
      Object.entries(ingredientData).forEach(([key, value]) => {
        if (ingredient.hasOwnProperty(key)) {
          ingredient[key] = value;
        }
      });

      await ingredient.save();
      await this.logger.success('DB_SAVE_INGREDIENT', `Ingredient saved with ID: ${ingredient.id}`);
      
      return ingredient;
    } catch (error) {
      await this.logger.error('DB_SAVE_INGREDIENT', error.message);
      throw new Error(`Error saving ingredient: ${error.message}`);
    }
  }

  // ==================== RECIPE STEPS ====================

  async saveRecipeStep(stepData, recipe) {
    await this.logger.debug('DB_SAVE_STEP', `Saving step ${stepData.order} for recipe ${recipe.id}`);

    try {
      const step = new RecipeStep();
      
      // Map basic data
      step.order = stepData.order;
      step.text = stepData.text;
      step.type = stepData.type || 'preparation';
      step.temperature = stepData.temperature;
      step.cookingTime = stepData.cookingTime;
      step.notes = stepData.notes || '';
      step.subSteps = stepData.subSteps || [];
      
      // Relation with recipe
      step.set('recipe', recipe);
      
      // Handle ingredients referenced in the step
      if (stepData.ingredientRefs && stepData.ingredientRefs.length > 0) {
        const ingredientReferences = [];
        
        for (const ingredientName of stepData.ingredientRefs) {
          const ingredient = await this.findIngredientByName(ingredientName);
          if (ingredient) {
            ingredientReferences.push({
              ingredient: ingredient,
              notes: `Used at step ${stepData.order}`
            });
          }
        }
        
        step.ingredients = ingredientReferences;
      }

      await step.save();
      await this.logger.debug('DB_SAVE_STEP', `Step saved with ID: ${step.id}`);
      
      return step;
    } catch (error) {
      await this.logger.error('DB_SAVE_STEP', error.message);
      throw new Error(`Error saving step: ${error.message}`);
    }
  }

  // ==================== UTILITIES ====================

  generateSlug(title) {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9\s-]/g, '') // Keep only letters, numbers, spaces and dashes
      .trim()
      .replace(/\s+/g, '-') // Replace spaces with dashes
      .replace(/-+/g, '-'); // Avoid multiple dashes
  }

  async getStats() {
    try {
      const recipeQuery = new Parse.Query(Recipe);
      const ingredientQuery = new Parse.Query(Ingredient);
      const stepQuery = new Parse.Query(RecipeStep);

      const [recipeCount, ingredientCount, stepCount] = await Promise.all([
        recipeQuery.count(),
        ingredientQuery.count(),
        stepQuery.count()
      ]);

      return {
        recipes: recipeCount,
        ingredients: ingredientCount,
        steps: stepCount
      };
    } catch (error) {
      await this.logger.error('DB_STATS', error.message);
      return { recipes: 0, ingredients: 0, steps: 0 };
    }
  }
}

export default DatabaseService;