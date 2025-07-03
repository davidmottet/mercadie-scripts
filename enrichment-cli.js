#!/usr/bin/env node

import RecipeEnricher from './src/recipe-enricher.js';
import './config/config.js';

const enricher = new RecipeEnricher();

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log(`
🧩 Script d'enrichissement de recettes

Usage:
  node enrichment-cli.js scraping <URL>           - Scraper une recette depuis une URL
  node enrichment-cli.js IA "<theme/plat>"        - Générer une recette via IA
  node enrichment-cli.js stats                    - Afficher les statistiques

Exemples:
  node enrichment-cli.js scraping "https://example.com/recette"
  node enrichment-cli.js IA "tarte aux pommes"
  node enrichment-cli.js stats
    `);
    process.exit(1);
  }

  const [source, input] = args;

  try {
    if (source === 'stats') {
      const stats = await enricher.getEnrichmentStats();
      console.log('\n📊 Statistiques de la base de données:');
      console.log(`  Recettes: ${stats.recipes}`);
      console.log(`  Ingrédients: ${stats.ingredients}`);
      console.log(`  Étapes: ${stats.steps}`);
      return;
    }

    console.log(`\n🚀 Démarrage de l'enrichissement...`);
    console.log(`Source: ${source}`);
    console.log(`Input: ${input}\n`);

    const result = await enricher.enrichRecipe(source, input);

    console.log('\n✅ Enrichissement terminé avec succès!');
    console.log(`ID de la recette: ${result.recipeId}`);
    console.log(`Ingrédients traités: ${result.ingredientsCount}`);
    console.log(`Étapes créées: ${result.stepsCount}`);
    console.log(`ID d'enrichissement: ${result.enrichmentId}`);

  } catch (error) {
    console.error('\n❌ Erreur lors de l\'enrichissement:');
    console.error(error.message);
    process.exit(1);
  }
}

main();