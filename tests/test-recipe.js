import Parse from 'parse/node.js';
import config from '../config/config.js';

async function runTests() {
  console.log('🧪 Starting Recipe test...');
  
  try {
    // 1. Initialisation de Parse
    console.log('\n1️⃣ Initializing Parse...');
    Parse.initialize(
      config.parse.appId,
      config.parse.jsKey
    );
    Parse.serverURL = config.parse.serverUrl;
    console.log('✅ Parse initialized with:', {
      appId: config.parse.appId,
      serverUrl: config.parse.serverUrl
    });
    
    // 2. Connexion avec login/mdp et récupération du token
    console.log('\n2️⃣ Logging in...');
    const user = await Parse.User.logIn(
      config.parse.serviceUser.username,
      config.parse.serviceUser.password
    );
    const sessionToken = user.getSessionToken();
    console.log('✅ Login successful, got session token:', sessionToken.substring(0, 10) + '...');

    // Création des classes Parse
    const Recipe = Parse.Object.extend('Recipe');
    const RecipeStep = Parse.Object.extend('RecipeStep');
    const Ingredient = Parse.Object.extend('Ingredient');
    const MeasurementUnit = Parse.Object.extend('MeasurementUnit');

    // 3. Test de recherche de recettes
    console.log('\n3️⃣ Testing recipe search...');
    try {
      // Recherche par nom
      const nameQuery = new Parse.Query(Recipe);
      nameQuery.equalTo('name', 'test_recipe');
      const existingRecipe = await nameQuery.first({ sessionToken });
      
      if (existingRecipe) {
        console.log('ℹ️ Found existing test recipe, cleaning up...');
        await existingRecipe.destroy({ sessionToken });
      }

      // Recherche des recettes publiées
      const publishedQuery = new Parse.Query(Recipe);
      publishedQuery.equalTo('published', true);
      publishedQuery.equalTo('archived', false);
      const publishedRecipes = await publishedQuery.find({ sessionToken });
      
      console.log(`✅ Found ${publishedRecipes.length} published recipes`);
      publishedRecipes.slice(0, 3).forEach(recipe => {
        console.log('-', {
          name: recipe.get('name'),
          category: recipe.get('recipeCategory'),
          portions: recipe.get('portions')
        });
      });
    } catch (error) {
      console.error('❌ Error in recipe search:', {
        code: error.code,
        message: error.message
      });
    }

    // 4. Test de création d'une recette complète
    console.log('\n4️⃣ Testing recipe creation with steps and ingredients...');
    try {
      // Récupération des unités de mesure nécessaires
      const unitQuery = new Parse.Query(MeasurementUnit);
      unitQuery.equalTo('name', 'gram');
      const gramUnit = await unitQuery.first({ sessionToken });

      if (!gramUnit) {
        throw new Error('Could not find gram unit for test');
      }

      // Création d'un ingrédient de test
      console.log('\n4.1️⃣ Creating test ingredient...');
      const testIngredient = new Ingredient();
      testIngredient.set({
        name: 'test_apple',
        displayName: 'Test Apple',
        type: 'fruit',
        measurementUnit: gramUnit,
        frozenOrCanned: false,
        withPork: false,
        unbreakable: false,
        ignoreShoppingList: false,
        seasons: ['summer'],
        storeShelf: 0,
        quantity: 1,
        grossWeight: 100
      });

      const savedIngredient = await testIngredient.save(null, { sessionToken });
      console.log('✅ Created test ingredient:', {
        id: savedIngredient.id,
        name: savedIngredient.get('name'),
        type: savedIngredient.get('type')
      });

      // Création de la recette
      console.log('\n4.2️⃣ Creating recipe...');
      const newRecipe = new Recipe();
      newRecipe.set({
        // Champs de base requis
        name: 'Test Recipe',
        slug: 'test-recipe',
        mainComponent: 'fruit',
        recipeCategory: 'test',
        cookingTemperature: 180,
        portions: 4,
        parent: false,
        
        // Temps (tous requis)
        preparationTime: 30,
        bakingTime: 20,
        restTime: 10,
        
        // Métadonnées
        difficulty: 'easy',
        minPortions: 2,
        maxPortions: 6,
        published: false,
        archived: false,
        seasons: ['summer'],
        express: false,
        familyRecipe: false,
        tags: ['test', 'quick'],
        
        // Images (requises)
        image: 'test-image.jpg',
        imageAlt: 'Test recipe image',
        coverDesktop: 'test-cover-desktop.jpg',
        coverMobile: 'test-cover-mobile.jpg',
        coverAlt: 'Test recipe cover',
        
        // Valeurs nutritionnelles (requises)
        nutriscore: 'A',
        kcalPer100g: 150,
        kjPer100g: 630,
        lipidsPer100g: 5,
        saturatedFattyAcidsPer100g: 1,
        carbohydratesPer100g: 20,
        simpleSugarsPer100g: 5,
        fibresPer100g: 3,
        saltPer100g: 0.5,
        proteinsPer100g: 8,
        
        // PNNS (requis)
        pnnsFruitPer100g: 10,
        pnnsVegetablePer100g: 20,
        oilsPer100g: 5,
        pnnsNutsPer100g: 0,
        pnnsDriedVegetablePer100g: 0,
        
        // Autres champs
        generalTips: 'Test tips',
        benefits: 'Test benefits: healthy and quick to prepare',
        video: 'test-video.mp4',
        publicationPlatforms: ['test'],
        ranking: '0',
        unbreakable: false
      });

      // Sauvegarde de la recette
      const savedRecipe = await newRecipe.save(null, { sessionToken });
      console.log('✅ Created recipe:', {
        id: savedRecipe.id,
        name: savedRecipe.get('name'),
        totalTime: (savedRecipe.get('preparationTime') || 0) + 
                  (savedRecipe.get('bakingTime') || 0) + 
                  (savedRecipe.get('restTime') || 0)  // Calcul manuel du temps total
      });

      // Création des étapes
      console.log('\n4.3️⃣ Creating recipe steps...');
      const steps = [
        {
          order: 1,
          text: 'Préparer les ingrédients',
          type: 'preparation',
          ingredients: [{
            ingredient: savedIngredient,  // Utilisation de l'ingrédient créé
            quantity: 2,
            unit: gramUnit,
            notes: 'Couper en morceaux'
          }]
        },
        {
          order: 2,
          text: 'Cuire les ingrédients',
          type: 'cooking',
          cookingTime: 20,
          temperature: 180
        }
      ];

      // Ajout des étapes
      for (const stepData of steps) {
        const step = new RecipeStep();
        step.set({
          recipe: savedRecipe,
          ...stepData
        });
        await step.save(null, { sessionToken });
        console.log('✅ Added step:', {
          order: step.get('order'),
          type: step.get('type')
        });
      }

      // Vérification des étapes
      const stepsQuery = new Parse.Query(RecipeStep);
      stepsQuery.equalTo('recipe', savedRecipe);
      stepsQuery.ascending('order');
      const recipeSteps = await stepsQuery.find({ sessionToken });
      console.log(`✅ Recipe has ${recipeSteps.length} steps`);

      // Test de mise à jour des valeurs nutritionnelles
      savedRecipe.set({
        kcalPer100g: 160,
        kjPer100g: 670
      });
      await savedRecipe.save(null, { sessionToken });
      console.log('✅ Updated nutritional values');

      // Nettoyage : suppression de la recette et de l'ingrédient de test
      console.log('\n4.4️⃣ Cleaning up...');
      
      // 1. Suppression des étapes de la recette
      const cleanupStepsQuery = new Parse.Query(RecipeStep);
      cleanupStepsQuery.equalTo('recipe', savedRecipe);
      const stepsToDelete = await cleanupStepsQuery.find({ sessionToken });
      console.log(`ℹ️ Found ${stepsToDelete.length} steps to delete`);
      
      for (const step of stepsToDelete) {
        await step.destroy({ sessionToken });
      }
      console.log('✅ Deleted all recipe steps');
      
      // 2. Suppression de la recette
      await savedRecipe.destroy({ sessionToken });
      console.log('✅ Deleted recipe');
      
      // 3. Suppression de l'ingrédient de test
      await savedIngredient.destroy({ sessionToken });
      console.log('✅ Deleted test ingredient');

    } catch (error) {
      console.error('❌ Error in recipe creation test:', {
        code: error.code,
        message: error.message
      });
      throw error;
    }

  } catch (error) {
    console.error('❌ Test failed:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
}

// Exécution du test
runTests().catch(error => {
  console.error('❌ Test failed:', {
    message: error.message,
    code: error.code,
    stack: error.stack
  });
  process.exit(1);
}); 