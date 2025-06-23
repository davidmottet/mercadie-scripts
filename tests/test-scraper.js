import { getScraperProvider } from '../src/providers/index.js';
import '../config/config.js';

async function main() {
  try {
    const scraper = getScraperProvider();
    
    // Test de soumission d'un job
    console.log('Submitting test job...');
    const job = await scraper.submitJob('http://google.com/', [
      {
        name: "google",
        xpath: "//span[@class='text']",
        url: "http://google.com/"
      }
    ]);
    
    console.log('Job submitted:', job);
    
    // Vérifier le statut du job
    console.log('\nChecking job status...');
    const status = await scraper.getJobStatus(job.id);
    console.log('Job status:', status);
    
    console.log('\n✅ Scraper connection successful');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main(); 