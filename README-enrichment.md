# 🧩 Système d'enrichissement de recettes

Ce système permet d'enrichir automatiquement des recettes en utilisant l'IA et le scraping web, puis de les sauvegarder dans une base de données structurée.

## 🏗️ Architecture

### Modules principaux

- **`src/scraper/`** - Récupération de recettes depuis des URLs
- **`src/ai/`** - Appels aux modèles IA avec prompts centralisés  
- **`src/db/`** - Gestion de la base de données Parse
- **`src/ingredient-resolver/`** - Normalisation et résolution d'ingrédients
- **`src/step-enhancer/`** - Enrichissement des étapes de recette
- **`src/nutrition-estimator/`** - Calcul des valeurs nutritionnelles
- **`src/logger/`** - Système de logs détaillé

### Script principal

- **`src/recipe-enricher.js`** - Orchestrateur principal
- **`enrichment-cli.js`** - Interface en ligne de commande

## 🚀 Utilisation

### Installation

```bash
npm install
```

### Configuration

Assure-toi que le fichier `config/config.js` est configuré avec:
- Les paramètres Parse pour la base de données
- Les credentials IA (Ollama/OpenAI)
- Les paramètres du scraper

### Interface CLI

```bash
# Scraper une recette depuis une URL
node enrichment-cli.js scraping "https://example.com/recette"

# Générer une recette via IA
node enrichment-cli.js IA "tarte aux pommes"

# Afficher les statistiques
node enrichment-cli.js stats
```

### Utilisation programmatique

```javascript
import RecipeEnricher from './src/recipe-enricher.js';

const enricher = new RecipeEnricher();

// Enrichir une recette scrapée
const result = await enricher.enrichRecipe('scraping', 'https://example.com/recette');

// Générer et enrichir une recette IA
const result = await enricher.enrichRecipe('IA', 'risotto aux champignons');
```

## 📋 Processus d'enrichissement

### 1. Récupération de recette brute

**Source = "scraping":**
- Utilise le provider scraper existant
- Extrait: titre, description, ingrédients bruts, étapes brutes, temps, portions

**Source = "IA":**
- Génère une recette complète via prompt IA
- Retourne la même structure que le scraping

### 2. Résolution des ingrédients

Pour chaque ingrédient brut:
1. Parse le texte (quantité, unité, nom)
2. Recherche en base de données par nom/displayName
3. Si non trouvé: appel IA pour créer un ingrédient structuré
4. Sauvegarde du nouvel ingrédient
5. Retour de l'ingrédient formaté avec quantité

### 3. Enrichissement des étapes

1. Appel IA avec recette + ingrédients pour enrichir les étapes
2. Post-traitement: validation, nettoyage, métadonnées
3. Ajout d'estimations de durée et difficulté

### 4. Calcul nutritionnel

1. Appel IA avec ingrédients + quantités
2. Estimation des valeurs nutritionnelles par portion
3. Validation et ajustement des valeurs

### 5. Sauvegarde complète

1. Création de la recette principale avec valeurs nutritionnelles
2. Sauvegarde de toutes les étapes enrichies
3. Liaison des ingrédients aux étapes

## 📊 Logging

Tous les logs sont sauvegardés dans `./logs/enrichment-[timestamp].log` avec:
- Timestamp précis
- ID de session
- Niveau de log (info, warn, error, debug, success)
- Étape du processus
- Message et données JSON

## 🎯 Prompts IA

### `generateRecipePrompt(target)`
Génère une recette complète selon un thème/type de plat.

### `resolveIngredientPrompt(name)`
Transforme un nom d'ingrédient brut en objet structuré.

### `enhanceStepsPrompt(recipe + ingredients)`
Enrichit les étapes avec détails, temps, températures, conseils.

### `computeNutritionPrompt(ingredients + quantities)`
Calcule les valeurs nutritionnelles par portion.

## 🔧 Modules détaillés

### IngredientResolver
- Parse les textes d'ingrédients avec regex
- Cache local pour éviter les doublons
- Fallback en cas d'échec IA
- Normalisation des noms et unités

### StepEnhancer  
- Validation des types d'étapes
- Estimation automatique de durée
- Évaluation de difficulté
- Analyse de cohérence

### NutritionEstimator
- Validation des valeurs nutritionnelles
- Limites et valeurs par défaut
- Fallback en cas d'échec

## 📝 Structure des données

### Recette enrichie
```javascript
{
  title: "Nom de la recette",
  description: "Description",
  preparationTime: 15,
  cookingTime: 30,
  portions: 4,
  difficulty: "Moyen",
  nutritionalValues: { kcalPer100g: 250, ... },
  source: "scraping|IA"
}
```

### Ingrédient résolu
```javascript
{
  id: "ingredient_id",
  name: "nom_normalise",
  displayName: "Nom affiché",
  quantity: 250,
  unit: "gramme",
  type: "légume",
  originalText: "250g de tomates"
}
```

### Étape enrichie
```javascript
{
  order: 1,
  text: "Description détaillée...",
  type: "préparation",
  temperature: 180,
  cookingTime: 15,
  ingredientRefs: ["tomate", "oignon"],
  toolsUsed: ["fouet", "casserole"],
  estimatedDuration: 10,
  difficulty: 2
}
```

## 🚨 Gestion d'erreurs

- Logs détaillés à chaque étape
- Fallbacks pour chaque module
- Validation des données
- Messages d'erreur explicites
- Nettoyage automatique des jobs scraper

## 📈 Statistiques

Le système fournit des métriques sur:
- Nombre de recettes enrichies
- Ingrédients créés
- Étapes générées
- Taux de succès par étape