import Parse from 'parse/node.js';
import config from '../../config/config.js';
import { RecipeIdeaGenerator } from './steps/RecipeIdeaGenerator.js';
import { IngredientsGenerator } from './steps/IngredientsGenerator.js';
import { StepsGenerator } from './steps/StepsGenerator.js';
import { RecipeEnricher } from './steps/RecipeEnricher.js';

export class RecipeGenerator {
  constructor(options = {}) {
    this.options = options;
    this.sessionToken = null;
    
    // Initialisation de Parse
    if (!Parse.applicationId) {
      Parse.initialize(config.parse.appId, config.parse.jsKey);
      Parse.serverURL = config.parse.serverUrl;
    }
  }

  async login() {
    try {
      const user = await Parse.User.logIn(
        config.parse.serviceUser.username,
        config.parse.serviceUser.password
      );
      this.sessionToken = user.getSessionToken();
      console.log('✅ Connexion Parse réussie');
      return true;
    } catch (error) {
      console.error('❌ Erreur de connexion Parse:', error);
      throw error;
    }
  }

  async generateRecipe(options = {}) {
    if (!this.sessionToken) {
      await this.login();
    }

    try {
      console.log('🧪 Démarrage de la génération de recette...');

      // 1. Génération de l'idée de recette
      console.log('\n1️⃣ Génération de l\'idée de recette...');
      const ideaGenerator = new RecipeIdeaGenerator({ seed: options.seed });
      const recipeIdea = await ideaGenerator.generateIdea();
      console.log('✅ Idée de recette générée:', recipeIdea);

      // 2. Génération et validation des ingrédients
      console.log('\n2️⃣ Génération des ingrédients...');
      const ingredientsGenerator = new IngredientsGenerator({ sessionToken: this.sessionToken });
      const { validatedIngredients, missingIngredients } = await ingredientsGenerator.generateIngredients(recipeIdea);
      
      if (missingIngredients.length > 0) {
        console.warn('⚠️ Ingrédients manquants:', missingIngredients);
      }
      console.log(`✅ ${validatedIngredients.length} ingrédients validés`);

      // 3. Génération des étapes
      console.log('\n3️⃣ Génération des étapes...');
      const stepsGenerator = new StepsGenerator({ sessionToken: this.sessionToken });
      const recipeSteps = await stepsGenerator.generateSteps(recipeIdea, validatedIngredients);
      console.log(`✅ ${recipeSteps.length} étapes générées`);

      // 4. Enrichissement de la recette
      console.log('\n4️⃣ Enrichissement de la recette...');
      const recipeEnricher = new RecipeEnricher({ sessionToken: this.sessionToken });
      const recipe = await recipeEnricher.enrichRecipe(recipeIdea, validatedIngredients, recipeSteps);
      console.log('✅ Recette enrichie avec les informations nutritionnelles');

      // 5. Sauvegarde de la recette et des étapes
      console.log('\n5️⃣ Sauvegarde de la recette...');
      await recipe.save(null, { sessionToken: this.sessionToken });
      
      for (const step of recipeSteps) {
        step.set('recipe', recipe);
        await step.save(null, { sessionToken: this.sessionToken });
      }
      console.log('✅ Recette et étapes sauvegardées');

      return {
        recipe,
        steps: recipeSteps,
        ingredients: validatedIngredients,
        missingIngredients
      };

    } catch (error) {
      console.error('❌ Erreur lors de la génération de la recette:', error);
      throw error;
    }
  }
} 