import Recipe from '../../models/Recipe.js';
import Ingredient from '../../models/Ingredient.js';
import RecipeStep from '../../models/RecipeStep.js';
import MeasurementUnit from '../../models/MeasurementUnit.js';
import Logger from '../logger/index.js';

class DatabaseService {
  constructor() {
    this.logger = new Logger();
  }

  // ==================== RECETTES ====================

  async saveRecipe(recipeData) {
    await this.logger.info('DB_SAVE_RECIPE', `Sauvegarde de la recette: ${recipeData.title}`);

    try {
      const recipe = new Recipe();
      
      // Mapper les données
      recipe.name = recipeData.title;
      recipe.slug = this.generateSlug(recipeData.title);
      recipe.preparationTime = recipeData.preparationTime || 0;
      recipe.bakingTime = recipeData.cookingTime || 0;
      recipe.portions = recipeData.portions || 4;
      recipe.difficulty = recipeData.difficulty || 'Moyen';
      recipe.published = false; // Par défaut non publié
      
      // Valeurs nutritionnelles si présentes
      if (recipeData.nutritionalValues) {
        Object.entries(recipeData.nutritionalValues).forEach(([key, value]) => {
          if (recipe.hasOwnProperty(key)) {
            recipe[key] = value;
          }
        });
      }

      await recipe.save();
      await this.logger.success('DB_SAVE_RECIPE', `Recette sauvegardée avec ID: ${recipe.id}`);
      
      return recipe;
    } catch (error) {
      await this.logger.error('DB_SAVE_RECIPE', error.message);
      throw new Error(`Erreur lors de la sauvegarde de recette: ${error.message}`);
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

  // ==================== INGRÉDIENTS ====================

  async findIngredientByName(name) {
    await this.logger.debug('DB_FIND_INGREDIENT', `Recherche ingrédient: ${name}`);
    
    try {
      // Recherche par nom exact
      let ingredient = await Ingredient.findByName(name);
      
      if (!ingredient) {
        // Recherche par displayName
        const query = new Parse.Query(Ingredient);
        query.equalTo('displayName', name);
        ingredient = await query.first();
      }
      
      if (ingredient) {
        await this.logger.debug('DB_FIND_INGREDIENT', `Ingrédient trouvé: ${ingredient.id}`);
      }
      
      return ingredient;
    } catch (error) {
      await this.logger.error('DB_FIND_INGREDIENT', error.message);
      return null;
    }
  }

  async saveIngredient(ingredientData) {
    await this.logger.info('DB_SAVE_INGREDIENT', `Sauvegarde ingrédient: ${ingredientData.name}`);

    try {
      const ingredient = new Ingredient();
      
      // Mapper toutes les propriétés
      Object.entries(ingredientData).forEach(([key, value]) => {
        if (ingredient.hasOwnProperty(key)) {
          ingredient[key] = value;
        }
      });

      await ingredient.save();
      await this.logger.success('DB_SAVE_INGREDIENT', `Ingrédient sauvegardé avec ID: ${ingredient.id}`);
      
      return ingredient;
    } catch (error) {
      await this.logger.error('DB_SAVE_INGREDIENT', error.message);
      throw new Error(`Erreur lors de la sauvegarde d'ingrédient: ${error.message}`);
    }
  }

  // ==================== ÉTAPES DE RECETTE ====================

  async saveRecipeStep(stepData, recipe) {
    await this.logger.debug('DB_SAVE_STEP', `Sauvegarde étape ${stepData.order} pour recette ${recipe.id}`);

    try {
      const step = new RecipeStep();
      
      // Mapper les données de base
      step.order = stepData.order;
      step.text = stepData.text;
      step.type = stepData.type || 'préparation';
      step.temperature = stepData.temperature;
      step.cookingTime = stepData.cookingTime;
      step.notes = stepData.notes || '';
      step.subSteps = stepData.subSteps || [];
      
      // Relation avec la recette
      step.set('recipe', recipe);
      
      // Gestion des ingrédients référencés dans l'étape
      if (stepData.ingredientRefs && stepData.ingredientRefs.length > 0) {
        const ingredientReferences = [];
        
        for (const ingredientName of stepData.ingredientRefs) {
          const ingredient = await this.findIngredientByName(ingredientName);
          if (ingredient) {
            ingredientReferences.push({
              ingredient: ingredient,
              notes: `Utilisé à l'étape ${stepData.order}`
            });
          }
        }
        
        step.ingredients = ingredientReferences;
      }

      await step.save();
      await this.logger.debug('DB_SAVE_STEP', `Étape sauvegardée avec ID: ${step.id}`);
      
      return step;
    } catch (error) {
      await this.logger.error('DB_SAVE_STEP', error.message);
      throw new Error(`Erreur lors de la sauvegarde d'étape: ${error.message}`);
    }
  }

  // ==================== UTILITAIRES ====================

  generateSlug(title) {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Retirer les accents
      .replace(/[^a-z0-9\s-]/g, '') // Garder seulement lettres, chiffres, espaces et tirets
      .trim()
      .replace(/\s+/g, '-') // Remplacer espaces par tirets
      .replace(/-+/g, '-'); // Éviter les tirets multiples
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