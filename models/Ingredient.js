import Parse, { BaseModel } from './base.js';
import MeasurementUnit from './MeasurementUnit.js';

class Ingredient extends BaseModel {
  constructor() {
    super('Ingredient');
  }

  // Getters
  get name() { return this.get('name'); }
  get displayName() { return this.get('displayName'); }
  get displayPlural() { return this.get('displayPlural'); }
  get plural() { return this.get('plural'); }
  get type() { return this.get('type'); }
  get frozenOrCanned() { return this.get('frozenOrCanned'); }
  get seasons() { return this.get('seasons'); }
  get withPork() { return this.get('withPork'); }
  get unbreakable() { return this.get('unbreakable'); }
  get ignoreShoppingList() { return this.get('ignoreShoppingList'); }
  get storeShelf() { return this.get('storeShelf'); }
  get quantity() { return this.get('quantity'); }
  get measurementUnit() { return this.get('measurementUnit'); }
  get grossWeight() { return this.get('grossWeight'); }

  // Setters
  set name(value) { this.set('name', value); }
  set displayName(value) { this.set('displayName', value); }
  set displayPlural(value) { this.set('displayPlural', value); }
  set plural(value) { this.set('plural', value); }
  set type(value) { this.set('type', value); }
  set frozenOrCanned(value) { this.set('frozenOrCanned', value); }
  set seasons(value) { this.set('seasons', value); }
  set withPork(value) { this.set('withPork', value); }
  set unbreakable(value) { this.set('unbreakable', value); }
  set ignoreShoppingList(value) { this.set('ignoreShoppingList', value); }
  set storeShelf(value) { this.set('storeShelf', value); }
  set quantity(value) { this.set('quantity', value); }
  set measurementUnit(value) { this.set('measurementUnit', value); }
  set grossWeight(value) { this.set('grossWeight', value); }

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

  static async findByType(type) {
    const query = new Parse.Query(Ingredient);
    query.equalTo('type', type);
    return query.find();
  }

  // Méthodes d'instance
  async save(options = {}, { sessionToken = null } = {}) {
    return super.save(options, { sessionToken });
  }

  async destroy(options = {}, { sessionToken = null } = {}) {
    return super.destroy(options, { sessionToken });
  }

  async setMeasurementUnit(unitName) {
    const unit = await MeasurementUnit.findByName(unitName);
    if (unit) {
      this.set('measurementUnit', unit);
      return true;
    }
    return false;
  }
}

// Enregistrement de la sous-classe
Parse.Object.registerSubclass('Ingredient', Ingredient);

export default Ingredient; 