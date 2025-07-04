import { getScraperProvider } from '../../providers/index.js';
import Logger from '../logger/index.js';

class ScraperService {
  constructor() {
    this.scraper = getScraperProvider();
    this.logger = new Logger();
  }

  async scrapeRecipe(url) {
    await this.logger.info('SCRAPER_START', `Starting scraping for: ${url}`);

    try {
      // Elements to extract from a recipe
      const elements = {
        title: 'h1, .recipe-title, [class*="title"]',
        description: '.recipe-description, .description, .intro',
        ingredients: '.ingredients li, .ingredient-list li, [class*="ingredient"]',
        steps: '.instructions li, .steps li, .method li, [class*="step"]',
        preparationTime: '[class*="prep"], [data-time="prep"]',
        cookingTime: '[class*="cook"], [data-time="cook"]',
        portions: '[class*="serving"], [class*="portion"]'
      };

      // Submit scraping job
      const job = await this.scraper.submitJob(url, elements);
      await this.logger.info('SCRAPER_JOB_SUBMITTED', `Job submitted with ID: ${job.id}`);

      // Wait for job completion
      let attempts = 0;
      const maxAttempts = 30; // 5 minutes max
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
        
        const jobStatus = await this.scraper.getJobStatus(job.id);
        await this.logger.debug('SCRAPER_STATUS_CHECK', `Status: ${jobStatus.status}`);

        if (jobStatus.status === 'Completed') {
          await this.logger.success('SCRAPER_COMPLETED', 'Scraping completed successfully');
          
          // Clean up job
          await this.scraper.deleteJob(job.id);
          
          return this.parseScrapedData(jobStatus.result, url);
        } else if (jobStatus.status === 'Failed') {
          await this.scraper.deleteJob(job.id);
          throw new Error(`Scraping failed: ${jobStatus.error || 'Unknown error'}`);
        }
        
        attempts++;
      }

      // Timeout
      await this.scraper.deleteJob(job.id);
      throw new Error('Timeout: Scraping took too long');

    } catch (error) {
      await this.logger.error('SCRAPER_ERROR', error.message);
      throw new Error(`Error during scraping: ${error.message}`);
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
      // Parse title
      if (scrapedResult.title && scrapedResult.title.length > 0) {
        result.title = this.cleanText(scrapedResult.title[0]);
      }

      // Parse description
      if (scrapedResult.description && scrapedResult.description.length > 0) {
        result.description = this.cleanText(scrapedResult.description[0]);
      }

      // Parse ingredients
      if (scrapedResult.ingredients) {
        result.rawIngredients = scrapedResult.ingredients
          .map(ing => this.cleanText(ing))
          .filter(ing => ing.length > 0);
      }

      // Parse steps
      if (scrapedResult.steps) {
        result.rawSteps = scrapedResult.steps
          .map(step => this.cleanText(step))
          .filter(step => step.length > 0);
      }

      // Parse times (attempt to extract numbers)
      if (scrapedResult.preparationTime && scrapedResult.preparationTime.length > 0) {
        result.preparationTime = this.extractTime(scrapedResult.preparationTime[0]);
      }

      if (scrapedResult.cookingTime && scrapedResult.cookingTime.length > 0) {
        result.cookingTime = this.extractTime(scrapedResult.cookingTime[0]);
      }

      // Parse number of portions
      if (scrapedResult.portions && scrapedResult.portions.length > 0) {
        result.portions = this.extractNumber(scrapedResult.portions[0]);
      }

      // Default values if missing
      if (!result.title) result.title = 'Scraped recipe';
      if (!result.description) result.description = 'Recipe retrieved from ' + originalUrl;
      if (!result.portions) result.portions = 4;

    } catch (error) {
      this.logger.warn('SCRAPER_PARSE_WARNING', `Error during parsing: ${error.message}`);
    }

    return result;
  }

  cleanText(text) {
    if (!text) return '';
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML
      .replace(/\s+/g, ' ') // Normalize spaces
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