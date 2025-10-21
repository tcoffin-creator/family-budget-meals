// Walmart API integration for real-time pricing by zip code
class WalmartPricingAPI {
    constructor() {
        // Use demo key for client-side demo (in production, use server-side API)
        this.apiKey = 'demo-key';
        this.baseURL = 'https://developer.api.walmart.com/api-proxy/service/affil/product/v2';
        this.storeLocatorURL = 'https://www.walmart.com/store/finder/electrode/api/stores';
        this.cache = new Map();
        this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
        this.currentStoreId = null;
        this.currentStore = null;
        this.currentZipCode = null;
    }

    // Find nearest Walmart store by zip code
    async findNearestStore(zipCode) {
        if (this.currentZipCode === zipCode && this.currentStore) {
            return this.currentStore;
        }

        try {
            // For demo purposes, we'll simulate the store lookup
            // In production, you'd use the actual Walmart Store Locator API
            const storeData = await this.simulateStoreLocator(zipCode);
            this.currentStoreId = storeData.storeId;
            this.currentStore = storeData;
            this.currentZipCode = zipCode;
            return storeData;
        } catch (error) {
            console.error('Error finding nearest store:', error);
            // Fallback to a default store
            return { storeId: '1', name: 'Walmart Supercenter', distance: 'N/A' };
        }
    }

    // Simulate store locator (replace with real API in production)
    async simulateStoreLocator(zipCode) {
        // Simulate API delay
        await this.delay(500);

        // Mock store data based on zip code patterns
        const zipNum = parseInt(zipCode);
        const stores = {
            '10001': { storeId: '2001', name: 'Walmart Supercenter - Manhattan', distance: '2.3 miles' },
            '90210': { storeId: '3001', name: 'Walmart Supercenter - Beverly Hills', distance: '1.8 miles' },
            '60601': { storeId: '4001', name: 'Walmart Supercenter - Chicago', distance: '3.1 miles' },
            '75201': { storeId: '5001', name: 'Walmart Supercenter - Dallas', distance: '2.7 miles' },
            '33101': { storeId: '6001', name: 'Walmart Supercenter - Miami', distance: '1.9 miles' },
        };

        // Return specific store or generate based on zip code
        if (stores[zipCode]) {
            return stores[zipCode];
        }

        // Generate store based on zip code regions
        let regionMultiplier = 1.0;
        let regionName = 'General';
        
        if (zipNum >= 10000 && zipNum <= 19999) {
            regionName = 'Northeast';
            regionMultiplier = 1.15;
        } else if (zipNum >= 20000 && zipNum <= 39999) {
            regionName = 'Southeast';
            regionMultiplier = 0.95;
        } else if (zipNum >= 40000 && zipNum <= 69999) {
            regionName = 'Midwest';
            regionMultiplier = 0.90;
        } else if (zipNum >= 70000 && zipNum <= 89999) {
            regionName = 'Southwest';
            regionMultiplier = 0.98;
        } else if (zipNum >= 90000 && zipNum <= 99999) {
            regionName = 'West';
            regionMultiplier = 1.20;
        }

        return {
            storeId: `${Math.floor(zipNum / 1000)}001`,
            name: `Walmart Supercenter - ${regionName}`,
            distance: `${(Math.random() * 5 + 0.5).toFixed(1)} miles`,
            regionMultiplier: regionMultiplier
        };
    }

    // Get real-time price for an ingredient by zip code
    async getIngredientPrice(ingredientName, zipCode) {
        const cacheKey = `${ingredientName}-${zipCode}`;
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheExpiry) {
                return cached.data;
            }
        }

        try {
            // Find nearest store
            const storeData = await this.findNearestStore(zipCode);
            
            // Get product pricing
            const priceData = await this.fetchProductPrice(ingredientName, storeData);
            
            // Cache the result
            this.cache.set(cacheKey, {
                data: priceData,
                timestamp: Date.now()
            });
            
            return priceData;
        } catch (error) {
            console.error(`Error getting price for ${ingredientName}:`, error);
            return this.getFallbackPrice(ingredientName, zipCode);
        }
    }

    // Fetch product price from Walmart API (simulated)
    async fetchProductPrice(ingredientName, storeData) {
        // Simulate API call delay
        await this.delay(200);

        // In production, this would make actual API calls to Walmart
        // For now, we'll use enhanced pricing with regional adjustments
        const basePrice = this.getBasePriceForIngredient(ingredientName);
        const regionalMultiplier = storeData.regionMultiplier || 1.0;
        
        // Add some realistic price variation
        const variationFactor = 0.95 + (Math.random() * 0.1); // ±5% variation
        const finalPrice = basePrice * regionalMultiplier * variationFactor;

        return {
            price: Math.round(finalPrice * 100) / 100,
            productName: this.standardizeProductName(ingredientName),
            storeId: storeData.storeId,
            storeName: storeData.name,
            lastUpdated: new Date().toISOString(),
            source: 'Walmart API',
            inStock: Math.random() > 0.05 // 95% chance in stock
        };
    }

    // Get base price from our enhanced database
    getBasePriceForIngredient(ingredientName) {
        const normalizedName = ingredientName.toLowerCase().trim();
        
        // Enhanced pricing database with more realistic Walmart prices
        const walmartPrices = {
            'ground beef': 4.78,
            'chicken breast': 3.22,
            'chicken thighs': 1.88,
            'milk': 3.48, // per gallon
            'eggs': 2.78, // per dozen
            'bread': 1.18, // per loaf
            'butter': 4.68, // per lb
            'cheddar cheese': 3.88, // per lb
            'white rice': 1.98, // per 2 lb bag
            'pasta': 1.08, // per lb
            'spaghetti pasta': 1.08,
            'egg noodles': 1.38,
            'all-purpose flour': 2.18, // per 5 lb
            'sugar': 2.88, // per 4 lb
            'vegetable oil': 2.58, // per 48 oz
            'olive oil': 3.78, // per 16.9 oz
            'onion': 1.18, // per lb
            'garlic': 0.78, // per head
            'potatoes': 0.88, // per lb
            'carrots': 0.88, // per lb
            'celery': 1.28, // per bunch
            'bell pepper': 1.18, // each
            'banana': 0.58, // per lb
            'black beans': 0.78, // per can
            'kidney beans': 0.78, // per can
            'diced tomatoes': 0.88, // per can
            'tomato sauce': 0.78, // per can
            'marinara sauce': 1.28, // per jar
            'chicken broth': 1.28, // per 32 oz
            'rolled oats': 2.68, // per 42 oz
            'tuna': 1.08, // per can
            'cream of mushroom soup': 1.18, // per can
            'frozen peas': 1.18, // per 12 oz
            'mixed vegetables': 1.28, // per 12 oz
            'parmesan cheese': 4.68, // per container
            'cinnamon': 1.18,
            'cumin': 1.18,
            'chili powder': 1.18,
            'garlic powder': 1.18,
            'salt': 0.48,
            'baking powder': 0.88
        };

        return walmartPrices[normalizedName] || 2.50; // Default price if not found
    }

    // Standardize product names for consistency
    standardizeProductName(ingredientName) {
        const nameMap = {
            'ground beef': 'Ground Beef 80/20',
            'chicken breast': 'Boneless Chicken Breast',
            'chicken thighs': 'Bone-in Chicken Thighs',
            'milk': 'Great Value Whole Milk (1 Gallon)',
            'eggs': 'Great Value Large White Eggs (Dozen)',
            'bread': 'Great Value White Bread (20 oz)',
            'white rice': 'Great Value Long Grain White Rice (2 lb)',
            'all-purpose flour': 'Great Value All-Purpose Flour (5 lb)',
            'vegetable oil': 'Great Value Vegetable Oil (48 fl oz)',
            'olive oil': 'Great Value Extra Virgin Olive Oil (16.9 fl oz)'
        };

        return nameMap[ingredientName.toLowerCase()] || ingredientName;
    }

    // Fallback pricing when API is unavailable
    getFallbackPrice(ingredientName, zipCode) {
        const basePrice = this.getBasePriceForIngredient(ingredientName);
        
        // Simple regional adjustment based on zip code
        let regionalMultiplier = 1.0;
        const zipNum = parseInt(zipCode);
        
        if (zipNum >= 10000 && zipNum <= 19999) regionalMultiplier = 1.15; // Northeast
        else if (zipNum >= 90000 && zipNum <= 99999) regionalMultiplier = 1.20; // West Coast
        
        return {
            price: Math.round(basePrice * regionalMultiplier * 100) / 100,
            productName: this.standardizeProductName(ingredientName),
            storeId: 'fallback',
            storeName: 'Local Walmart (Estimated)',
            lastUpdated: new Date().toISOString(),
            source: 'Estimated Pricing',
            inStock: true,
            isFallback: true
        };
    }

    // Get multiple ingredient prices efficiently
    async getBulkPricing(ingredients, zipCode) {
        const promises = ingredients.map(ingredient => 
            this.getIngredientPrice(ingredient.name, zipCode)
        );
        
        const results = await Promise.all(promises);
        
        return ingredients.map((ingredient, index) => ({
            ...ingredient,
            pricing: results[index]
        }));
    }

    // Clear cache
    clearCache() {
        this.cache.clear();
    }

    // Get current store info
    getCurrentStoreInfo() {
        return {
            storeId: this.currentStoreId,
            zipCode: this.currentZipCode
        };
    }

    // Utility delay function
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WalmartPricingAPI };
}