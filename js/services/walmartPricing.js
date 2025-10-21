// Walmart Pricing Service for real-time product pricing
class WalmartPricingService {
    constructor(apiConfig) {
        this.apiConfig = apiConfig;
        this.baseUrl = 'https://walmart.io/api/catalog';
        this.priceCache = new Map(); // Cache prices to reduce API calls
        this.cacheTimeout = 30 * 60 * 1000; // 30 minutes
    }

    // Get real-time pricing for a product
    async getProductPricing(searchTerm, zipCode) {
        if (!this.apiConfig.hasWalmartKey()) {
            // Fallback to estimated pricing if no API key
            return this.getEstimatedPricing(searchTerm);
        }

        const cacheKey = `${searchTerm}-${zipCode}`;
        
        // Check cache first
        if (this.priceCache.has(cacheKey)) {
            const cached = this.priceCache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
        }

        try {
            // First, search for the product
            const searchResults = await this.searchProducts(searchTerm, zipCode);
            
            if (searchResults.length === 0) {
                console.warn(`No products found for: ${searchTerm}`);
                return this.getEstimatedPricing(searchTerm);
            }

            // Get the best matching product (first result)
            const product = searchResults[0];
            
            // Get pricing for the specific product
            const pricing = await this.getProductDetails(product.id, zipCode);
            
            // Cache the result
            this.priceCache.set(cacheKey, {
                data: pricing,
                timestamp: Date.now()
            });
            
            return pricing;
            
        } catch (error) {
            console.error(`Error getting Walmart pricing for ${searchTerm}:`, error);
            return this.getEstimatedPricing(searchTerm);
        }
    }

    // Search for products using Walmart API
    async searchProducts(searchTerm, zipCode) {
        const params = new URLSearchParams({
            query: searchTerm,
            numItems: 5,
            format: 'json'
        });

        if (zipCode) {
            params.append('postalCode', zipCode);
        }

        const response = await fetch(`${this.baseUrl}/search?${params}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.apiConfig.getWalmartKey()}`,
                'WM_CONSUMER.ID': this.apiConfig.getWalmartKey(),
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Walmart search API error: ${response.status}`);
        }

        const data = await response.json();
        return data.items || [];
    }

    // Get detailed product information including pricing
    async getProductDetails(productId, zipCode) {
        const params = new URLSearchParams({
            format: 'json'
        });

        if (zipCode) {
            params.append('postalCode', zipCode);
        }

        const response = await fetch(`${this.baseUrl}/items/${productId}?${params}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.apiConfig.getWalmartKey()}`,
                'WM_CONSUMER.ID': this.apiConfig.getWalmartKey(),
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Walmart product API error: ${response.status}`);
        }

        const product = await response.json();
        
        return {
            productId: product.itemId,
            name: product.name,
            brand: product.brandName || '',
            price: parseFloat(product.salePrice || product.msrp || 0),
            originalPrice: parseFloat(product.msrp || 0),
            size: product.size || '',
            unit: this.extractUnit(product.name),
            inStock: product.stock === 'Available',
            imageUrl: product.largeImage || product.mediumImage || '',
            upc: product.upc || '',
            category: product.categoryPath || '',
            description: product.shortDescription || product.name,
            lastUpdated: new Date().toISOString()
        };
    }

    // Extract unit information from product name
    extractUnit(productName) {
        const unitPatterns = [
            /(\d+)\s*oz/i,
            /(\d+)\s*lb/i,  
            /(\d+)\s*lbs/i,
            /(\d+)\s*count/i,
            /(\d+)\s*ct/i,
            /(\d+)\s*pack/i,
            /(\d+)\s*gal/i,
            /(\d+)\s*qt/i
        ];

        for (const pattern of unitPatterns) {
            const match = productName.match(pattern);
            if (match) {
                return match[0];
            }
        }
        
        return 'each';
    }

    // Get pricing for multiple products efficiently
    async getBulkPricing(products, zipCode) {
        const pricingPromises = products.map(product => 
            this.getProductPricing(product.walmartSearchTerm || product.name, zipCode)
                .catch(error => {
                    console.error(`Failed to get pricing for ${product.name}:`, error);
                    return this.getEstimatedPricing(product.name);
                })
        );

        const results = await Promise.all(pricingPromises);
        
        return products.map((product, index) => ({
            ...product,
            pricing: results[index]
        }));
    }

    // Fallback estimated pricing when API is unavailable
    getEstimatedPricing(productName) {
        const lowerName = productName.toLowerCase();
        
        // Estimated prices based on common grocery items
        const estimatedPrices = {
            // Produce
            onion: 1.50,
            carrots: 1.25,
            potatoes: 2.99,
            garlic: 0.75,
            banana: 1.99,
            'bell pepper': 1.50,
            celery: 1.75,
            lettuce: 2.25,
            tomato: 2.50,
            
            // Meat
            'ground beef': 4.99,
            'chicken breast': 5.99,
            'chicken thigh': 3.99,
            
            // Dairy
            milk: 3.49,
            eggs: 2.99,
            butter: 4.25,
            cheese: 3.99,
            
            // Pantry
            flour: 2.49,
            rice: 3.99,
            pasta: 1.25,
            'marinara sauce': 1.75,
            'diced tomatoes': 1.15,
            beans: 1.25,
            broth: 2.49,
            oil: 3.99,
            sugar: 2.99,
            oats: 4.49,
            bread: 2.25,
            
            // Frozen
            'frozen vegetables': 1.99,
            'frozen peas': 1.75,
            
            // Spices
            salt: 0.99,
            pepper: 1.99,
            cumin: 1.49,
            'baking powder': 1.25
        };

        let estimatedPrice = 2.99; // Default price
        
        // Try to match product name with estimated prices
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

    // Clear price cache
    clearCache() {
        this.priceCache.clear();
    }

    // Get cache statistics
    getCacheStats() {
        return {
            size: this.priceCache.size,
            timeout: this.cacheTimeout / (1000 * 60) + ' minutes'
        };
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.WalmartPricingService = WalmartPricingService;
}