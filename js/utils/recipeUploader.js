// Auto-upload recipes to tcoffin-dashboard website
class RecipeUploader {
    constructor() {
        this.apiEndpoint = '/api/recipes'; // This would be your dashboard's API
        this.authToken = null;
        this.uploadQueue = [];
        this.uploadStatus = {
            pending: 0,
            success: 0,
            failed: 0
        };
    }

    // Initialize uploader with authentication
    async initialize(authToken = null) {
        this.authToken = authToken;
        
        // If no token provided, check if we can get one from localStorage or prompt user
        if (!this.authToken) {
            this.authToken = localStorage.getItem('tcoffin-dashboard-token');
        }
        
        if (!this.authToken) {
            throw new Error('Authentication required for recipe upload');
        }
        
        return true;
    }

    // Convert meal plan recipes to blog post format
    convertRecipesToBlogPosts(selectedMeals, userInfo = {}) {
        const blogPosts = [];
        const currentDate = new Date();
        
        for (const meal of selectedMeals) {
            const blogPost = this.convertMealToBlogPost(meal, userInfo, currentDate);
            blogPosts.push(blogPost);
        }
        
        // Also create a master meal plan post
        const mealPlanPost = this.createMealPlanSummaryPost(selectedMeals, userInfo, currentDate);
        blogPosts.unshift(mealPlanPost);
        
        return blogPosts;
    }

    // Convert individual meal to blog post
    convertMealToBlogPost(meal, userInfo, currentDate) {
        // Calculate nutritional info per serving
        const nutrition = meal.nutrition;
        const scaledNutrition = {
            calories: Math.round(nutrition.calories * meal.scaleFactor),
            protein: Math.round(nutrition.protein * meal.scaleFactor),
            carbs: Math.round(nutrition.carbs * meal.scaleFactor),
            fat: Math.round(nutrition.fat * meal.scaleFactor)
        };

        // Generate blog post content
        const content = this.generateRecipeContent(meal, scaledNutrition, userInfo);
        
        return {
            title: `Budget-Friendly Recipe: ${meal.name}`,
            slug: this.generateSlug(meal.name),
            content: content,
            excerpt: meal.description,
            status: 'draft', // Start as draft for review
            categories: ['Recipes', 'Budget Meals', 'Family Cooking'],
            tags: meal.tags.map(tag => this.capitalizeFirstLetter(tag)),
            metadata: {
                servings: meal.scaledServings,
                prepTime: meal.prepTime,
                cookTime: meal.cookTime,
                difficulty: meal.difficulty,
                estimatedCost: meal.pricing.totalCost,
                costPerServing: meal.pricing.costPerServing,
                nutrition: scaledNutrition,
                allergens: meal.allergens || [],
                originalRecipeId: meal.id,
                generatedByApp: 'Family Budget Meals',
                createdDate: currentDate.toISOString()
            },
            featuredImage: this.generateRecipeImagePrompt(meal),
            author: userInfo.name || 'Family Budget Meals App'
        };
    }

    // Generate comprehensive recipe content
    generateRecipeContent(meal, nutrition, userInfo) {
        let content = `# ${meal.name}\n\n`;
        
        // Introduction
        content += `${meal.description} This budget-friendly recipe serves ${meal.scaledServings} people `;
        content += `and costs approximately $${meal.pricing.totalCost.toFixed(2)} total `;
        content += `($${meal.pricing.costPerServing.toFixed(2)} per serving).\n\n`;
        
        // Recipe metadata
        content += `## Recipe Information\n\n`;
        content += `- **Prep Time:** ${meal.prepTime} minutes\n`;
        content += `- **Cook Time:** ${meal.cookTime} minutes\n`;
        content += `- **Total Time:** ${meal.prepTime + meal.cookTime} minutes\n`;
        content += `- **Difficulty:** ${meal.difficulty}\n`;
        content += `- **Serves:** ${meal.scaledServings} people\n`;
        content += `- **Estimated Cost:** $${meal.pricing.totalCost.toFixed(2)} ($${meal.pricing.costPerServing.toFixed(2)} per serving)\n\n`;
        
        // Nutrition information
        content += `## Nutritional Information (per serving)\n\n`;
        content += `- **Calories:** ${nutrition.calories}\n`;
        content += `- **Protein:** ${nutrition.protein}g\n`;
        content += `- **Carbohydrates:** ${nutrition.carbs}g\n`;
        content += `- **Fat:** ${nutrition.fat}g\n\n`;
        
        // Allergen information
        if (meal.allergens && meal.allergens.length > 0) {
            content += `## Allergen Information\n\n`;
            content += `⚠️ **Contains:** ${meal.allergens.join(', ')}\n\n`;
        }
        
        // Ingredients with costs
        content += `## Ingredients\n\n`;
        for (const ingredient of meal.ingredients) {
            const amount = ingredient.amount % 1 === 0 ? 
                ingredient.amount.toString() : 
                ingredient.amount.toFixed(2);
            
            // Calculate individual ingredient cost
            const ingredientPrice = getIngredientPrice(ingredient.name, ingredient.amount, ingredient.unit);
            
            content += `- ${amount} ${ingredient.unit} ${ingredient.name}`;
            content += ` (~$${ingredientPrice.price.toFixed(2)})\n`;
        }
        content += `\n*Total ingredient cost: ~$${meal.pricing.totalCost.toFixed(2)}*\n\n`;
        
        // Instructions
        content += `## Instructions\n\n`;
        meal.instructions.forEach((instruction, index) => {
            content += `${index + 1}. ${instruction}\n`;
        });
        content += `\n`;
        
        // Budget tips
        content += `## Budget Tips\n\n`;
        content += this.generateBudgetTips(meal);
        
        // Meal planning notes
        if (meal.commonIngredients && meal.commonIngredients.length > 0) {
            content += `## Meal Planning Notes\n\n`;
            content += `This recipe pairs well with other budget meals because it uses common ingredients: `;
            content += `${meal.commonIngredients.join(', ')}. Consider planning multiple meals that share these `;
            content += `ingredients to maximize your grocery budget.\n\n`;
        }
        
        // Scaling information
        if (meal.scaleFactor !== 1) {
            content += `## Recipe Scaling\n\n`;
            content += `This recipe has been scaled from the original ${meal.originalServings} servings `;
            content += `to ${meal.scaledServings} servings (${(meal.scaleFactor * 100).toFixed(0)}% of original). `;
            content += `If you need different portions, adjust all ingredients proportionally.\n\n`;
        }
        
        // Tags and categories
        content += `## Tags\n\n`;
        content += meal.tags.map(tag => `#${tag}`).join(' ') + '\n\n';
        
        // Footer
        content += `---\n\n`;
        content += `*This recipe was generated by the Family Budget Meals app to help families eat well on a budget. `;
        content += `Prices are estimated based on national averages and may vary by location.*\n\n`;
        content += `**Generated on:** ${new Date().toLocaleDateString()}\n`;
        
        return content;
    }

    // Generate budget tips for the recipe
    generateBudgetTips(meal) {
        const tips = [];
        
        // Generic budget tips based on meal type
        if (meal.tags.includes('large-batch')) {
            tips.push("Make extra portions and freeze leftovers for easy future meals.");
        }
        
        if (meal.tags.includes('slow-cooker')) {
            tips.push("Slow cooker meals are perfect for cheaper cuts of meat that become tender with long cooking.");
        }
        
        if (meal.commonIngredients && meal.commonIngredients.includes('beans')) {
            tips.push("Beans are an excellent source of protein and fiber at a fraction of the cost of meat.");
        }
        
        if (meal.commonIngredients && meal.commonIngredients.includes('rice')) {
            tips.push("Buy rice in bulk for maximum savings - it stores well and is incredibly versatile.");
        }
        
        // Ingredient-specific tips
        const hasGroundBeef = meal.ingredients.some(ing => ing.name.includes('ground beef'));
        if (hasGroundBeef) {
            tips.push("Buy ground beef in bulk when on sale and freeze in meal-sized portions.");
        }
        
        const hasChickenThighs = meal.ingredients.some(ing => ing.name.includes('chicken thigh'));
        if (hasChickenThighs) {
            tips.push("Chicken thighs are more flavorful and budget-friendly than chicken breasts.");
        }
        
        // Add at least one generic tip if none were added
        if (tips.length === 0) {
            tips.push("Shop sales and seasonal produce to keep costs down.");
            tips.push("Consider generic/store brands for pantry staples to save money.");
        }
        
        return tips.map(tip => `- ${tip}`).join('\n') + '\n\n';
    }

    // Create meal plan summary post
    createMealPlanSummaryPost(selectedMeals, userInfo, currentDate) {
        const totalCost = selectedMeals.reduce((sum, meal) => sum + meal.pricing.totalCost, 0);
        const avgCostPerMeal = totalCost / selectedMeals.length;
        
        let content = `# Weekly Budget Meal Plan\n\n`;
        content += `A complete ${selectedMeals.length}-meal plan designed to feed your family nutritiously `;
        content += `while staying within budget. Total estimated cost: $${totalCost.toFixed(2)} `;
        content += `($${avgCostPerMeal.toFixed(2)} average per meal).\n\n`;
        
        content += `## This Week's Meals\n\n`;
        selectedMeals.forEach((meal, index) => {
            content += `### ${index + 1}. ${meal.name}\n`;
            content += `- **Cost:** $${meal.pricing.totalCost.toFixed(2)} ($${meal.pricing.costPerServing.toFixed(2)} per serving)\n`;
            content += `- **Serves:** ${meal.scaledServings}\n`;
            content += `- **Time:** ${meal.prepTime + meal.cookTime} minutes total\n`;
            content += `- **Description:** ${meal.description}\n\n`;
        });
        
        // Budget breakdown
        content += `## Budget Breakdown\n\n`;
        content += `| Meal | Cost | Per Serving | Servings |\n`;
        content += `|------|------|-------------|----------|\n`;
        selectedMeals.forEach(meal => {
            content += `| ${meal.name} | $${meal.pricing.totalCost.toFixed(2)} | $${meal.pricing.costPerServing.toFixed(2)} | ${meal.scaledServings} |\n`;
        });
        content += `| **Total** | **$${totalCost.toFixed(2)}** | **$${avgCostPerMeal.toFixed(2)}** | **${selectedMeals.reduce((sum, meal) => sum + meal.scaledServings, 0)}** |\n\n`;
        
        // Shopping list preview
        const mealSelector = new MealSelector({}); // We'll use this just for ingredient summary
        mealSelector.selectedMeals = selectedMeals;
        const ingredients = mealSelector.getIngredientSummary();
        
        content += `## Shopping List Preview\n\n`;
        content += `This meal plan requires ${ingredients.length} unique ingredients. Here are the key items:\n\n`;
        
        // Group by category for preview
        const categories = {};
        ingredients.forEach(ing => {
            if (!categories[ing.category]) categories[ing.category] = [];
            categories[ing.category].push(ing);
        });
        
        Object.entries(categories).forEach(([category, items]) => {
            content += `**${category.charAt(0).toUpperCase() + category.slice(1)}:**\n`;
            items.slice(0, 5).forEach(item => { // Show first 5 items per category
                content += `- ${item.amount} ${item.unit} ${item.name}\n`;
            });
            if (items.length > 5) {
                content += `- ...and ${items.length - 5} more items\n`;
            }
            content += '\n';
        });
        
        content += `## Tips for Success\n\n`;
        content += `- Prep ingredients on Sunday for easier weeknight cooking\n`;
        content += `- Cook larger batches and use leftovers creatively\n`;
        content += `- Shop with a list and stick to it\n`;
        content += `- Buy generic brands for pantry staples\n`;
        content += `- Check store flyers for sales on key ingredients\n\n`;
        
        content += `---\n\n`;
        content += `*This meal plan was generated by the Family Budget Meals app. Individual recipe posts coming soon!*\n`;
        
        return {
            title: `Budget Meal Plan: ${selectedMeals.length} Meals for $${totalCost.toFixed(2)}`,
            slug: `budget-meal-plan-${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`,
            content: content,
            excerpt: `A complete ${selectedMeals.length}-meal plan for just $${totalCost.toFixed(2)} - perfect for budget-conscious families.`,
            status: 'draft',
            categories: ['Meal Planning', 'Budget Meals', 'Family Cooking'],
            tags: ['Meal Plan', 'Budget', 'Weekly Planning', 'Family Meals'],
            metadata: {
                mealCount: selectedMeals.length,
                totalCost: totalCost,
                avgCostPerMeal: avgCostPerMeal,
                generatedByApp: 'Family Budget Meals',
                createdDate: currentDate.toISOString(),
                includedMeals: selectedMeals.map(meal => ({
                    name: meal.name,
                    id: meal.id,
                    cost: meal.pricing.totalCost
                }))
            },
            author: userInfo.name || 'Family Budget Meals App'
        };
    }

    // Generate image prompt for AI image generation
    generateRecipeImagePrompt(meal) {
        const basePrompt = `A professional food photography shot of ${meal.name.toLowerCase()}, `;
        const stylePrompts = [
            'beautifully plated on a rustic wooden table',
            'served family-style in a cozy kitchen setting',
            'arranged appetizingly with natural lighting',
            'garnished and ready to serve'
        ];
        
        const additionalDetails = [];
        if (meal.tags.includes('comfort')) additionalDetails.push('warm and inviting atmosphere');
        if (meal.tags.includes('healthy')) additionalDetails.push('fresh ingredients visible');
        if (meal.tags.includes('kid-friendly')) additionalDetails.push('colorful and appealing presentation');
        
        return basePrompt + stylePrompts[Math.floor(Math.random() * stylePrompts.length)] + 
               (additionalDetails.length > 0 ? ', ' + additionalDetails.join(', ') : '');
    }

    // Upload recipes to dashboard
    async uploadRecipes(blogPosts, options = {}) {
        this.uploadQueue = [...blogPosts];
        this.uploadStatus = { pending: blogPosts.length, success: 0, failed: 0 };
        
        const results = [];
        
        for (const post of blogPosts) {
            try {
                const result = await this.uploadSingleRecipe(post, options);
                results.push({ success: true, post: post.title, result: result });
                this.uploadStatus.success++;
                this.uploadStatus.pending--;
                
                // Update progress if callback provided
                if (options.onProgress) {
                    options.onProgress({
                        completed: this.uploadStatus.success + this.uploadStatus.failed,
                        total: blogPosts.length,
                        current: post.title
                    });
                }
                
                // Small delay to avoid overwhelming the server
                await this.delay(500);
                
            } catch (error) {
                results.push({ success: false, post: post.title, error: error.message });
                this.uploadStatus.failed++;
                this.uploadStatus.pending--;
                
                console.error(`Failed to upload ${post.title}:`, error);
            }
        }
        
        return {
            results: results,
            summary: this.uploadStatus
        };
    }

    // Upload single recipe
    async uploadSingleRecipe(blogPost, options = {}) {
        // For demo purposes, we'll simulate the upload
        // In a real implementation, this would make an API call to your dashboard
        
        const uploadData = {
            title: blogPost.title,
            slug: blogPost.slug,
            content: blogPost.content,
            excerpt: blogPost.excerpt,
            status: options.publishImmediately ? 'published' : blogPost.status,
            categories: blogPost.categories,
            tags: blogPost.tags,
            metadata: blogPost.metadata,
            author: blogPost.author,
            createdAt: new Date().toISOString()
        };
        
        // Simulate API call
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (Math.random() > 0.1) { // 90% success rate for demo
                    resolve({
                        id: `recipe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        url: `https://tcoffin-dashboard.com/blog/${blogPost.slug}`,
                        status: 'uploaded'
                    });
                } else {
                    reject(new Error('Simulated upload failure'));
                }
            }, Math.random() * 1000 + 500); // Random delay 0.5-1.5 seconds
        });
        
        // Real implementation would be:
        /*
        const response = await fetch(this.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.authToken}`
            },
            body: JSON.stringify(uploadData)
        });
        
        if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
        }
        
        return await response.json();
        */
    }

    // Utility functions
    generateSlug(title) {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    }

    capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Get upload status
    getUploadStatus() {
        return this.uploadStatus;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RecipeUploader };
}