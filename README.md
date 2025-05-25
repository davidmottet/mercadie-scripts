# Mercadie Scripts

Ce projet contient un ensemble d'outils pour l'intégration de différents services : Scraper, fournisseurs d'IA (OpenAI et Ollama), et Parse Server.

## Configuration

### Variables d'environnement

Créez un fichier `.env` à la racine du projet avec les variables suivantes :

```env
# OpenAI
OPENAI_API_KEY=votre_clé_api

# Ollama
OLLAMA_URL=localhost
OLLAMA_PORT=11434
OLLAMA_MODEL=llama2

# Scraper
SCRAPER_URL=localhost
SCRAPER_PORT=8000
SCRAPER_USERNAME=admin
SCRAPER_PASSWORD=admin

# Parse Server
PARSE_APP_ID=votre_app_id
PARSE_JS_KEY=votre_js_key
PARSE_SERVER_URL=votre_url_parse_server
```

## Installation

```bash
npm install
```

## Utilisation

### Fournisseurs d'IA

Le projet supporte deux fournisseurs d'IA :

1. **OpenAI**
```javascript
import { getAIProvider } from './src/providers/index.js';

const openaiProvider = getAIProvider('openai');
const result = await openaiProvider.generateCompletion('Votre prompt ici');
```

2. **Ollama**
```javascript
import { getAIProvider } from './src/providers/index.js';

const ollamaProvider = getAIProvider('ollama');
const result = await ollamaProvider.generateCompletion('Votre prompt ici');
```

### Scraper

Le Scraper permet de soumettre des jobs de scraping et de gérer leur statut :

```javascript
import { getScraperProvider } from './src/providers/index.js';

const scraper = getScraperProvider();

// Soumettre un job
const job = await scraper.submitJob('http://example.com', [
  {
    name: "example",
    xpath: "//div[@class='content']",
    url: "http://example.com"
  }
]);

// Vérifier le statut d'un job
const status = await scraper.getJobStatus(job.id);

// Mettre à jour un job
await scraper.updateJob(job.id, 'status', 'Completed');

// Supprimer un job
await scraper.deleteJob(job.id);
```

### Parse Server

Pour utiliser Parse Server :

```javascript
import { initializeParse, testParseConnection } from './config/parseConfig.js';

// Initialiser la connexion
initializeParse();

// Tester la connexion
const isConnected = await testParseConnection();
```

## Scripts de test

Le projet inclut plusieurs scripts de test pour vérifier les connexions :

1. **Tester toutes les connexions**
```bash
node tests/test-connections.js
```

2. **Tester uniquement Parse Server**
```bash
node tests/test-parse.js
```

3. **Tester uniquement le Scraper**
```bash
node tests/test-scraper.js
```

4. **Tester uniquement Ollama**
```bash
node tests/test-ollama.js
```

## Fonctionnalités principales

### Scraper
- Authentification automatique avec gestion des tokens
- Soumission de jobs de scraping
- Suivi du statut des jobs
- Mise à jour et suppression de jobs
- Gestion des timeouts et des erreurs

### Fournisseurs d'IA
- Support pour OpenAI (GPT-4)
- Support pour Ollama (modèles locaux)
- Génération de réponses en format JSON
- Gestion des erreurs et des timeouts

### Parse Server
- Configuration automatique
- Test de connexion
- Gestion des erreurs de connexion

## Développement

Pour le développement avec rechargement automatique :
```bash
npm run dev
```

Pour démarrer en production :
```bash
npm start
``` 