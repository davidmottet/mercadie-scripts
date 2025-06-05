import Parse from 'parse/node.js';
import config from '../config/config.js';

async function runTests() {
  console.log('🧪 Starting MeasurementUnit test...');
  
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

    // 3. Recherche de l'unité "gram" avec le session token
    console.log('\n3️⃣ Searching for "gram" unit...');
    // Création directe de la classe sans passer par le wrapper
    const MeasurementUnit = Parse.Object.extend('MeasurementUnit');
    const query = new Parse.Query(MeasurementUnit);
    query.equalTo('name', 'gram');
    
    console.log('🔍 Executing query with session token...');
    try {
    const unit = await query.first({ sessionToken });
    
    if (unit) {
      console.log('✅ Found unit:', {
        id: unit.id,
        name: unit.get('name')
      });
    } else {
      console.log('ℹ️ No unit named "gram" found');
      }
    } catch (error) {
      console.error('❌ Error finding unit:', {
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