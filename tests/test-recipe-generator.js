import { RecipeGenerator } from '../src/generators/RecipeGenerator.js';

async function main() {
  try {
    console.log('🧪 Test du générateur de recettes');
    
    const generator = new RecipeGenerator();
    
    // Optionnel : on peut fournir un seed pour influencer la génération
    const options = {
      seed: 'Une recette végétarienne simple avec des légumes de saison'
    };
    
    const result = await generator.generateRecipe(options);
    
    console.log('\n📝 Résumé de la recette générée :');
    console.log('----------------------------------------');
    console.log(`Nom : ${result.recipe.get('name')}`);
    console.log(`Description : ${result.recipe.get('description')}`);
    console.log(`Type : ${result.recipe.get('type')}`);
    console.log(`Difficulté : ${result.recipe.get('difficulty')}`);
    console.log(`Temps de préparation : ${result.recipe.get('preparationTime')} minutes`);
    console.log(`Temps de cuisson : ${result.recipe.get('bakingTime')} minutes`);
    console.log(`Portions : ${result.recipe.get('portions')}`);
    console.log(`Nutri-Score : ${result.recipe.get('nutriscore')}`);
    console.log('\nIngrédients :');
    result.ingredients.forEach(ing => {
      console.log(`- ${ing.quantity} ${ing.unit.get('name')} de ${ing.ingredient.get('name')}`);
    });
    
    if (result.missingIngredients.length > 0) {
      console.log('\n⚠️ Ingrédients manquants :');
      result.missingIngredients.forEach(ing => {
        console.log(`- ${ing.name} (${ing.reason})`);
      });
    }
    
    console.log('\nÉtapes :');
    result.steps.forEach(step => {
      console.log(`\n${step.get('order')}. ${step.get('text')}`);
      if (step.get('cookingTime')) {
        console.log(`   Temps : ${step.get('cookingTime')} minutes`);
      }
      if (step.get('temperature')) {
        console.log(`   Température : ${step.get('temperature')}°C`);
      }
      if (step.get('notes')) {
        console.log(`   Notes : ${step.get('notes')}`);
      }
    });
    
    console.log('\n✅ Test terminé avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors du test :', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    process.exit(1);
  }
}

// Exécution du test
main(); 