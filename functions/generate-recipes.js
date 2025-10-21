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
        const { familySize, budget, zipCode, dietaryRestrictions = [] } = requestData;

        // Validate input
        if (!familySize || !budget || familySize < 1 || budget < 20) {
            return new Response(JSON.stringify({ 
                error: 'Invalid input: familySize and budget are required' 
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const budgetPerMeal = budget / 7; // Budget for 7 meals (week)
        
        const prompt = buildRecipePrompt(familySize, budgetPerMeal, dietaryRestrictions);
        
        // Call OpenAI API with your API key stored in Cloudflare environment
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4-turbo-preview',
                messages: [{
                    role: 'system',
                    content: 'You are a professional nutritionist and budget-conscious meal planner. Generate healthy, family-friendly recipes with complete ingredient lists including specific product names suitable for Walmart shopping.'
                }, {
                    role: 'user',
                    content: prompt
                }],
                temperature: 0.8,
                max_tokens: 4000
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        const recipesText = data.choices[0].message.content;
        
        const recipes = parseAIRecipes(recipesText, familySize, budgetPerMeal);
        
        return new Response(JSON.stringify({ recipes }), {
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

// Build comprehensive prompt for healthy recipe generation
function buildRecipePrompt(familySize, budgetPerMeal, dietaryRestrictions) {
    const restrictionsText = dietaryRestrictions.length > 0 
        ? `Dietary restrictions: ${dietaryRestrictions.join(', ')}. ` 
        : '';

    return `Generate 7 unique, healthy, and budget-friendly recipes for a family of ${familySize} people.

REQUIREMENTS:
- Each recipe should cost approximately $${budgetPerMeal.toFixed(2)} or less
- Focus on nutritious, whole foods with good protein, vegetables, and whole grains
- Minimize processed foods and maximize fresh ingredients
- Include complete ingredient lists with specific Walmart product names
- Provide cooking instructions and nutritional benefits
- Make recipes kid-friendly but appealing to adults
- ${restrictionsText}

FORMAT each recipe as JSON with this exact structure:
{
  "name": "Recipe Name",
  "description": "Brief appealing description focusing on health benefits",
  "servings": ${familySize},
  "prepTime": [minutes],
  "cookTime": [minutes],
  "difficulty": "Easy|Medium|Hard",
  "healthBenefits": ["benefit1", "benefit2"],
  "ingredients": [
    {
      "name": "specific walmart product name",
      "amount": [number],
      "unit": "cups|lbs|packages|etc",
      "category": "produce|meat|dairy|pantry|frozen|spices",
      "walmartSearchTerm": "exact product to search for"
    }
  ],
  "instructions": ["step 1", "step 2"],
  "nutrition": {
    "calories": [per serving],
    "protein": [grams],
    "carbs": [grams], 
    "fat": [grams],
    "fiber": [grams]
  },
  "tags": ["healthy", "budget", "family-friendly"]
}

Return an array of 7 recipes in valid JSON format. Focus on variety - include different proteins, cooking methods, and cuisines while keeping everything healthy and budget-conscious.`;
}

// Parse AI-generated recipes into our format
function parseAIRecipes(recipesText, familySize, budgetPerMeal) {
    try {
        // Clean up the response to extract JSON
        let cleanedText = recipesText.trim();
        
        // Find JSON array boundaries
        const startIndex = cleanedText.indexOf('[');
        const endIndex = cleanedText.lastIndexOf(']') + 1;
        
        if (startIndex === -1 || endIndex === 0) {
            throw new Error('No valid JSON array found in AI response');
        }
        
        const jsonText = cleanedText.substring(startIndex, endIndex);
        const recipes = JSON.parse(jsonText);
        
        // Process and validate recipes
        const processedRecipes = recipes.map((recipe, index) => {
            return {
                id: `ai-recipe-${Date.now()}-${index}`,
                name: recipe.name || `Generated Recipe ${index + 1}`,
                description: recipe.description || 'Healthy AI-generated family recipe',
                servings: recipe.servings || familySize,
                prepTime: recipe.prepTime || 15,
                cookTime: recipe.cookTime || 30,
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
                tags: [...(recipe.tags || []), 'ai-generated', 'healthy'],
                pricing: {
                    estimatedCost: budgetPerMeal,
                    costPerServing: budgetPerMeal / familySize
                },
                generatedAt: new Date().toISOString()
            };
        });
        
        return processedRecipes.slice(0, 7); // Ensure we have max 7 recipes
        
    } catch (error) {
        console.error('Error parsing AI recipes:', error);
        throw new Error('Failed to parse AI-generated recipes');
    }
}

// Process ingredients to ensure proper format
function processIngredients(ingredients) {
    return ingredients.map(ing => ({
        name: ing.name || 'Unknown ingredient',
        amount: ing.amount || 1,
        unit: ing.unit || 'item',
        category: ing.category || 'pantry',
        walmartSearchTerm: ing.walmartSearchTerm || ing.name,
        productName: ing.name
    }));
}