import AIService from '../ai/index.js';
import DatabaseService from '../db/index.js';
import Logger from '../logger/index.js';

class IngredientResolver {
  constructor() {
    this.aiService = new AIService();
    this.dbService = new DatabaseService();
    this.logger = new Logger();
  }

  async resolveIngredients(rawIngredients) {
    await this.logger.info('INGREDIENT_RESOLVER_START', `Resolving ${rawIngredients.length} ingredients`);

    const resolvedIngredients = [];
    const cache = new Map(); // Cache to avoid duplicates

    for (const rawIngredient of rawIngredients) {
      try {
        const resolved = await this.resolveIngredient(rawIngredient, cache);
        if (resolved) {
          resolvedIngredients.push(resolved);
        }
      } catch (error) {
        await this.logger.warn('INGREDIENT_RESOLVER_SKIP', `Unable to resolve: ${rawIngredient}`, { error: error.message });
      }
    }

    await this.logger.success('INGREDIENT_RESOLVER_COMPLETE', `${resolvedIngredients.length} ingredients resolved`);
    return resolvedIngredients;
  }

  async resolveIngredient(rawIngredient, cache = new Map()) {
    const parsedIngredient = this.parseRawIngredient(rawIngredient);
    const ingredientName = parsedIngredient.name;

    await this.logger.debug('INGREDIENT_RESOLVER_PARSE', `Parsing: "${rawIngredient}" → "${ingredientName}"`);

    // Check cache
    if (cache.has(ingredientName)) {
      return { ...cache.get(ingredientName), ...parsedIngredient };
    }

    // Check database
    let ingredient = await this.dbService.findIngredientByName(ingredientName);

    if (ingredient) {
      await this.logger.debug('INGREDIENT_RESOLVER_FOUND', `Ingredient found in database: ${ingredient.name}`);
      const result = this.mapIngredientFromDB(ingredient, parsedIngredient);
      cache.set(ingredientName, result);
      return result;
    }

    // Create new ingredient via AI
    try {
      const aiIngredientData = await this.aiService.resolveIngredient(ingredientName);
      ingredient = await this.dbService.saveIngredient(aiIngredientData);
      
      await this.logger.success('INGREDIENT_RESOLVER_CREATED', `New ingredient created: ${ingredient.name}`);
      
      const result = this.mapIngredientFromDB(ingredient, parsedIngredient);
      cache.set(ingredientName, result);
      return result;
      
    } catch (error) {
      await this.logger.error('INGREDIENT_RESOLVER_AI_FAILED', `AI failed for ${ingredientName}: ${error.message}`);
      
      // Fallback: create basic ingredient
      const fallbackData = this.createFallbackIngredient(ingredientName);
      ingredient = await this.dbService.saveIngredient(fallbackData);
      
      const result = this.mapIngredientFromDB(ingredient, parsedIngredient);
      cache.set(ingredientName, result);
      return result;
    }
  }

  parseRawIngredient(rawIngredient) {
    const cleaned = rawIngredient.trim();
    
    // Regular expressions to extract quantity, unit and name
    const patterns = [
      /^(\d+(?:[.,]\d+)?)\s*(g|kg|ml|l|cl|tablespoons?|tsp|teaspoons?|cups?|pinches?)\s+(?:of\s+)?(.+)$/i,
      /^(\d+(?:[.,]\d+)?)\s+(.+)$/,
      /^(\d+)\s*(.+)$/,
      /^(.+)$/
    ];

    for (const pattern of patterns) {
      const match = cleaned.match(pattern);
      if (match) {
        if (match.length === 4) {
          // Quantity + unit + name
          return {
            name: this.normalizeIngredientName(match[3]),
            originalText: rawIngredient,
            quantity: parseFloat(match[1].replace(',', '.')),
            unit: this.normalizeUnit(match[2]),
            rawQuantity: match[1],
            rawUnit: match[2]
          };
        } else if (match.length === 3) {
          // Quantity + name (no clear unit)
          return {
            name: this.normalizeIngredientName(match[2]),
            originalText: rawIngredient,
            quantity: parseFloat(match[1].replace(',', '.')),
            unit: 'unit',
            rawQuantity: match[1],
            rawUnit: ''
          };
        } else {
          // Just the name
          return {
            name: this.normalizeIngredientName(match[1]),
            originalText: rawIngredient,
            quantity: null,
            unit: null,
            rawQuantity: '',
            rawUnit: ''
          };
        }
      }
    }

    // Fallback
    return {
      name: this.normalizeIngredientName(cleaned),
      originalText: rawIngredient,
      quantity: null,
      unit: null,
      rawQuantity: '',
      rawUnit: ''
    };
  }

  normalizeIngredientName(name) {
    return name
      .toLowerCase()
      .trim()
      .replace(/^(of\s+|a\s+|an\s+|the\s+)/, '') // Remove articles
      .replace(/\s+/g, ' ')
      .trim();
  }

  normalizeUnit(unit) {
    const unitMap = {
      'g': 'gram',
      'kg': 'kilogram',
      'ml': 'milliliter',
      'cl': 'centiliter',
      'l': 'liter',
      'tbsp': 'tablespoon',
      'tablespoon': 'tablespoon',
      'tablespoons': 'tablespoon',
      'tsp': 'teaspoon',
      'teaspoon': 'teaspoon',
      'teaspoons': 'teaspoon',
      'cup': 'cup',
      'cups': 'cup',
      'pinch': 'pinch',
      'pinches': 'pinch'
    };

    const normalized = unit.toLowerCase().trim();
    return unitMap[normalized] || normalized;
  }

  mapIngredientFromDB(ingredient, parsedData) {
    return {
      id: ingredient.id,
      name: ingredient.name,
      displayName: ingredient.displayName,
      type: ingredient.type,
      quantity: parsedData.quantity,
      unit: parsedData.unit,
      originalText: parsedData.originalText,
      storeShelf: ingredient.storeShelf,
      seasons: ingredient.seasons,
      withPork: ingredient.withPork
    };
  }

  createFallbackIngredient(name) {
    // Ensure we have a valid name
    const normalizedName = name ? name.toLowerCase().trim() : 'unknown ingredient';
    
    return {
      name: normalizedName,
      displayName: normalizedName.charAt(0).toUpperCase() + normalizedName.slice(1),
      displayPlural: normalizedName + 's',
      plural: normalizedName + 's',
      type: 'other',
      frozenOrCanned: false,
      seasons: [],
      withPork: false,
      storeShelf: 'grocery',
      grossWeight: 100
    };
  }

  // Method to group similar ingredients
  groupSimilarIngredients(ingredients) {
    const groups = new Map();

    for (const ingredient of ingredients) {
      const key = ingredient.name;
      if (groups.has(key)) {
        const existing = groups.get(key);
        existing.quantity = (existing.quantity || 0) + (ingredient.quantity || 0);
        existing.occurrences = (existing.occurrences || 1) + 1;
      } else {
        groups.set(key, { ...ingredient, occurrences: 1 });
      }
    }

    return Array.from(groups.values());
  }
}

export default IngredientResolver;