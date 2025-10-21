// Secure API Client for Cloudflare Functions
class SecureAPIClient {
    constructor() {
        // Use relative URLs for Cloudflare Pages Functions
        this.baseUrl = '';
        this.endpoints = {
            generateRecipes: '/api/generate-recipes',
            getPricing: '/api/get-pricing'
        };
    }

    // Generate AI recipes using secure backend
    async generateHealthyRecipes(familySize, budget, zipCode, dietaryRestrictions = [], requestData = null) {
        try {
            // Use requestData if provided, otherwise use legacy parameters
            const payload = requestData || {
                familySize,
                budget,
                zipCode,
                dietaryRestrictions
            };

            const response = await fetch(`${this.baseUrl}/functions/generate-recipes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `API error: ${response.status}`);
            }

            const data = await response.json();
            return data.recipes;
            
        } catch (error) {
            console.error('Error generating AI recipes:', error);
            throw new Error('Failed to generate recipes with AI: ' + error.message);
        }
    }

    // Get real-time pricing using secure backend
    async getBulkPricing(ingredients, zipCode) {
        try {
            console.log(`🔍 Getting real-time pricing for ${ingredients.length} ingredients in ${zipCode}`);
            
            const response = await fetch(`${this.baseUrl}/functions/get-pricing`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ingredients,
                    zipCode
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.warn('❌ Real-time pricing API error:', errorData.error);
                
                // Return ingredients with local fallback pricing
                return ingredients.map(ingredient => ({
                    ...ingredient,
                    pricing: this.getEstimatedPricing(ingredient.name)
                }));
            }

            const data = await response.json();
            
            // Log the pricing source for debugging
            const sources = [...new Set(data.pricedIngredients.map(item => item.source))];
            console.log(`✅ Pricing completed using sources: ${sources.join(', ')}`);
            
            if (data.isEstimated) {
                console.warn('⚠️ Some pricing is estimated:', data.error);
            }
            
            return data.pricedIngredients;
            
        } catch (error) {
            console.error('❌ Error getting real-time pricing:', error);
            
            // Final fallback to local estimated pricing
            console.log('🔄 Using local fallback pricing');
            return ingredients.map(ingredient => ({
                ...ingredient,
                pricing: this.getEstimatedPricing(ingredient.name)
            }));
        }
    }

    // Fallback estimated pricing (same as backend)
    getEstimatedPricing(productName) {
        const lowerName = productName.toLowerCase();
        
        const estimatedPrices = {
            // Produce
            onion: 1.50, carrots: 1.25, potatoes: 2.99, garlic: 0.75, banana: 1.99,
            'bell pepper': 1.50, celery: 1.75, lettuce: 2.25, tomato: 2.50,
            
            // Meat
            'ground beef': 4.99, 'chicken breast': 5.99, 'chicken thigh': 3.99,
            
            // Dairy
            milk: 3.49, eggs: 2.99, butter: 4.25, cheese: 3.99,
            
            // Pantry
            flour: 2.49, rice: 3.99, pasta: 1.25, 'marinara sauce': 1.75,
            'diced tomatoes': 1.15, beans: 1.25, broth: 2.49, oil: 3.99,
            sugar: 2.99, oats: 4.49, bread: 2.25,
            
            // Frozen
            'frozen vegetables': 1.99, 'frozen peas': 1.75,
            
            // Spices
            salt: 0.99, pepper: 1.99, cumin: 1.49, 'baking powder': 1.25
        };

        let estimatedPrice = 2.99; // Default price
        
        for (const [key, price] of Object.entries(estimatedPrices)) {
            if (lowerName.includes(key)) {
                estimatedPrice = price;
                break;
            }
        }

        return {
            productId: 'estimated',
            name: productName,
            price: estimatedPrice,
            originalPrice: estimatedPrice,
            size: 'Standard',
            unit: 'each',
            inStock: true,
            description: `${productName} (estimated pricing)`,
            isEstimated: true,
            lastUpdated: new Date().toISOString()
        };
    }

    // Health check for API availability
    async checkHealth() {
        try {
            // Try a simple request to see if functions are available
            const response = await fetch(`${this.baseUrl}/functions/generate-recipes`, {
                method: 'OPTIONS'
            });
            return response.ok;
        } catch (error) {
            console.warn('API health check failed:', error);
            return false;
        }
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.SecureAPIClient = SecureAPIClient;
}