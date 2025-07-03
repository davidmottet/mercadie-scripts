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
    await this.logger.info('INGREDIENT_RESOLVER_START', `Résolution de ${rawIngredients.length} ingrédients`);

    const resolvedIngredients = [];
    const cache = new Map(); // Cache pour éviter les doublons

    for (const rawIngredient of rawIngredients) {
      try {
        const resolved = await this.resolveIngredient(rawIngredient, cache);
        if (resolved) {
          resolvedIngredients.push(resolved);
        }
      } catch (error) {
        await this.logger.warn('INGREDIENT_RESOLVER_SKIP', `Impossible de résoudre: ${rawIngredient}`, { error: error.message });
      }
    }

    await this.logger.success('INGREDIENT_RESOLVER_COMPLETE', `${resolvedIngredients.length} ingrédients résolus`);
    return resolvedIngredients;
  }

  async resolveIngredient(rawIngredient, cache = new Map()) {
    const parsedIngredient = this.parseRawIngredient(rawIngredient);
    const ingredientName = parsedIngredient.name;

    await this.logger.debug('INGREDIENT_RESOLVER_PARSE', `Parsing: "${rawIngredient}" → "${ingredientName}"`);

    // Vérifier le cache
    if (cache.has(ingredientName)) {
      return { ...cache.get(ingredientName), ...parsedIngredient };
    }

    // Vérifier en base de données
    let ingredient = await this.dbService.findIngredientByName(ingredientName);

    if (ingredient) {
      await this.logger.debug('INGREDIENT_RESOLVER_FOUND', `Ingrédient trouvé en base: ${ingredient.name}`);
      const result = this.mapIngredientFromDB(ingredient, parsedIngredient);
      cache.set(ingredientName, result);
      return result;
    }

    // Créer un nouvel ingrédient via IA
    try {
      const aiIngredientData = await this.aiService.resolveIngredient(ingredientName);
      ingredient = await this.dbService.saveIngredient(aiIngredientData);
      
      await this.logger.success('INGREDIENT_RESOLVER_CREATED', `Nouvel ingrédient créé: ${ingredient.name}`);
      
      const result = this.mapIngredientFromDB(ingredient, parsedIngredient);
      cache.set(ingredientName, result);
      return result;
      
    } catch (error) {
      await this.logger.error('INGREDIENT_RESOLVER_AI_FAILED', `Échec IA pour ${ingredientName}: ${error.message}`);
      
      // Fallback: créer un ingrédient basique
      const fallbackData = this.createFallbackIngredient(ingredientName);
      ingredient = await this.dbService.saveIngredient(fallbackData);
      
      const result = this.mapIngredientFromDB(ingredient, parsedIngredient);
      cache.set(ingredientName, result);
      return result;
    }
  }

  parseRawIngredient(rawIngredient) {
    const cleaned = rawIngredient.trim();
    
    // Expressions régulières pour extraire quantité, unité et nom
    const patterns = [
      /^(\d+(?:[.,]\d+)?)\s*(g|kg|ml|l|cl|cuillères?|c\.?\s*à\s*s|c\.?\s*à\s*c|tasses?|pincées?)\s+(?:de\s+)?(.+)$/i,
      /^(\d+(?:[.,]\d+)?)\s+(.+)$/,
      /^(\d+)\s*(.+)$/,
      /^(.+)$/
    ];

    for (const pattern of patterns) {
      const match = cleaned.match(pattern);
      if (match) {
        if (match.length === 4) {
          // Quantité + unité + nom
          return {
            name: this.normalizeIngredientName(match[3]),
            originalText: rawIngredient,
            quantity: parseFloat(match[1].replace(',', '.')),
            unit: this.normalizeUnit(match[2]),
            rawQuantity: match[1],
            rawUnit: match[2]
          };
        } else if (match.length === 3) {
          // Quantité + nom (sans unité claire)
          return {
            name: this.normalizeIngredientName(match[2]),
            originalText: rawIngredient,
            quantity: parseFloat(match[1].replace(',', '.')),
            unit: 'unité',
            rawQuantity: match[1],
            rawUnit: ''
          };
        } else {
          // Juste le nom
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
      .replace(/^(de\s+|d'|du\s+|des\s+|la\s+|le\s+|les\s+)/, '') // Retirer articles
      .replace(/\s+/g, ' ')
      .trim();
  }

  normalizeUnit(unit) {
    const unitMap = {
      'g': 'gramme',
      'kg': 'kilogramme',
      'ml': 'millilitre',
      'cl': 'centilitre',
      'l': 'litre',
      'c. à s': 'cuillère à soupe',
      'c.à.s': 'cuillère à soupe',
      'cuillère': 'cuillère à soupe',
      'cuillères': 'cuillère à soupe',
      'c. à c': 'cuillère à café',
      'c.à.c': 'cuillère à café',
      'tasse': 'tasse',
      'tasses': 'tasse',
      'pincée': 'pincée',
      'pincées': 'pincée'
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
    return {
      name: name,
      displayName: name.charAt(0).toUpperCase() + name.slice(1),
      displayPlural: name + 's',
      plural: name + 's',
      type: 'autre',
      frozenOrCanned: false,
      seasons: [],
      withPork: false,
      storeShelf: 'épicerie',
      grossWeight: 100
    };
  }

  // Méthode pour regrouper les ingrédients similaires
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