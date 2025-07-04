#!/usr/bin/env node

import RecipeEnricher from './src/recipe-enricher.js';
import './config/config.js';

const enricher = new RecipeEnricher();

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log(`
🧩 Recipe Enrichment Script

Usage:
  node enrichment-cli.js scraping <URL>           - Scrape a recipe from a URL
  node enrichment-cli.js AI "<theme/dish>"        - Generate a recipe via AI
  node enrichment-cli.js stats                    - Display statistics

Examples:
  node enrichment-cli.js scraping "https://example.com/recipe"
  node enrichment-cli.js AI "apple pie"
  node enrichment-cli.js stats
    `);
    process.exit(1);
  }

  const [source, input] = args;

  try {
    if (source === 'stats') {
      const stats = await enricher.getEnrichmentStats();
      console.log('\n📊 Database Statistics:');
      console.log(`  Recipes: ${stats.recipes}`);
      console.log(`  Ingredients: ${stats.ingredients}`);
      console.log(`  Steps: ${stats.steps}`);
      return;
    }

    console.log(`\n🚀 Starting enrichment...`);
    console.log(`Source: ${source}`);
    console.log(`Input: ${input}\n`);

    const result = await enricher.enrichRecipe(source, input);

    console.log('\n✅ Enrichment completed successfully!');
    console.log(`Recipe ID: ${result.recipeId}`);
    console.log(`Processed ingredients: ${result.ingredientsCount}`);
    console.log(`Created steps: ${result.stepsCount}`);
    console.log(`Enrichment ID: ${result.enrichmentId}`);

  } catch (error) {
    console.error('\n❌ Error during enrichment:');
    console.error(error.message);
    process.exit(1);
  }
}

main();