import AIService from '../ai/index.js';
import Logger from '../logger/index.js';

class StepEnhancer {
  constructor() {
    this.aiService = new AIService();
    this.logger = new Logger();
  }

  async enhanceSteps(recipeData, resolvedIngredients) {
    await this.logger.info('STEP_ENHANCER_START', `Enrichissement des étapes pour: ${recipeData.title}`);

    try {
      // Préparer les données pour l'IA
      const ingredientsList = resolvedIngredients.map(ing => ({
        name: ing.name,
        displayName: ing.displayName,
        quantity: ing.quantity,
        unit: ing.unit,
        type: ing.type
      }));

      // Appeler l'IA pour enrichir les étapes
      const enhancedSteps = await this.aiService.enhanceSteps(
        recipeData.title,
        recipeData.description,
        ingredientsList,
        recipeData.rawSteps
      );

      // Post-traiter les étapes
      const processedSteps = this.postProcessSteps(enhancedSteps, resolvedIngredients);

      await this.logger.success('STEP_ENHANCER_COMPLETE', `${processedSteps.length} étapes enrichies`);
      return processedSteps;

    } catch (error) {
      await this.logger.error('STEP_ENHANCER_ERROR', error.message);
      
      // Fallback: créer des étapes basiques
      const fallbackSteps = this.createFallbackSteps(recipeData.rawSteps);
      await this.logger.warn('STEP_ENHANCER_FALLBACK', `Utilisation du fallback avec ${fallbackSteps.length} étapes`);
      return fallbackSteps;
    }
  }

  postProcessSteps(enhancedSteps, resolvedIngredients) {
    return enhancedSteps.map((step, index) => {
      // Valider et nettoyer les données
      const processedStep = {
        order: step.order || (index + 1),
        text: this.cleanStepText(step.text),
        type: this.validateStepType(step.type),
        temperature: this.validateTemperature(step.temperature),
        cookingTime: this.validateCookingTime(step.cookingTime),
        notes: step.notes || '',
        subSteps: Array.isArray(step.subSteps) ? step.subSteps : [],
        ingredientRefs: this.validateIngredientRefs(step.ingredientRefs, resolvedIngredients),
        toolsUsed: Array.isArray(step.toolsUsed) ? step.toolsUsed : []
      };

      // Enrichir avec des métadonnées
      processedStep.estimatedDuration = this.estimateStepDuration(processedStep);
      processedStep.difficulty = this.assessStepDifficulty(processedStep);

      return processedStep;
    });
  }

  cleanStepText(text) {
    if (!text || typeof text !== 'string') return '';
    
    return text
      .trim()
      .replace(/\s+/g, ' ') // Normaliser les espaces
      .replace(/^\d+\.?\s*/, '') // Retirer numérotation éventuelle
      .charAt(0).toUpperCase() + text.slice(1); // Première lettre en majuscule
  }

  validateStepType(type) {
    const validTypes = ['préparation', 'cuisson', 'repos', 'assemblage', 'finition'];
    return validTypes.includes(type) ? type : 'préparation';
  }

  validateTemperature(temperature) {
    if (!temperature) return null;
    const temp = parseInt(temperature);
    return (temp > 0 && temp <= 300) ? temp : null;
  }

  validateCookingTime(cookingTime) {
    if (!cookingTime) return null;
    const time = parseInt(cookingTime);
    return (time > 0 && time <= 480) ? time : null; // Max 8h
  }

  validateIngredientRefs(ingredientRefs, resolvedIngredients) {
    if (!Array.isArray(ingredientRefs)) return [];
    
    const availableIngredients = new Set(resolvedIngredients.map(ing => ing.name));
    return ingredientRefs.filter(ref => availableIngredients.has(ref));
  }

  estimateStepDuration(step) {
    // Estimation basée sur le type d'étape et les mots-clés
    const baseDurations = {
      'préparation': 5,
      'cuisson': 15,
      'repos': 30,
      'assemblage': 10,
      'finition': 5
    };

    let duration = baseDurations[step.type] || 5;

    // Ajustements basés sur le contenu
    if (step.cookingTime) {
      duration = Math.max(duration, step.cookingTime);
    }

    const text = step.text.toLowerCase();
    if (text.includes('fouet') || text.includes('mélang')) duration += 3;
    if (text.includes('hach') || text.includes('coupe')) duration += 5;
    if (text.includes('mijot') || text.includes('réduire')) duration += 10;

    return Math.max(1, Math.min(duration, 120)); // Entre 1 et 120 minutes
  }

  assessStepDifficulty(step) {
    let difficulty = 1; // Facile par défaut

    const text = step.text.toLowerCase();
    
    // Techniques avancées
    if (text.includes('tempér') || text.includes('émulsio')) difficulty += 2;
    if (text.includes('flamb') || text.includes('caramé')) difficulty += 2;
    if (text.includes('clarifi') || text.includes('monte')) difficulty += 1;
    
    // Précision requise
    if (step.temperature && step.temperature > 200) difficulty += 1;
    if (step.cookingTime && step.cookingTime > 60) difficulty += 1;
    
    // Outils spécialisés
    if (step.toolsUsed.includes('mandoline') || step.toolsUsed.includes('thermomix')) {
      difficulty += 1;
    }

    return Math.min(difficulty, 5); // Max 5
  }

  createFallbackSteps(rawSteps) {
    if (!Array.isArray(rawSteps)) return [];

    return rawSteps.map((step, index) => ({
      order: index + 1,
      text: typeof step === 'string' ? step : 'Étape de préparation',
      type: 'préparation',
      temperature: null,
      cookingTime: null,
      notes: '',
      subSteps: [],
      ingredientRefs: [],
      toolsUsed: [],
      estimatedDuration: 10,
      difficulty: 2
    }));
  }

  // Méthode pour analyser la cohérence des étapes
  analyzeStepCoherence(steps) {
    const analysis = {
      totalDuration: 0,
      averageDifficulty: 0,
      stepTypes: {},
      warnings: []
    };

    if (!steps.length) {
      analysis.warnings.push('Aucune étape définie');
      return analysis;
    }

    // Calculer les métriques
    analysis.totalDuration = steps.reduce((sum, step) => sum + (step.estimatedDuration || 0), 0);
    analysis.averageDifficulty = steps.reduce((sum, step) => sum + (step.difficulty || 1), 0) / steps.length;

    // Compter les types d'étapes
    steps.forEach(step => {
      analysis.stepTypes[step.type] = (analysis.stepTypes[step.type] || 0) + 1;
    });

    // Détecter les incohérences
    if (analysis.totalDuration > 300) {
      analysis.warnings.push('Durée totale très longue (>5h)');
    }

    if (analysis.averageDifficulty > 4) {
      analysis.warnings.push('Recette très complexe');
    }

    // Vérifier l'ordre logique
    const hasPreparation = analysis.stepTypes['préparation'] > 0;
    const hasCuisson = analysis.stepTypes['cuisson'] > 0;
    
    if (hasCuisson && !hasPreparation) {
      analysis.warnings.push('Cuisson sans préparation préalable');
    }

    return analysis;
  }
}

export default StepEnhancer;