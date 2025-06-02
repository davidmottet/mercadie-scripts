import Parse from 'parse/node.js';
import config from './config.js';

export function initializeParse() {
  console.log('🔄 Initializing Parse with config:', {
    appId: config.parse.appId,
    serverUrl: config.parse.serverUrl,
    // On ne log pas les clés sensibles
  });
  
  Parse.initialize(
    config.parse.appId,
    config.parse.jsKey,
    config.parse.masterKey
  );
  Parse.serverURL = config.parse.serverUrl;
  console.log('✅ Parse initialized successfully');
}

export async function loginServiceUser() {
  console.log('🔄 Attempting to log in service user:', config.parse.serviceUser.username);
  try {
    const user = await Parse.User.logIn(
      config.parse.serviceUser.username,
      config.parse.serviceUser.password
    );
    console.log('✅ Service user logged in successfully:', {
      username: user.get('username'),
      sessionToken: user.getSessionToken()?.substring(0, 10) + '...' // On ne log que le début du token
    });
    return user;
  } catch (error) {
    console.error('❌ Error logging in service user:', {
      code: error.code,
      message: error.message,
      username: config.parse.serviceUser.username
    });
    throw error;
  }
}

export async function testParseConnection() {
  console.log('🔄 Testing Parse Server connection...');
  try {
    // Login avec l'utilisateur de service
    const user = await ensureServiceUserLoggedIn();
    if (!user) {
      throw new Error('Failed to authenticate service user');
    }
    
    // Test de connexion avec une requête simple
    console.log('🔄 Executing test query...');
    const TestObject = Parse.Object.extend('TestObject');
    const query = new Parse.Query(TestObject);
    const results = await query.limit(1).find();
    
    console.log('✅ Parse Server connection test successful:', {
      resultsCount: results.length,
      timestamp: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('❌ Parse Server connection test failed:', {
      code: error.code,
      message: error.message,
      timestamp: new Date().toISOString()
    });
    return false;
  }
}

// Fonction utilitaire pour s'assurer que l'utilisateur de service est connecté
export async function ensureServiceUserLoggedIn() {
  try {
    const currentUser = Parse.User.current();
    if (!currentUser) {
      console.log('⚠️ No current user found, logging in service user...');
      return await loginServiceUser(); // Retourner directement l'utilisateur connecté
    }
    
    // Vérifier si le token de session est toujours valide
    try {
      await Parse.User.become(currentUser.getSessionToken());
      console.log('✅ Service user already logged in:', {
        username: currentUser.get('username'),
        sessionToken: currentUser.getSessionToken()?.substring(0, 10) + '...'
      });
      return currentUser;
    } catch (error) {
      console.log('⚠️ Session expired, logging in again...');
      return await loginServiceUser(); // Retourner le nouvel utilisateur connecté
    }
  } catch (error) {
    console.error('❌ Error in ensureServiceUserLoggedIn:', {
      code: error.code,
      message: error.message
    });
    throw error;
  }
} 