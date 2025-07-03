import { getScraperProvider } from '../../providers/index.js';
import Logger from '../logger/index.js';

class ScraperService {
  constructor() {
    this.scraper = getScraperProvider();
    this.logger = new Logger();
  }

  async scrapeRecipe(url) {
    await this.logger.info('SCRAPER_START', `Démarrage du scraping pour: ${url}`);

    try {
      // Éléments à extraire d'une recette
      const elements = {
        title: 'h1, .recipe-title, [class*="title"]',
        description: '.recipe-description, .description, .intro',
        ingredients: '.ingredients li, .ingredient-list li, [class*="ingredient"]',
        steps: '.instructions li, .steps li, .method li, [class*="step"]',
        preparationTime: '[class*="prep"], [data-time="prep"]',
        cookingTime: '[class*="cook"], [data-time="cook"]',
        portions: '[class*="serving"], [class*="portion"]'
      };

      // Soumettre le job de scraping
      const job = await this.scraper.submitJob(url, elements);
      await this.logger.info('SCRAPER_JOB_SUBMITTED', `Job soumis avec ID: ${job.id}`);

      // Attendre que le job soit terminé
      let attempts = 0;
      const maxAttempts = 30; // 5 minutes max
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Attendre 10 secondes
        
        const jobStatus = await this.scraper.getJobStatus(job.id);
        await this.logger.debug('SCRAPER_STATUS_CHECK', `Status: ${jobStatus.status}`);

        if (jobStatus.status === 'Completed') {
          await this.logger.success('SCRAPER_COMPLETED', 'Scraping terminé avec succès');
          
          // Nettoyer le job
          await this.scraper.deleteJob(job.id);
          
          return this.parseScrapedData(jobStatus.result, url);
        } else if (jobStatus.status === 'Failed') {
          await this.scraper.deleteJob(job.id);
          throw new Error(`Le scraping a échoué: ${jobStatus.error || 'Erreur inconnue'}`);
        }
        
        attempts++;
      }

      // Timeout
      await this.scraper.deleteJob(job.id);
      throw new Error('Timeout: Le scraping a pris trop de temps');

    } catch (error) {
      await this.logger.error('SCRAPER_ERROR', error.message);
      throw new Error(`Erreur lors du scraping: ${error.message}`);
    }
  }

  parseScrapedData(scrapedResult, originalUrl) {
    const result = {
      title: '',
      description: '',
      rawIngredients: [],
      rawSteps: [],
      preparationTime: null,
      cookingTime: null,
      portions: null,
      source: 'scraping',
      sourceUrl: originalUrl
    };

    try {
      // Parser le titre
      if (scrapedResult.title && scrapedResult.title.length > 0) {
        result.title = this.cleanText(scrapedResult.title[0]);
      }

      // Parser la description
      if (scrapedResult.description && scrapedResult.description.length > 0) {
        result.description = this.cleanText(scrapedResult.description[0]);
      }

      // Parser les ingrédients
      if (scrapedResult.ingredients) {
        result.rawIngredients = scrapedResult.ingredients
          .map(ing => this.cleanText(ing))
          .filter(ing => ing.length > 0);
      }

      // Parser les étapes
      if (scrapedResult.steps) {
        result.rawSteps = scrapedResult.steps
          .map(step => this.cleanText(step))
          .filter(step => step.length > 0);
      }

      // Parser les temps (tentative d'extraction de nombres)
      if (scrapedResult.preparationTime && scrapedResult.preparationTime.length > 0) {
        result.preparationTime = this.extractTime(scrapedResult.preparationTime[0]);
      }

      if (scrapedResult.cookingTime && scrapedResult.cookingTime.length > 0) {
        result.cookingTime = this.extractTime(scrapedResult.cookingTime[0]);
      }

      // Parser le nombre de portions
      if (scrapedResult.portions && scrapedResult.portions.length > 0) {
        result.portions = this.extractNumber(scrapedResult.portions[0]);
      }

      // Valeurs par défaut si manquantes
      if (!result.title) result.title = 'Recette scrapée';
      if (!result.description) result.description = 'Recette récupérée depuis ' + originalUrl;
      if (!result.portions) result.portions = 4;

    } catch (error) {
      this.logger.warn('SCRAPER_PARSE_WARNING', `Erreur lors du parsing: ${error.message}`);
    }

    return result;
  }

  cleanText(text) {
    if (!text) return '';
    return text
      .replace(/<[^>]*>/g, '') // Retirer HTML
      .replace(/\s+/g, ' ') // Normaliser les espaces
      .trim();
  }

  extractTime(text) {
    if (!text) return null;
    const match = text.match(/(\d+)/);
    return match ? parseInt(match[1]) : null;
  }

  extractNumber(text) {
    if (!text) return null;
    const match = text.match(/(\d+)/);
    return match ? parseInt(match[1]) : null;
  }
}

export default ScraperService;