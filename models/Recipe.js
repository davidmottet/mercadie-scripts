import Parse, { BaseModel } from './base.js';
import RecipeStep from './RecipeStep.js';

class Recipe extends BaseModel {
  constructor() {
    super('Recipe');
  }

  // Getters
  get name() { return this.get('name'); }
  get slug() { return this.get('slug'); }
  get preparationTime() { return this.get('preparationTime'); }
  get bakingTime() { return this.get('bakingTime'); }
  get restTime() { return this.get('restTime'); }
  get difficulty() { return this.get('difficulty'); }
  get cookingTemperature() { return this.get('cookingTemperature'); }
  get generalTips() { return this.get('generalTips'); }
  get benefits() { return this.get('benefits'); }
  get portions() { return this.get('portions'); }
  get minPortions() { return this.get('minPortions'); }
  get maxPortions() { return this.get('maxPortions'); }
  get mainComponent() { return this.get('mainComponent'); }
  get unbreakable() { return this.get('unbreakable'); }
  get image() { return this.get('image'); }
  get imageAlt() { return this.get('imageAlt'); }
  get coverDesktop() { return this.get('coverDesktop'); }
  get coverMobile() { return this.get('coverMobile'); }
  get coverAlt() { return this.get('coverAlt'); }
  get video() { return this.get('video'); }
  get publicationPlatforms() { return this.get('publicationPlatforms'); }
  get published() { return this.get('published'); }
  get archived() { return this.get('archived'); }
  get recipeCategory() { return this.get('recipeCategory'); }
  get ranking() { return this.get('ranking'); }
  get seasons() { return this.get('seasons'); }
  get express() { return this.get('express'); }
  get familyRecipe() { return this.get('familyRecipe'); }
  get parent() { return this.get('parent'); }
  get tags() { return this.get('tags'); }
  get nutriscore() { return this.get('nutriscore'); }
  get kcalPer100g() { return this.get('kcalPer100g'); }
  get kjPer100g() { return this.get('kjPer100g'); }
  get lipidsPer100g() { return this.get('lipidsPer100g'); }
  get saturatedFattyAcidsPer100g() { return this.get('saturatedFattyAcidsPer100g'); }
  get carbohydratesPer100g() { return this.get('carbohydratesPer100g'); }
  get simpleSugarsPer100g() { return this.get('simpleSugarsPer100g'); }
  get fibresPer100g() { return this.get('fibresPer100g'); }
  get saltPer100g() { return this.get('saltPer100g'); }
  get pnnsFruitPer100g() { return this.get('pnnsFruitPer100g'); }
  get pnnsVegetablePer100g() { return this.get('pnnsVegetablePer100g'); }
  get oilsPer100g() { return this.get('oilsPer100g'); }
  get pnnsNutsPer100g() { return this.get('pnnsNutsPer100g'); }
  get pnnsDriedVegetablePer100g() { return this.get('pnnsDriedVegetablePer100g'); }
  get proteinsPer100g() { return this.get('proteinsPer100g'); }

  // Setters
  set name(value) { this.set('name', value); }
  set slug(value) { this.set('slug', value); }
  set preparationTime(value) { this.set('preparationTime', value); }
  set bakingTime(value) { this.set('bakingTime', value); }
  set restTime(value) { this.set('restTime', value); }
  set difficulty(value) { this.set('difficulty', value); }
  set cookingTemperature(value) { this.set('cookingTemperature', value); }
  set generalTips(value) { this.set('generalTips', value); }
  set benefits(value) { this.set('benefits', value); }
  set portions(value) { this.set('portions', value); }
  set minPortions(value) { this.set('minPortions', value); }
  set maxPortions(value) { this.set('maxPortions', value); }
  set mainComponent(value) { this.set('mainComponent', value); }
  set unbreakable(value) { this.set('unbreakable', value); }
  set image(value) { this.set('image', value); }
  set imageAlt(value) { this.set('imageAlt', value); }
  set coverDesktop(value) { this.set('coverDesktop', value); }
  set coverMobile(value) { this.set('coverMobile', value); }
  set coverAlt(value) { this.set('coverAlt', value); }
  set video(value) { this.set('video', value); }
  set publicationPlatforms(value) { this.set('publicationPlatforms', value); }
  set published(value) { this.set('published', value); }
  set archived(value) { this.set('archived', value); }
  set recipeCategory(value) { this.set('recipeCategory', value); }
  set ranking(value) { this.set('ranking', value); }
  set seasons(value) { this.set('seasons', value); }
  set express(value) { this.set('express', value); }
  set familyRecipe(value) { this.set('familyRecipe', value); }
  set parent(value) { this.set('parent', value); }
  set tags(value) { this.set('tags', value); }
  set nutriscore(value) { this.set('nutriscore', value); }
  set kcalPer100g(value) { this.set('kcalPer100g', value); }
  set kjPer100g(value) { this.set('kjPer100g', value); }
  set lipidsPer100g(value) { this.set('lipidsPer100g', value); }
  set saturatedFattyAcidsPer100g(value) { this.set('saturatedFattyAcidsPer100g', value); }
  set carbohydratesPer100g(value) { this.set('carbohydratesPer100g', value); }
  set simpleSugarsPer100g(value) { this.set('simpleSugarsPer100g', value); }
  set fibresPer100g(value) { this.set('fibresPer100g', value); }
  set saltPer100g(value) { this.set('saltPer100g', value); }
  set pnnsFruitPer100g(value) { this.set('pnnsFruitPer100g', value); }
  set pnnsVegetablePer100g(value) { this.set('pnnsVegetablePer100g', value); }
  set oilsPer100g(value) { this.set('oilsPer100g', value); }
  set pnnsNutsPer100g(value) { this.set('pnnsNutsPer100g', value); }
  set pnnsDriedVegetablePer100g(value) { this.set('pnnsDriedVegetablePer100g', value); }
  set proteinsPer100g(value) { this.set('proteinsPer100g', value); }

  // Méthodes statiques
  static async findBySlug(slug) {
    const query = new Parse.Query(Recipe);
    query.equalTo('slug', slug);
    return query.first();
  }

  static async findByName(name) {
    const query = new Parse.Query(Recipe);
    query.equalTo('name', name);
    return query.first();
  }

  static async findByCategory(category) {
    const query = new Parse.Query(Recipe);
    query.equalTo('recipeCategory', category);
    return query.find();
  }

  static async getAll(options = {}, { sessionToken = null } = {}) {
    return super.getAll(options, { sessionToken });
  }

  static async getPublished() {
    const query = new Parse.Query(Recipe);
    query.equalTo('published', true);
    query.equalTo('archived', false);
    return query.find();
  }

  static async findById(id, { sessionToken = null } = {}) {
    return super.findById(id, { sessionToken });
  }

  // Méthodes d'instance
  async addStep(stepData) {
    const step = new RecipeStep();
    Object.entries(stepData).forEach(([key, value]) => {
      step.set(key, value);
    });
    await step.save();
    return step;
  }

  async getSteps({ sessionToken = null } = {}) {
    const query = new Parse.Query(RecipeStep);
    query.equalTo('recipe', this);
    query.ascending('order');
    return query.find({ sessionToken });
  }

  calculateTotalTime() {
    return (this.preparationTime || 0) + 
           (this.bakingTime || 0) + 
           (this.restTime || 0);
  }

  async updateNutritionalValues(values) {
    Object.entries(values).forEach(([key, value]) => {
      if (this.hasOwnProperty(key)) {
        this.set(key, value);
      }
    });
    await this.save();
  }

  async save(options = {}, { sessionToken = null } = {}) {
    return super.save(options, { sessionToken });
  }

  async destroy(options = {}, { sessionToken = null } = {}) {
    return super.destroy(options, { sessionToken });
  }
}

// Enregistrement de la sous-classe
Parse.Object.registerSubclass('Recipe', Recipe);

export default Recipe; 