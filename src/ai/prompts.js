// Centralized AI prompts for recipe enrichment

export const generateRecipePrompt = (target) => {
  return `You are an expert chef. Generate a complete recipe based on this theme or dish type: "${target}".

Respond ONLY with a JSON object in the following format, without any text before or after:

{
  "title": "Recipe name",
  "description": "Appetizing description of the recipe",
  "rawIngredients": [
    "250g flour",
    "2 eggs",
    "200ml milk"
  ],
  "rawSteps": [
    "Mix flour and eggs",
    "Add milk gradually"
  ],
  "preparationTime": 15,
  "cookingTime": 30,
  "portions": 4,
  "difficulty": "Easy"
}

Make sure that:
- Ingredients include precise quantities
- Steps are in logical order
- Times are realistic
- Difficulty is appropriate`;
};

export const resolveIngredientPrompt = (name) => {
  return `You are an expert in culinary ingredients. Here is an ingredient extracted from a recipe: "${name}".

Analyze this ingredient and return a JSON object compatible with this model, without any text before or after:

{
  "name": "normalized name in lowercase without accents (REQUIRED)",
  "displayName": "Nice display name",
  "displayPlural": "Plural name for display",
  "plural": "normalized plural name",
  "type": "vegetable|meat|fish|dairy|cereal|fruit|spice|oil|other",
  "frozenOrCanned": false,
  "seasons": ["spring", "summer", "autumn", "winter"] or [] if year-round,
  "withPork": false,
  "storeShelf": "fresh|frozen|grocery|butcher|fishmonger",
  "grossWeight": 100
}

CRITICAL REQUIREMENTS:
- The "name" field is MANDATORY and must be a normalized lowercase string
- Normalize the name (e.g., "large eggs" → "large egg", "cherry tomatoes" → "cherry tomato")
- Remove articles and unnecessary words
- Determine the main type
- Indicate seasons if seasonal
- Estimate a standard gross weight in grams

Example for "large eggs":
{
  "name": "large egg",
  "displayName": "Large Egg",
  "displayPlural": "Large Eggs",
  "plural": "large eggs",
  "type": "dairy",
  "frozenOrCanned": false,
  "seasons": [],
  "withPork": false,
  "storeShelf": "fresh",
  "grossWeight": 60
}`;
};

export const enhanceStepsPrompt = (title, description, ingredients, rawSteps) => {
  return `You are a professional chef. Here is a recipe to enhance:

**Title:** ${title}
**Description:** ${description}
**Ingredients:** ${JSON.stringify(ingredients, null, 2)}
**Raw steps:** ${JSON.stringify(rawSteps, null, 2)}

Enhance these steps by detailing each action precisely. For each step, return a JSON object in the following format, without any text before or after:

{
  "steps": [
    {
      "order": 1,
      "text": "Detailed description of the step with exact quantities",
      "type": "preparation|cooking|resting|assembly|finishing",
      "temperature": 180 or null,
      "cookingTime": 15 or null,
      "notes": "Specific tips for this step",
      "subSteps": ["Action 1", "Action 2"] or [],
      "ingredientRefs": ["ingredient-name1", "ingredient-name2"],
      "toolsUsed": ["whisk", "pan", "oven"] or []
    }
  ]
}

Important rules:
- Detail each action with precision
- Indicate ingredient quantities used at each step
- Specify times and temperatures
- Add practical tips
- Reference the correct ingredients by their normalized name`;
};

export const computeNutritionPrompt = (ingredients, portions) => {
  return `You are an expert nutritionist. Calculate the nutritional values for this recipe:

**Ingredients with quantities:** ${JSON.stringify(ingredients, null, 2)}
**Number of portions:** ${portions}

Estimate the nutritional values FOR ONE PORTION and return a JSON object in the following format, without any text before or after:

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

Base your calculations on:
- Exact ingredient quantities
- Cooking methods that may modify values
- Standard nutritional values of foods
- Number of portions to calculate per portion`;
};