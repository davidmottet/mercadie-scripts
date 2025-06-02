import Parse from './base.js';
import Ingredient from './Ingredient.js';
import MeasurementUnit from './MeasurementUnit.js';

class RecipeStep extends Parse.Object {
  constructor() {
    super('RecipeStep');
  }

  // Getters
  get order() { return this.get('order'); }
  get text() { return this.get('text'); }
  get type() { return this.get('type'); }
  get temperature() { return this.get('temperature'); }
  get cookingTime() { return this.get('cookingTime'); }
  get notes() { return this.get('notes'); }
  get subSteps() { return this.get('subSteps'); }
  get image() { return this.get('image'); }
  get imageAlt() { return this.get('imageAlt'); }
  get familyProfile() { return this.get('familyProfile'); }
  get video() { return this.get('video'); }
  get ingredients() { return this.get('ingredients'); }

  // Setters
  set order(value) { this.set('order', value); }
  set text(value) { this.set('text', value); }
  set type(value) { this.set('type', value); }
  set temperature(value) { this.set('temperature', value); }
  set cookingTime(value) { this.set('cookingTime', value); }
  set notes(value) { this.set('notes', value); }
  set subSteps(value) { this.set('subSteps', value); }
  set image(value) { this.set('image', value); }
  set imageAlt(value) { this.set('imageAlt', value); }
  set familyProfile(value) { this.set('familyProfile', value); }
  set video(value) { this.set('video', value); }
  set ingredients(value) { this.set('ingredients', value); }

  // Méthodes statiques
  static async findByOrder(order) {
    const query = new Parse.Query(RecipeStep);
    query.equalTo('order', order);
    return query.first();
  }

  static async getAll() {
    const query = new Parse.Query(RecipeStep);
    query.ascending('order');
    return query.find();
  }

  // Méthodes d'instance
  async addIngredient(ingredientName, quantity, unitName, notes = '') {
    const ingredient = await Ingredient.findByName(ingredientName);
    const unit = await MeasurementUnit.findByName(unitName);
    
    if (!ingredient || !unit) {
      return false;
    }

    const ingredients = this.get('ingredients') || [];
    ingredients.push({
      ingredient: ingredient,
      quantity: quantity,
      unit: unit,
      notes: notes
    });
    
    this.set('ingredients', ingredients);
    return true;
  }

  async removeIngredient(ingredientName) {
    const ingredients = this.get('ingredients') || [];
    const filteredIngredients = ingredients.filter(ing => 
      ing.ingredient.get('name') !== ingredientName
    );
    this.set('ingredients', filteredIngredients);
  }
}

// Enregistrement de la sous-classe
Parse.Object.registerSubclass('RecipeStep', RecipeStep);

export default RecipeStep; 