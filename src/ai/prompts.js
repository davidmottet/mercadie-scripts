// Prompts IA centralisés pour l'enrichissement des recettes

export const generateRecipePrompt = (target) => {
  return `Tu es un chef cuisinier expert. Génère une recette complète selon ce thème ou type de plat : "${target}".

Réponds UNIQUEMENT avec un objet JSON au format suivant, sans texte avant ou après :

{
  "title": "Nom de la recette",
  "description": "Description appétissante de la recette",
  "rawIngredients": [
    "250g de farine",
    "2 œufs",
    "200ml de lait"
  ],
  "rawSteps": [
    "Mélanger la farine et les œufs",
    "Ajouter le lait progressivement"
  ],
  "preparationTime": 15,
  "cookingTime": 30,
  "portions": 4,
  "difficulty": "Facile"
}

Assure-toi que :
- Les ingrédients incluent les quantités précises
- Les étapes sont dans l'ordre logique
- Les temps sont réalistes
- La difficulté est appropriée`;
};

export const resolveIngredientPrompt = (name) => {
  return `Tu es un expert en ingrédients culinaires. Voici un ingrédient extrait d'une recette : "${name}".

Analyse cet ingrédient et rends-moi un objet JSON compatible avec ce modèle, sans texte avant ou après :

{
  "name": "nom normalisé en minuscules sans accents",
  "displayName": "Nom d'affichage joli",
  "displayPlural": "Nom au pluriel pour affichage",
  "plural": "nom au pluriel normalisé",
  "type": "légume|viande|poisson|produit-laitier|céréale|fruit|épice|huile|autre",
  "frozenOrCanned": false,
  "seasons": ["printemps", "été", "automne", "hiver"] ou [] si toute l'année,
  "withPork": false,
  "storeShelf": "frais|surgelé|épicerie|boucherie|poissonnerie",
  "grossWeight": 100
}

Règles importantes :
- Normalise le nom (ex: "tomates cerises" → "tomate cerise")
- Détermine le type principal
- Indique les saisons si c'est saisonnier
- Estime un poids brut standard en grammes`;
};

export const enhanceStepsPrompt = (title, description, ingredients, rawSteps) => {
  return `Tu es un chef professionnel. Voici une recette à enrichir :

**Titre :** ${title}
**Description :** ${description}
**Ingrédients :** ${JSON.stringify(ingredients, null, 2)}
**Étapes brutes :** ${JSON.stringify(rawSteps, null, 2)}

Enrichis ces étapes en détaillant précisément chaque action. Pour chaque étape, rends-moi un objet JSON au format suivant, sans texte avant ou après :

{
  "steps": [
    {
      "order": 1,
      "text": "Description détaillée de l'étape avec quantités exactes",
      "type": "préparation|cuisson|repos|assemblage|finition",
      "temperature": 180 ou null,
      "cookingTime": 15 ou null,
      "notes": "Conseils spécifiques pour cette étape",
      "subSteps": ["Action 1", "Action 2"] ou [],
      "ingredientRefs": ["nom-ingredient1", "nom-ingredient2"],
      "toolsUsed": ["fouet", "casserole", "four"] ou []
    }
  ]
}

Règles importantes :
- Détaille chaque action avec précision
- Indique les quantités d'ingrédients utilisées à chaque étape
- Spécifie les temps et températures
- Ajoute des conseils pratiques
- Référence les bons ingrédients par leur nom normalisé`;
};

export const computeNutritionPrompt = (ingredients, portions) => {
  return `Tu es un nutritionniste expert. Calcule les valeurs nutritionnelles pour cette recette :

**Ingrédients avec quantités :** ${JSON.stringify(ingredients, null, 2)}
**Nombre de portions :** ${portions}

Estime les valeurs nutritionnelles POUR UNE PORTION et rends-moi un objet JSON au format suivant, sans texte avant ou après :

{
  "nutritionalValues": {
    "kcalPer100g": 250,
    "kjPer100g": 1046,
    "proteinsPer100g": 8.5,
    "lipidsPer100g": 12.0,
    "saturatedFattyAcidsPer100g": 3.2,
    "carbohydratesPer100g": 28.0,
    "simpleSugarsPer100g": 4.5,
    "fibresPer100g": 2.8,
    "saltPer100g": 0.8,
    "pnnsFruitPer100g": 0,
    "pnnsVegetablePer100g": 15,
    "oilsPer100g": 5.0,
    "pnnsNutsPer100g": 0,
    "pnnsDriedVegetablePer100g": 0
  },
  "nutriscore": "B"
}

Base tes calculs sur :
- Les quantités exactes d'ingrédients
- Les méthodes de cuisson qui peuvent modifier les valeurs
- Les valeurs nutritionnelles standards des aliments
- Le nombre de portions pour calculer par portion`;
};