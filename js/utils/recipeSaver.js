// Recipe Saver - Handle saving and managing user's favorite recipes
class RecipeSaver {
    constructor() {
        this.storageKey = 'familyBudgetMeals_savedRecipes';
        this.mealPlansKey = 'familyBudgetMeals_savedMealPlans';
        this.init();
    }

    init() {
        this.ensureStorageStructure();
    }

    // Ensure storage has proper structure
    ensureStorageStructure() {
        if (!localStorage.getItem(this.storageKey)) {
            localStorage.setItem(this.storageKey, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.mealPlansKey)) {
            localStorage.setItem(this.mealPlansKey, JSON.stringify([]));
        }
    }

    // Save individual recipe
    saveRecipe(recipe, userNotes = '') {
        const savedRecipes = this.getSavedRecipes();
        
        const recipeToSave = {
            id: recipe.id || this.generateId(),
            name: recipe.name,
            description: recipe.description,
            servings: recipe.servings,
            prepTime: recipe.prepTime,
            cookTime: recipe.cookTime,
            difficulty: recipe.difficulty,
            ingredients: recipe.ingredients,
            instructions: recipe.instructions,
            tags: recipe.tags || [],
            userNotes: userNotes,
            savedDate: new Date().toISOString(),
            pricing: recipe.pricing || null
        };

        // Check if recipe already exists
        const existingIndex = savedRecipes.findIndex(r => r.id === recipeToSave.id);
        
        if (existingIndex >= 0) {
            // Update existing recipe
            savedRecipes[existingIndex] = recipeToSave;
        } else {
            // Add new recipe
            savedRecipes.push(recipeToSave);
        }

        localStorage.setItem(this.storageKey, JSON.stringify(savedRecipes));
        return recipeToSave;
    }

    // Save entire meal plan
    saveMealPlan(mealPlan, userParams, shoppingList, planName = '') {
        const savedMealPlans = this.getSavedMealPlans();
        
        const mealPlanToSave = {
            id: this.generateId(),
            name: planName || `Meal Plan - ${new Date().toLocaleDateString()}`,
            meals: mealPlan,
            parameters: userParams,
            shoppingList: shoppingList,
            totalCost: shoppingList.totals ? shoppingList.totals.totalCost : 0,
            mealCount: mealPlan.length,
            savedDate: new Date().toISOString()
        };

        savedMealPlans.push(mealPlanToSave);
        localStorage.setItem(this.mealPlansKey, JSON.stringify(savedMealPlans));
        
        return mealPlanToSave;
    }

    // Get all saved recipes
    getSavedRecipes() {
        try {
            return JSON.parse(localStorage.getItem(this.storageKey)) || [];
        } catch (error) {
            console.error('Error loading saved recipes:', error);
            return [];
        }
    }

    // Get all saved meal plans
    getSavedMealPlans() {
        try {
            return JSON.parse(localStorage.getItem(this.mealPlansKey)) || [];
        } catch (error) {
            console.error('Error loading saved meal plans:', error);
            return [];
        }
    }

    // Delete saved recipe
    deleteRecipe(recipeId) {
        const savedRecipes = this.getSavedRecipes();
        const filteredRecipes = savedRecipes.filter(r => r.id !== recipeId);
        localStorage.setItem(this.storageKey, JSON.stringify(filteredRecipes));
        return filteredRecipes;
    }

    // Delete saved meal plan
    deleteMealPlan(planId) {
        const savedMealPlans = this.getSavedMealPlans();
        const filteredPlans = savedMealPlans.filter(p => p.id !== planId);
        localStorage.setItem(this.mealPlansKey, JSON.stringify(filteredPlans));
        return filteredPlans;
    }

    // Export recipes as JSON
    exportRecipes(recipeIds = null) {
        const savedRecipes = this.getSavedRecipes();
        const recipesToExport = recipeIds ? 
            savedRecipes.filter(r => recipeIds.includes(r.id)) : 
            savedRecipes;

        const exportData = {
            type: 'familyBudgetMeals_recipes',
            version: '1.0',
            exportDate: new Date().toISOString(),
            recipes: recipesToExport
        };

        return JSON.stringify(exportData, null, 2);
    }

    // Export meal plan as JSON
    exportMealPlan(planId) {
        const savedMealPlans = this.getSavedMealPlans();
        const mealPlan = savedMealPlans.find(p => p.id === planId);
        
        if (!mealPlan) return null;

        const exportData = {
            type: 'familyBudgetMeals_mealPlan',
            version: '1.0',
            exportDate: new Date().toISOString(),
            mealPlan: mealPlan
        };

        return JSON.stringify(exportData, null, 2);
    }

    // Export shopping list as text
    exportShoppingListText(shoppingList) {
        let text = `Family Budget Meals - Shopping List\n`;
        text += `Generated: ${new Date().toLocaleDateString()}\n`;
        text += `Total Cost: $${shoppingList.totals.totalCost.toFixed(2)}\n\n`;

        // Group items by category
        Object.keys(shoppingList.categories).forEach(categoryKey => {
            const category = shoppingList.categories[categoryKey];
            if (category.items && category.items.length > 0) {
                text += `${category.name}:\n`;
                category.items.forEach(item => {
                    const displayName = item.storeUnit || `${item.amount} ${item.unit} ${item.name}`;
                    text += `  ☐ ${displayName} - $${item.price.toFixed(2)}\n`;
                });
                text += '\n';
            }
        });

        return text;
    }

    // Import recipes from JSON
    importRecipes(jsonData) {
        try {
            const importData = JSON.parse(jsonData);
            
            if (importData.type !== 'familyBudgetMeals_recipes') {
                throw new Error('Invalid file format');
            }

            const savedRecipes = this.getSavedRecipes();
            let importedCount = 0;

            importData.recipes.forEach(recipe => {
                // Check if recipe already exists
                const existingIndex = savedRecipes.findIndex(r => r.id === recipe.id);
                
                if (existingIndex === -1) {
                    // Add recipe with new saved date
                    recipe.savedDate = new Date().toISOString();
                    savedRecipes.push(recipe);
                    importedCount++;
                }
            });

            localStorage.setItem(this.storageKey, JSON.stringify(savedRecipes));
            return { success: true, imported: importedCount };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Generate unique ID
    generateId() {
        return 'recipe_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Download file helper
    downloadFile(content, filename, contentType = 'application/json') {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Check if recipe is saved
    isRecipeSaved(recipeId) {
        const savedRecipes = this.getSavedRecipes();
        return savedRecipes.some(r => r.id === recipeId);
    }

    // Get storage usage stats
    getStorageStats() {
        const recipes = this.getSavedRecipes();
        const mealPlans = this.getSavedMealPlans();
        
        return {
            totalRecipes: recipes.length,
            totalMealPlans: mealPlans.length,
            storageUsed: new Blob([
                localStorage.getItem(this.storageKey) || '',
                localStorage.getItem(this.mealPlansKey) || ''
            ]).size
        };
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.RecipeSaver = RecipeSaver;
}