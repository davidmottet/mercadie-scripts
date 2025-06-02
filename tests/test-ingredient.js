import Parse from 'parse/node.js';
import config from '../config/config.js';

async function runTests() {
  console.log('🧪 Starting Ingredient test...');
  
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
    const Ingredient = Parse.Object.extend('Ingredient');
    const MeasurementUnit = Parse.Object.extend('MeasurementUnit');

    // 3. Test de recherche par nom
    console.log('\n3️⃣ Testing findByName...');
    try {
      const query = new Parse.Query(Ingredient);
      query.equalTo('name', 'pomme');
      const ingredient = await query.first({ sessionToken });
      
      if (ingredient) {
        console.log('✅ Found ingredient:', {
          id: ingredient.id,
          name: ingredient.get('name'),
          type: ingredient.get('type'),
          measurementUnit: ingredient.get('measurementUnit')?.get('name')
        });
      } else {
        console.log('ℹ️ No ingredient named "pomme" found');
      }
    } catch (error) {
      console.error('❌ Error finding ingredient by name:', {
        code: error.code,
        message: error.message
      });
    }

    // 4. Test de recherche par type
    console.log('\n4️⃣ Testing findByType...');
    try {
      const query = new Parse.Query(Ingredient);
      query.equalTo('type', 'fruit');
      const ingredients = await query.find({ sessionToken });
      
      console.log(`✅ Found ${ingredients.length} ingredients of type "fruit":`);
      ingredients.forEach(ing => {
        console.log('-', {
          name: ing.get('name'),
          measurementUnit: ing.get('measurementUnit')?.get('name')
        });
      });
    } catch (error) {
      console.error('❌ Error finding ingredients by type:', {
        code: error.code,
        message: error.message
      });
    }

    // 5. Test de création d'un nouvel ingrédient
    console.log('\n5️⃣ Testing ingredient creation...');
    try {
      // D'abord, on récupère une unité de mesure
      const unitQuery = new Parse.Query(MeasurementUnit);
      unitQuery.equalTo('name', 'gram');
      const unit = await unitQuery.first({ sessionToken });

      if (unit) {
        // Création du nouvel ingrédient avec tous les champs requis
        const newIngredient = new Ingredient();
        newIngredient.set({
          name: 'test_ingredient',
          displayName: 'Test Ingredient',
          type: 'test',
          measurementUnit: unit,
          frozenOrCanned: false,  // Champ requis
          withPork: false,        // Valeur par défaut
          unbreakable: false,     // Valeur par défaut
          ignoreShoppingList: false, // Valeur par défaut
          seasons: [],            // Tableau vide par défaut
          storeShelf: 0,          // Nombre au lieu d'une chaîne
          quantity: 1,            // Champ requis
          grossWeight: 0          // Champ requis
        });
        
        const savedIngredient = await newIngredient.save(null, { sessionToken });
        console.log('✅ Created new ingredient:', {
          id: savedIngredient.id,
          name: savedIngredient.get('name'),
          type: savedIngredient.get('type'),
          measurementUnit: savedIngredient.get('measurementUnit')?.get('name'),
          frozenOrCanned: savedIngredient.get('frozenOrCanned')
        });

        // Nettoyage : suppression de l'ingrédient de test
        await savedIngredient.destroy({ sessionToken });
        console.log('✅ Test ingredient cleaned up');
      } else {
        console.log('⚠️ Could not find measurement unit "gram" for test');
      }
    } catch (error) {
      console.error('❌ Error in ingredient creation test:', {
        code: error.code,
        message: error.message
      });
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