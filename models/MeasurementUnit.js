import Parse from './base.js';

class MeasurementUnit extends Parse.Object {
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
  static async findByName(name) {
    const query = new Parse.Query(MeasurementUnit);
    query.equalTo('name', name);
    return query.first();
  }

  static async getAll() {
    const query = new Parse.Query(MeasurementUnit);
    query.ascending('name');
    return query.find();
  }
}

// Enregistrement de la sous-classe
Parse.Object.registerSubclass('MeasurementUnit', MeasurementUnit);

export default MeasurementUnit; 