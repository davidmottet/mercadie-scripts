import Parse, { BaseModel } from './base.js';

class MeasurementUnit extends BaseModel {
  constructor() {
    super('MeasurementUnit');
  }

  // Getters
  get name() {
    return this.get('name');
  }

  // Setters
  set name(value) {
    this.set('name', value);
  }

  // Méthodes statiques
  static async getAll(options = {}, { sessionToken = null } = {}) {
    return super.getAll(options, { sessionToken });
  }

  static async findByName(name, { sessionToken = null } = {}) {
    return super.findByName(name, { sessionToken });
  }

  static async findById(id, { sessionToken = null } = {}) {
    return super.findById(id, { sessionToken });
  }

  // Méthodes d'instance
  async save(options = {}, { sessionToken = null } = {}) {
    return super.save(options, { sessionToken });
  }

  async destroy(options = {}, { sessionToken = null } = {}) {
    return super.destroy(options, { sessionToken });
  }
}

// Enregistrement de la sous-classe
Parse.Object.registerSubclass('MeasurementUnit', MeasurementUnit);

export default MeasurementUnit; 