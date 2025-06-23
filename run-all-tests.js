#!/usr/bin/env node

import { spawn } from 'child_process';
import { readdir } from 'fs/promises';
import { join } from 'path';

const TESTS_DIR = './tests';

// Vérification des arguments de ligne de commande
const isVerbose = process.argv.includes('--verbose') || process.argv.includes('-v');

async function runTest(testFile) {
  return new Promise((resolve) => {
    if (isVerbose) {
      console.log(`\n🧪 Exécution de ${testFile}...`);
      console.log('─'.repeat(50));
    }
    
    const testProcess = spawn('node', [join(TESTS_DIR, testFile)], {
      stdio: 'pipe',
      cwd: process.cwd()
    });

    let stdout = '';
    let stderr = '';
    let exitCode = 0;

    testProcess.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      if (isVerbose) {
        process.stdout.write(output);
      }
    });

    testProcess.stderr.on('data', (data) => {
      const output = data.toString();
      stderr += output;
      if (isVerbose) {
        process.stderr.write(output);
      }
    });

    testProcess.on('close', (code) => {
      exitCode = code;
      if (isVerbose) {
        console.log(`\n${exitCode === 0 ? '✅' : '❌'} ${testFile} terminé (code: ${exitCode})`);
      }
      resolve({
        file: testFile,
        success: code === 0,
        exitCode,
        stdout,
        stderr
      });
    });

    testProcess.on('error', (error) => {
      const errorMsg = `❌ Erreur lors de l'exécution de ${testFile}: ${error.message}`;
      if (isVerbose) {
        console.error(errorMsg);
      }
      resolve({
        file: testFile,
        success: false,
        exitCode: -1,
        stdout,
        stderr: error.message
      });
    });
  });
}

async function runAllTests() {
  console.log('🚀 Démarrage de tous les tests...');
  if (isVerbose) {
    console.log('📝 Mode verbose activé - affichage des logs détaillés\n');
  } else {
    console.log('🔇 Mode silencieux - affichage du résumé uniquement\n');
  }
  
  try {
    // Récupération de tous les fichiers de test
    const files = await readdir(TESTS_DIR);
    const testFiles = files.filter(file => file.startsWith('test-') && file.endsWith('.js'));
    
    console.log(`📁 ${testFiles.length} tests trouvés:`);
    testFiles.forEach(file => console.log(`  - ${file}`));
    console.log('');

    const results = [];
    
    // Exécution séquentielle de tous les tests
    for (const testFile of testFiles) {
      if (!isVerbose) {
        process.stdout.write(`🧪 ${testFile}... `);
      }
      
      const result = await runTest(testFile);
      results.push(result);
      
      if (!isVerbose) {
        console.log(result.success ? '✅' : '❌');
      }
      
      // Pause entre les tests pour éviter la surcharge
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Résumé des résultats
    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉSUMÉ DES TESTS');
    console.log('='.repeat(60));
    
    const successfulTests = results.filter(r => r.success);
    const failedTests = results.filter(r => !r.success);
    
    console.log(`✅ Tests réussis: ${successfulTests.length}/${results.length}`);
    console.log(`❌ Tests échoués: ${failedTests.length}/${results.length}`);
    
    if (successfulTests.length > 0) {
      console.log('\n✅ Tests qui fonctionnent:');
      successfulTests.forEach(result => {
        console.log(`  - ${result.file}`);
      });
    }
    
    if (failedTests.length > 0) {
      console.log('\n❌ Tests qui ne marchent pas:');
      failedTests.forEach(result => {
        console.log(`  - ${result.file} (code de sortie: ${result.exitCode})`);
        if (result.stderr && !isVerbose) {
          // En mode silencieux, on affiche juste la première ligne d'erreur
          const firstErrorLine = result.stderr.split('\n')[0].trim();
          if (firstErrorLine) {
            console.log(`    Erreur: ${firstErrorLine}`);
          }
        }
      });
      
      // En mode verbose, on peut afficher plus de détails si demandé
      if (isVerbose) {
        console.log('\n📋 Détails des erreurs:');
        failedTests.forEach(result => {
          console.log(`\n--- ${result.file} ---`);
          if (result.stderr) {
            console.log('STDERR:');
            console.log(result.stderr);
          }
        });
      }
    }
    
    console.log('\n' + '='.repeat(60));
    
    if (failedTests.length > 0) {
      console.log('⚠️  Certains tests ont échoué.');
      if (!isVerbose) {
        console.log('💡 Utilisez --verbose pour voir les détails des erreurs.');
      }
      process.exit(1);
    } else {
      console.log('🎉 Tous les tests sont passés avec succès !');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution des tests:', error.message);
    process.exit(1);
  }
}

// Affichage de l'aide si demandé
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
🚀 Script d'exécution de tous les tests

Usage:
  node run-all-tests.js [options]

Options:
  --verbose, -v    Affiche les logs détaillés de chaque test
  --help, -h       Affiche cette aide

Exemples:
  node run-all-tests.js           # Mode silencieux (résumé uniquement)
  node run-all-tests.js --verbose # Mode verbose (logs détaillés)
  npm run test:all               # Via npm (mode silencieux)
  npm run test:all -- --verbose  # Via npm avec mode verbose
`);
  process.exit(0);
}

// Exécution du script
runAllTests();
