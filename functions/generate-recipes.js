// Cloudflare Pages Function for OpenAI Recipe Generation
export async function onRequestPost(context) {
    const { request, env } = context;
    
    // Handle CORS
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const requestData = await request.json();
        const { familySize, budget, zipCode } = requestData;

        // Validate input
        if (!familySize || !budget || familySize < 1 || budget < 20) {
            return new Response(JSON.stringify({ 
                error: 'Invalid input: familySize and budget are required' 
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
        
        const prompt = buildRecipePrompt(requestData);
        
        // Call OpenAI API with your API key stored in Cloudflare environment
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4',
                messages: [{
                    role: 'system',
                    content: 'You are a professional nutritionist and creative meal planner who specializes in unique, budget-conscious family recipes. Always respond with valid JSON. Create ENTIRELY NEW recipes every time - never repeat common meal plans. Be creative with international fusion, unusual ingredient combinations, and interesting cooking methods while staying practical and budget-friendly.'
                }, {
                    role: 'user',
                    content: prompt
                }],
                temperature: 0.9, // Higher for more creativity
                max_tokens: 4000
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        const mealPlanText = data.choices[0].message.content;
        
        const mealPlan = parseAIMealPlan(mealPlanText, requestData);
        
        return new Response(JSON.stringify({ 
            success: true,
            mealPlan,
            generatedAt: new Date().toISOString(),
            source: 'ai_generated'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Error generating AI recipes:', error);
        return new Response(JSON.stringify({ 
            error: 'Failed to generate recipes with AI',
            details: error.message 
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

// Build comprehensive prompt for healthy recipe generation with meal-specific details
function buildRecipePrompt(requestData) {
    const { 
        familySize, 
        budget, 
        dietaryRestrictions = [],
        breakfastDays = 7,
        lunchDays = 7,
        dinnerDays = 7,
        breakfastPeople,
        lunchPeople,
        dinnerPeople,
        cuisinePreferences = [],
        cookingSkill = 'intermediate',
        healthFocus = 'balanced',
        zipCode
    } = requestData;
    
    const restrictionsText = dietaryRestrictions.length > 0 
        ? `Dietary restrictions: ${dietaryRestrictions.join(', ')}. ` 
        : '';
    
    const cuisineText = cuisinePreferences.length > 0
        ? `Preferred cuisines: ${cuisinePreferences.join(', ')}. `
        : 'Any cuisine (be creative with international fusion). ';
    
    const totalMeals = parseInt(breakfastDays) + parseInt(lunchDays) + parseInt(dinnerDays);
    const budgetPerMeal = budget / totalMeals;

    return `Generate a complete weekly meal plan with UNIQUE, CREATIVE recipes for a family of ${familySize} people.

FAMILY DETAILS:
- Total weekly budget: $${budget} ($${budgetPerMeal.toFixed(2)} per meal)
- Location: ZIP ${zipCode} (consider regional preferences)
- ${restrictionsText}
- Health focus: ${healthFocus}
- Cooking skill: ${cookingSkill}
- ${cuisineText}

MEAL REQUIREMENTS:
- ${breakfastDays} Breakfasts for ${breakfastPeople} people
- ${lunchDays} Lunches for ${lunchPeople} people  
- ${dinnerDays} Dinners for ${dinnerPeople} people

CREATIVITY REQUIREMENTS:
- Create ENTIRELY NEW and UNIQUE recipes - NO typical "spaghetti and meatballs", "chicken and rice", or basic tacos
- Use unusual but budget-friendly ingredient combinations
- Include international flavors and fusion cuisine
- Think beyond typical American family meals
- Each recipe should feel unique and exciting while being practical
- Use interesting cooking methods (sheet pan, one-pot, slow cooker, etc.)

QUALITY REQUIREMENTS:
- Focus on nutritious, whole foods with good protein, vegetables, and whole grains
- Minimize processed foods and maximize fresh ingredients
- Include complete ingredient lists with SPECIFIC PRODUCT NAMES and SIZES (e.g., "1 package Ground Turkey 93/7 (1lb)")
- Make recipes family-friendly but interesting
- Share ingredients across meals to minimize waste

FORMAT: Return a JSON object with this structure:
{
  "summary": {
    "totalMeals": ${totalMeals},
    "estimatedCost": ${budget},
    "costPerMeal": ${budgetPerMeal.toFixed(2)},
    "varietyScore": 9
  },
  "breakfasts": [ ... ${breakfastDays} creative breakfast recipes ... ],
  "lunches": [ ... ${lunchDays} creative lunch recipes ... ],
  "dinners": [ ... ${dinnerDays} creative dinner recipes ... ]
}

Each recipe should follow this format:
{
  "name": "Creative Unique Recipe Name",
  "description": "Appealing description",
  "servings": [number of people],
  "prepTime": "[XX minutes]",
  "cookTime": "[XX minutes]",
  "difficulty": "Easy|Medium|Hard",
  "healthBenefits": ["benefit1", "benefit2"],
  "ingredients": [
    {
      "name": "ingredient name",
      "amount": [number],
      "unit": "cups|lbs|packages|etc",
      "storeUnit": "1 package Specific Product Name (1lb)",
      "category": "produce|meat|dairy|pantry|frozen|spices",
      "walmartSearchTerm": "exact product to search for"
    }
  ],
  "instructions": ["detailed step 1", "detailed step 2"],
  "nutrition": {
    "calories": [per serving],
    "protein": [grams],
    "carbs": [grams], 
    "fat": [grams],
    "fiber": [grams]
  },
  "tags": ["creative", "unique", "healthy"]
}

Generate completely fresh, creative recipes that families will be excited to try!`;
}

// Parse AI-generated meal plan into our format
function parseAIMealPlan(mealPlanText, requestData) {
    try {
        // Clean up the response to extract JSON
        let cleanedText = mealPlanText.trim();
        
        // Remove markdown code blocks if present
        cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        
        // Find JSON object boundaries
        const startIndex = cleanedText.indexOf('{');
        const endIndex = cleanedText.lastIndexOf('}') + 1;
        
        if (startIndex === -1 || endIndex === 0) {
            throw new Error('No valid JSON object found in AI response');
        }
        
        const jsonText = cleanedText.substring(startIndex, endIndex);
        const mealPlan = JSON.parse(jsonText);
        
        // Process and validate meal plan
        const processedPlan = {
            summary: mealPlan.summary || {
                totalMeals: (parseInt(requestData.breakfastDays) || 0) + (parseInt(requestData.lunchDays) || 0) + (parseInt(requestData.dinnerDays) || 0),
                estimatedCost: requestData.budget,
                costPerMeal: 0,
                varietyScore: 8
            },
            breakfasts: processRecipes(mealPlan.breakfasts || [], 'breakfast', requestData),
            lunches: processRecipes(mealPlan.lunches || [], 'lunch', requestData),
            dinners: processRecipes(mealPlan.dinners || [], 'dinner', requestData),
            metadata: {
                generatedFor: {
                    familySize: requestData.familySize,
                    budget: requestData.budget,
                    zipCode: requestData.zipCode
                },
                generatedAt: new Date().toISOString(),
                uniqueId: Date.now()
            }
        };
        
        return processedPlan;
        
    } catch (error) {
        console.error('Error parsing AI meal plan:', error);
        console.error('Response text:', mealPlanText.substring(0, 500));
        throw new Error('Failed to parse AI-generated meal plan: ' + error.message);
    }
}

// Process recipes for a specific meal type
function processRecipes(recipes, mealType, requestData) {
    if (!Array.isArray(recipes)) {
        console.warn(`${mealType} recipes not an array, returning empty array`);
        return [];
    }
    
    return recipes.map((recipe, index) => {
        return {
            id: `ai-${mealType}-${Date.now()}-${index}`,
            name: recipe.name || `Generated ${mealType} ${index + 1}`,
            description: recipe.description || `Healthy AI-generated ${mealType}`,
            servings: recipe.servings || requestData.familySize,
            prepTime: recipe.prepTime || '15 minutes',
            cookTime: recipe.cookTime || '30 minutes',
            difficulty: recipe.difficulty || 'Easy',
            healthBenefits: recipe.healthBenefits || ['Nutritious', 'Family-friendly'],
            ingredients: processIngredients(recipe.ingredients || []),
            instructions: recipe.instructions || ['Follow basic cooking instructions'],
            nutrition: recipe.nutrition || {
                calories: 400,
                protein: 25,
                carbs: 45,
                fat: 12,
                fiber: 8
            },
            tags: [...(recipe.tags || []), 'ai-generated', mealType],
            mealType: mealType,
            generatedAt: new Date().toISOString()
        };
    });
}

// Process ingredients to ensure proper format
function processIngredients(ingredients) {
    if (!Array.isArray(ingredients)) {
        return [];
    }
    
    return ingredients.map(ing => ({
        name: ing.name || 'Unknown ingredient',
        amount: ing.amount || 1,
        unit: ing.unit || 'item',
        storeUnit: ing.storeUnit || `${ing.amount || 1} ${ing.unit || 'item'} ${ing.name || 'item'}`,
        category: ing.category || 'pantry',
        walmartSearchTerm: ing.walmartSearchTerm || ing.name,
        productName: ing.name
    }));
}