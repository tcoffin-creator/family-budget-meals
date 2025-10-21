// Smart meal selection algorithm that optimizes for budget and shared ingredients
class MealSelector {
    constructor(recipesDatabase) {
        this.recipes = recipesDatabase;
        this.selectedMeals = [];
    }

    // Main method to select meals based on family parameters
    selectMeals(params) {
        const {
            weeklyBudget,
            adults,
            kids,
            kidAges,
            location,
            mealsCount,
            allergies
        } = params;

        // Calculate total people and scaling factors
        const totalPeople = adults + kids;
        const kidAgeArray = kidAges ? kidAges.split(',').map(age => parseInt(age.trim())).filter(age => !isNaN(age)) : [];
        
        // Get all available recipes
        const allRecipes = this.getAllRecipes();
        
        // Filter recipes based on allergies/dislikes
        const filteredRecipes = this.filterByAllergies(allRecipes, allergies);
        
        // Score recipes for budget optimization
        const scoredRecipes = this.scoreRecipes(filteredRecipes, {
            budget: weeklyBudget,
            people: totalPeople,
            location: location,
            mealsNeeded: mealsCount
        });
        
        // Select optimal combination
        const selectedMeals = this.optimizeMealSelection(scoredRecipes, {
            budget: weeklyBudget,
            mealsCount: mealsCount,
            people: totalPeople,
            location: location
        });
        
        // Scale portions for family size
        const scaledMeals = this.scalePortions(selectedMeals, totalPeople, kidAgeArray);
        
        this.selectedMeals = scaledMeals;
        return scaledMeals;
    }

    // Get all recipes from database
    getAllRecipes() {
        const allRecipes = [];
        for (const category of Object.values(this.recipes)) {
            allRecipes.push(...category);
        }
        return allRecipes;
    }

    // Filter recipes based on allergies and dislikes
    filterByAllergies(recipes, allergiesText) {
        if (!allergiesText || allergiesText.trim() === '') {
            return recipes;
        }

        const allergies = allergiesText.toLowerCase().split(',').map(item => item.trim());
        
        return recipes.filter(recipe => {
            // Check recipe allergens
            if (recipe.allergens) {
                for (const allergen of recipe.allergens) {
                    if (allergies.some(allergy => 
                        allergen.toLowerCase().includes(allergy) || 
                        allergy.includes(allergen.toLowerCase())
                    )) {
                        return false;
                    }
                }
            }
            
            // Check ingredient names for dislikes
            for (const ingredient of recipe.ingredients) {
                const ingredientName = ingredient.name.toLowerCase();
                if (allergies.some(allergy => 
                    ingredientName.includes(allergy) || 
                    allergy.includes(ingredientName)
                )) {
                    return false;
                }
            }
            
            // Check recipe name and description
            const recipeName = recipe.name.toLowerCase();
            const recipeDesc = recipe.description.toLowerCase();
            if (allergies.some(allergy => 
                recipeName.includes(allergy) || 
                recipeDesc.includes(allergy)
            )) {
                return false;
            }
            
            return true;
        });
    }

    // Score recipes for selection optimization
    scoreRecipes(recipes, params) {
        const { budget, people, location, mealsNeeded } = params;
        const budgetPerMeal = budget / mealsNeeded;
        
        return recipes.map(recipe => {
            const pricing = getRecipePricing(recipe, location);
            const scaledCost = this.calculateScaledCost(pricing, recipe.servings, people);
            
            // Scoring factors
            const budgetScore = this.calculateBudgetScore(scaledCost, budgetPerMeal);
            const nutritionScore = this.calculateNutritionScore(recipe);
            const versatilityScore = this.calculateVersatilityScore(recipe);
            const commonIngredientsScore = this.calculateCommonIngredientsScore(recipe);
            
            const totalScore = (
                budgetScore * 0.4 +           // 40% budget consideration
                nutritionScore * 0.2 +        // 20% nutrition
                versatilityScore * 0.2 +      // 20% family-friendly
                commonIngredientsScore * 0.2  // 20% ingredient overlap
            );
            
            return {
                ...recipe,
                pricing: pricing,
                scaledCost: scaledCost,
                score: totalScore,
                budgetScore: budgetScore,
                nutritionScore: nutritionScore,
                versatilityScore: versatilityScore,
                commonIngredientsScore: commonIngredientsScore
            };
        }).sort((a, b) => b.score - a.score);
    }

    // Calculate how well recipe fits budget
    calculateBudgetScore(cost, budgetPerMeal) {
        if (cost <= budgetPerMeal * 0.7) return 1.0;      // Great value
        if (cost <= budgetPerMeal) return 0.8;            // Within budget
        if (cost <= budgetPerMeal * 1.2) return 0.5;     // Slightly over
        return 0.2;                                       // Too expensive
    }

    // Score recipe nutrition
    calculateNutritionScore(recipe) {
        const nutrition = recipe.nutrition;
        let score = 0.5; // Base score
        
        // Bonus for high protein
        if (nutrition.protein >= 20) score += 0.3;
        else if (nutrition.protein >= 15) score += 0.2;
        else if (nutrition.protein >= 10) score += 0.1;
        
        // Bonus for reasonable calories
        if (nutrition.calories >= 300 && nutrition.calories <= 500) score += 0.2;
        
        return Math.min(score, 1.0);
    }

    // Score recipe versatility (kid-friendly, difficulty, etc.)
    calculateVersatilityScore(recipe) {
        let score = 0.5; // Base score
        
        // Kid-friendly bonus
        if (recipe.tags.includes('kid-friendly')) score += 0.3;
        
        // Easy preparation bonus
        if (recipe.difficulty === 'Easy') score += 0.2;
        
        // Quick preparation bonus
        if (recipe.prepTime <= 15) score += 0.1;
        
        // Large batch bonus (more servings)
        if (recipe.servings >= 6) score += 0.1;
        
        return Math.min(score, 1.0);
    }

    // Score based on common ingredients with other high-scoring recipes
    calculateCommonIngredientsScore(recipe) {
        const commonIngredients = recipe.commonIngredients || [];
        
        // Base score for having common ingredients defined
        let score = commonIngredients.length > 0 ? 0.5 : 0.3;
        
        // Bonus for pantry staples
        const pantryStaples = ['onion', 'garlic', 'oil', 'salt', 'pepper', 'flour', 'rice'];
        const pantryCount = recipe.ingredients.filter(ing => 
            pantryStaples.some(staple => ing.name.toLowerCase().includes(staple))
        ).length;
        
        score += (pantryCount / pantryStaples.length) * 0.3;
        
        return Math.min(score, 1.0);
    }

    // Optimize meal selection to minimize ingredient overlap and stay within budget
    optimizeMealSelection(scoredRecipes, params) {
        const { budget, mealsCount, people, location } = params;
        
        const selected = [];
        const usedIngredients = new Map();
        let totalCost = 0;
        
        // First pass: select highest scoring recipes that fit budget
        for (const recipe of scoredRecipes) {
            if (selected.length >= mealsCount) break;
            
            const scaledCost = this.calculateScaledCost(recipe.pricing, recipe.servings, people);
            
            if (totalCost + scaledCost <= budget) {
                selected.push(recipe);
                totalCost += scaledCost;
                
                // Track ingredient usage
                for (const ingredient of recipe.ingredients) {
                    const key = ingredient.name.toLowerCase();
                    if (usedIngredients.has(key)) {
                        usedIngredients.set(key, usedIngredients.get(key) + 1);
                    } else {
                        usedIngredients.set(key, 1);
                    }
                }
            }
        }
        
        // Second pass: optimize for ingredient overlap if we have budget remaining
        if (selected.length < mealsCount && totalCost < budget * 0.9) {
            this.optimizeForIngredientOverlap(selected, scoredRecipes, usedIngredients, params);
        }
        
        // If we still don't have enough meals, fill with cheapest options
        if (selected.length < mealsCount) {
            this.fillWithBudgetOptions(selected, scoredRecipes, params);
        }
        
        return selected;
    }

    // Optimize selection for maximum ingredient overlap
    optimizeForIngredientOverlap(selected, allRecipes, usedIngredients, params) {
        const { budget, mealsCount, people } = params;
        let totalCost = selected.reduce((sum, recipe) => 
            sum + this.calculateScaledCost(recipe.pricing, recipe.servings, people), 0
        );
        
        const remaining = allRecipes.filter(recipe => !selected.includes(recipe));
        
        // Score remaining recipes by ingredient overlap
        const overlapScored = remaining.map(recipe => {
            let overlapScore = 0;
            for (const ingredient of recipe.ingredients) {
                const key = ingredient.name.toLowerCase();
                if (usedIngredients.has(key)) {
                    overlapScore += usedIngredients.get(key);
                }
            }
            
            const scaledCost = this.calculateScaledCost(recipe.pricing, recipe.servings, people);
            
            return {
                ...recipe,
                overlapScore: overlapScore,
                costEfficiency: overlapScore / scaledCost
            };
        }).sort((a, b) => b.costEfficiency - a.costEfficiency);
        
        // Add recipes with best ingredient overlap
        for (const recipe of overlapScored) {
            if (selected.length >= mealsCount) break;
            
            const scaledCost = this.calculateScaledCost(recipe.pricing, recipe.servings, people);
            if (totalCost + scaledCost <= budget) {
                selected.push(recipe);
                totalCost += scaledCost;
                
                // Update ingredient tracking
                for (const ingredient of recipe.ingredients) {
                    const key = ingredient.name.toLowerCase();
                    if (usedIngredients.has(key)) {
                        usedIngredients.set(key, usedIngredients.get(key) + 1);
                    } else {
                        usedIngredients.set(key, 1);
                    }
                }
            }
        }
    }

    // Fill remaining slots with cheapest viable options
    fillWithBudgetOptions(selected, allRecipes, params) {
        const { budget, mealsCount, people } = params;
        let totalCost = selected.reduce((sum, recipe) => 
            sum + this.calculateScaledCost(recipe.pricing, recipe.servings, people), 0
        );
        
        const remaining = allRecipes
            .filter(recipe => !selected.includes(recipe))
            .sort((a, b) => a.scaledCost - b.scaledCost);
        
        for (const recipe of remaining) {
            if (selected.length >= mealsCount) break;
            
            const scaledCost = this.calculateScaledCost(recipe.pricing, recipe.servings, people);
            if (totalCost + scaledCost <= budget) {
                selected.push(recipe);
                totalCost += scaledCost;
            }
        }
    }

    // Scale recipe portions for family size
    scalePortions(meals, totalPeople, kidAges = []) {
        return meals.map(meal => {
            // Calculate scaling factor
            // Kids eat roughly 0.7 portions of adults on average
            const adultPortions = totalPeople - kidAges.length;
            const kidPortions = kidAges.reduce((sum, age) => {
                if (age <= 5) return sum + 0.5;
                if (age <= 10) return sum + 0.7;
                return sum + 0.9;
            }, 0);
            
            const totalPortions = adultPortions + kidPortions;
            const scaleFactor = totalPortions / meal.servings;
            
            // Scale ingredients
            const scaledIngredients = meal.ingredients.map(ingredient => ({
                ...ingredient,
                amount: Math.round((ingredient.amount * scaleFactor) * 100) / 100,
                originalAmount: ingredient.amount
            }));
            
            // Recalculate pricing with scaled amounts
            const scaledPricing = {
                ...meal.pricing,
                totalCost: meal.pricing.totalCost * scaleFactor,
                costPerServing: meal.pricing.totalCost * scaleFactor / totalPortions
            };
            
            return {
                ...meal,
                ingredients: scaledIngredients,
                pricing: scaledPricing,
                scaledServings: Math.ceil(totalPortions),
                scaleFactor: scaleFactor,
                originalServings: meal.servings
            };
        });
    }

    // Calculate cost scaled for family size
    calculateScaledCost(pricing, recipeServings, people) {
        const scaleFactor = people / recipeServings;
        return pricing.totalCost * scaleFactor;
    }

    // Generate a single replacement meal
    regenerateMeal(mealIndex, params) {
        if (mealIndex < 0 || mealIndex >= this.selectedMeals.length) {
            return null;
        }
        
        const currentMeal = this.selectedMeals[mealIndex];
        const allRecipes = this.getAllRecipes();
        const filteredRecipes = this.filterByAllergies(allRecipes, params.allergies);
        
        // Remove current meal from options
        const availableRecipes = filteredRecipes.filter(recipe => recipe.id !== currentMeal.id);
        
        // Score remaining recipes
        const scoredRecipes = this.scoreRecipes(availableRecipes, {
            budget: params.weeklyBudget,
            people: params.adults + params.kids,
            location: params.location,
            mealsNeeded: params.mealsCount
        });
        
        // Select best alternative
        if (scoredRecipes.length > 0) {
            const replacement = scoredRecipes[0];
            const scaledReplacement = this.scalePortions([replacement], 
                params.adults + params.kids, 
                params.kidAges ? params.kidAges.split(',').map(age => parseInt(age.trim())).filter(age => !isNaN(age)) : []
            )[0];
            
            this.selectedMeals[mealIndex] = scaledReplacement;
            return scaledReplacement;
        }
        
        return null;
    }

    // Get current meal selection
    getSelectedMeals() {
        return this.selectedMeals;
    }

    // Calculate total cost of selected meals
    getTotalCost() {
        return this.selectedMeals.reduce((total, meal) => total + meal.pricing.totalCost, 0);
    }

    // Get ingredient summary for shopping list
    getIngredientSummary() {
        const ingredientMap = new Map();
        
        for (const meal of this.selectedMeals) {
            for (const ingredient of meal.ingredients) {
                const key = `${ingredient.name}-${ingredient.unit}`;
                
                if (ingredientMap.has(key)) {
                    const existing = ingredientMap.get(key);
                    existing.amount += ingredient.amount;
                    existing.meals.push(meal.name);
                } else {
                    ingredientMap.set(key, {
                        name: ingredient.name,
                        amount: ingredient.amount,
                        unit: ingredient.unit,
                        category: ingredient.category,
                        meals: [meal.name]
                    });
                }
            }
        }
        
        return Array.from(ingredientMap.values());
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MealSelector };
}