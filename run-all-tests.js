#!/usr/bin/env node

import { spawn } from 'child_process';
import { readdir } from 'fs/promises';
import { join } from 'path';

const TESTS_DIR = './tests';

async function runTest(testFile) {
  return new Promise((resolve) => {
    console.log(`\n🧪 Exécution de ${testFile}...`);
    console.log('─'.repeat(50));
    
    const testProcess = spawn('node', [join(TESTS_DIR, testFile)], {
      stdio: 'pipe',
      cwd: process.cwd()
    });

    let stdout = '';
    let stderr = '';
    let exitCode = 0;

    testProcess.stdout.on('data', (data) => {
      stdout += data.toString();
      process.stdout.write(data);
    });

    testProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      process.stderr.write(data);
    });

    testProcess.on('close', (code) => {
      exitCode = code;
      resolve({
        file: testFile,
        success: code === 0,
        exitCode,
        stdout,
        stderr
      });
    });

    testProcess.on('error', (error) => {
      console.error(`❌ Erreur lors de l'exécution de ${testFile}:`, error.message);
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
  console.log('🚀 Démarrage de tous les tests...\n');
  
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
      const result = await runTest(testFile);
      results.push(result);
      
      // Pause entre les tests pour éviter la surcharge
      await new Promise(resolve => setTimeout(resolve, 1000));
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
        if (result.stderr) {
          console.log(`    Erreur: ${result.stderr.trim()}`);
        }
      });
    }
    
    console.log('\n' + '='.repeat(60));
    
    if (failedTests.length > 0) {
      console.log('⚠️  Certains tests ont échoué. Vérifiez les erreurs ci-dessus.');
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

// Exécution du script
runAllTests();
