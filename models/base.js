import Parse from 'parse/node.js';
import { ensureServiceUserLoggedIn, initializeParse } from '../config/parseConfig.js';

// Initialiser Parse avec la configuration
initializeParse();

// Wrapper pour s'assurer que l'utilisateur est connecté avant chaque opération
const originalSave = Parse.Object.prototype.save;
Parse.Object.prototype.save = async function(...args) {
  const className = this.className;
  console.log(`🔄 Saving ${className} object:`, {
    id: this.id || 'new',
    timestamp: new Date().toISOString()
  });
  
  await ensureServiceUserLoggedIn();
  try {
    const result = await originalSave.apply(this, args);
    console.log(`✅ ${className} saved successfully:`, {
      id: result.id,
      timestamp: new Date().toISOString()
    });
    return result;
  } catch (error) {
    console.error(`❌ Error saving ${className}:`, {
      id: this.id || 'new',
      code: error.code,
      message: error.message,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
};

const originalDestroy = Parse.Object.prototype.destroy;
Parse.Object.prototype.destroy = async function(...args) {
  const className = this.className;
  console.log(`🔄 Destroying ${className} object:`, {
    id: this.id,
    timestamp: new Date().toISOString()
  });
  
  await ensureServiceUserLoggedIn();
  try {
    const result = await originalDestroy.apply(this, args);
    console.log(`✅ ${className} destroyed successfully:`, {
      id: this.id,
      timestamp: new Date().toISOString()
    });
    return result;
  } catch (error) {
    console.error(`❌ Error destroying ${className}:`, {
      id: this.id,
      code: error.code,
      message: error.message,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
};

// Wrapper pour les requêtes
const originalFind = Parse.Query.prototype.find;
Parse.Query.prototype.find = async function(...args) {
  const className = this.className;
  console.log(`🔄 Finding ${className} objects:`, {
    limit: this._limit,
    skip: this._skip,
    timestamp: new Date().toISOString()
  });
  
  await ensureServiceUserLoggedIn();
  try {
    const results = await originalFind.apply(this, args);
    console.log(`✅ Found ${results.length} ${className} objects:`, {
      timestamp: new Date().toISOString()
    });
    return results;
  } catch (error) {
    console.error(`❌ Error finding ${className} objects:`, {
      code: error.code,
      message: error.message,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
};

const originalFirst = Parse.Query.prototype.first;
Parse.Query.prototype.first = async function(...args) {
  const className = this.className;
  console.log(`🔄 Finding first ${className} object:`, {
    timestamp: new Date().toISOString()
  });
  
  await ensureServiceUserLoggedIn();
  try {
    const result = await originalFirst.apply(this, args);
    console.log(`✅ Found first ${className} object:`, {
      id: result?.id || 'none',
      timestamp: new Date().toISOString()
    });
    return result;
  } catch (error) {
    console.error(`❌ Error finding first ${className} object:`, {
      code: error.code,
      message: error.message,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
};

class BaseModel extends Parse.Object {
  constructor(className) {
    super(className);
  }

  // Méthodes statiques communes
  static async getAll(options = {}, { sessionToken = null } = {}) {
    const query = new Parse.Query(this);
    query.ascending('name');
    
    // Ajout des options de requête si spécifiées
    if (options.limit) query.limit(options.limit);
    if (options.skip) query.skip(options.skip);
    
    // Exécution de la requête avec le token de session
    return query.find({ sessionToken });
  }

  static async findByName(name, { sessionToken = null } = {}) {
    const query = new Parse.Query(this);
    query.equalTo('name', name);
    return query.first({ sessionToken });
  }

  static async findById(id, { sessionToken = null } = {}) {
    const query = new Parse.Query(this);
    return query.get(id, { sessionToken });
  }

  // Méthodes d'instance
  async save(options = {}, { sessionToken = null } = {}) {
    return super.save(null, { ...options, sessionToken });
  }

  async destroy(options = {}, { sessionToken = null } = {}) {
    return super.destroy({ ...options, sessionToken });
  }
}

export default Parse;
export { BaseModel }; 