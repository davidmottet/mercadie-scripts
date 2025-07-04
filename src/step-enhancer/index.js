import AIService from '../ai/index.js';
import Logger from '../logger/index.js';

class StepEnhancer {
  constructor() {
    this.aiService = new AIService();
    this.logger = new Logger();
  }

  async enhanceSteps(recipeData, resolvedIngredients) {
    await this.logger.info('STEP_ENHANCER_START', `Enhancing steps for: ${recipeData.title}`);

    try {
      // Prepare data for AI
      const ingredientsList = resolvedIngredients.map(ing => ({
        name: ing.name,
        displayName: ing.displayName,
        quantity: ing.quantity,
        unit: ing.unit,
        type: ing.type
      }));

      // Call AI to enhance steps
      const enhancedSteps = await this.aiService.enhanceSteps(
        recipeData.title,
        recipeData.description,
        ingredientsList,
        recipeData.rawSteps
      );

      // Post-process steps
      const processedSteps = this.postProcessSteps(enhancedSteps, resolvedIngredients);

      await this.logger.success('STEP_ENHANCER_COMPLETE', `${processedSteps.length} steps enhanced`);
      return processedSteps;

    } catch (error) {
      await this.logger.error('STEP_ENHANCER_ERROR', error.message);
      
      // Fallback: create basic steps
      const fallbackSteps = this.createFallbackSteps(recipeData.rawSteps);
      await this.logger.warn('STEP_ENHANCER_FALLBACK', `Using fallback with ${fallbackSteps.length} steps`);
      return fallbackSteps;
    }
  }

  postProcessSteps(enhancedSteps, resolvedIngredients) {
    return enhancedSteps.map((step, index) => {
      // Validate and clean data
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

      // Enrich with metadata
      processedStep.estimatedDuration = this.estimateStepDuration(processedStep);
      processedStep.difficulty = this.assessStepDifficulty(processedStep);

      return processedStep;
    });
  }

  cleanStepText(text) {
    if (!text || typeof text !== 'string') return '';
    
    return text
      .trim()
      .replace(/\s+/g, ' ') // Normalize spaces
      .replace(/^\d+\.?\s*/, '') // Remove numbering if present
      .charAt(0).toUpperCase() + text.slice(1); // First letter uppercase
  }

  validateStepType(type) {
    const validTypes = ['preparation', 'cooking', 'resting', 'assembly', 'finishing'];
    return validTypes.includes(type) ? type : 'preparation';
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
    // Estimation based on step type and keywords
    const baseDurations = {
      'preparation': 5,
      'cooking': 15,
      'resting': 30,
      'assembly': 10,
      'finishing': 5
    };

    let duration = baseDurations[step.type] || 5;

    // Adjustments based on content
    if (step.cookingTime) {
      duration = Math.max(duration, step.cookingTime);
    }

    const text = step.text.toLowerCase();
    if (text.includes('whisk') || text.includes('mix')) duration += 3;
    if (text.includes('chop') || text.includes('cut')) duration += 5;
    if (text.includes('simmer') || text.includes('reduce')) duration += 10;

    return Math.max(1, Math.min(duration, 120)); // Between 1 and 120 minutes
  }

  assessStepDifficulty(step) {
    let difficulty = 1; // Easy by default

    const text = step.text.toLowerCase();
    
    // Advanced techniques
    if (text.includes('temper') || text.includes('emuls')) difficulty += 2;
    if (text.includes('flamb') || text.includes('caramel')) difficulty += 2;
    if (text.includes('clarify') || text.includes('mount')) difficulty += 1;
    
    // Required precision
    if (step.temperature && step.temperature > 200) difficulty += 1;
    if (step.cookingTime && step.cookingTime > 60) difficulty += 1;
    
    // Specialized tools
    if (step.toolsUsed.includes('mandoline') || step.toolsUsed.includes('thermomix')) {
      difficulty += 1;
    }

    return Math.min(difficulty, 5); // Max 5
  }

  createFallbackSteps(rawSteps) {
    if (!Array.isArray(rawSteps)) return [];

    return rawSteps.map((step, index) => ({
      order: index + 1,
      text: typeof step === 'string' ? step : 'Preparation step',
      type: 'preparation',
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

  // Method to analyze step coherence
  analyzeStepCoherence(steps) {
    const analysis = {
      totalDuration: 0,
      averageDifficulty: 0,
      stepTypes: {},
      warnings: []
    };

    if (!steps.length) {
      analysis.warnings.push('No steps defined');
      return analysis;
    }

    // Calculate metrics
    analysis.totalDuration = steps.reduce((sum, step) => sum + (step.estimatedDuration || 0), 0);
    analysis.averageDifficulty = steps.reduce((sum, step) => sum + (step.difficulty || 1), 0) / steps.length;

    // Count step types
    steps.forEach(step => {
      analysis.stepTypes[step.type] = (analysis.stepTypes[step.type] || 0) + 1;
    });

    // Detect inconsistencies
    if (analysis.totalDuration > 300) {
      analysis.warnings.push('Very long total duration (>5h)');
    }

    if (analysis.averageDifficulty > 4) {
      analysis.warnings.push('Very complex recipe');
    }

    return analysis;
  }
}

export default StepEnhancer;