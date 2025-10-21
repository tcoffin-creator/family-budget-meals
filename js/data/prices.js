// Walmart-based pricing database with regional adjustments
const INGREDIENT_PRICES = {
    // Produce prices (per lb unless specified)
    produce: {
        'banana': { price: 0.58, unit: 'lb', source: 'Walmart', lastUpdated: '2024-10-15' },
        'onion': { price: 1.28, unit: 'lb', source: 'Walmart', lastUpdated: '2024-10-15' },
        'potatoes': { price: 0.98, unit: 'lb', source: 'Walmart', lastUpdated: '2024-10-15' },
        'carrots': { price: 0.98, unit: 'lb', source: 'Walmart', lastUpdated: '2024-10-15' },
        'celery': { price: 1.48, unit: 'bunch', source: 'Walmart', lastUpdated: '2024-10-15' },
        'bell pepper': { price: 1.28, unit: 'each', source: 'Walmart', lastUpdated: '2024-10-15' },
        'garlic': { price: 0.88, unit: 'head', source: 'Walmart', lastUpdated: '2024-10-15' }
    },

    // Dairy prices
    dairy: {
        'milk': { price: 3.68, unit: 'gallon', source: 'Walmart', lastUpdated: '2024-10-15' },
        'eggs': { price: 2.98, unit: 'dozen', source: 'Walmart', lastUpdated: '2024-10-15' },
        'butter': { price: 4.98, unit: 'lb', source: 'Walmart', lastUpdated: '2024-10-15' },
        'cheddar cheese': { price: 3.98, unit: 'lb', source: 'Walmart', lastUpdated: '2024-10-15' },
        'parmesan cheese': { price: 4.98, unit: 'container', source: 'Walmart', lastUpdated: '2024-10-15' }
    },

    // Meat prices (per lb)
    meat: {
        'ground beef': { price: 4.98, unit: 'lb', source: 'Walmart', lastUpdated: '2024-10-15' },
        'chicken breast': { price: 3.48, unit: 'lb', source: 'Walmart', lastUpdated: '2024-10-15' },
        'chicken thighs': { price: 1.98, unit: 'lb', source: 'Walmart', lastUpdated: '2024-10-15' }
    },

    // Pantry staples
    pantry: {
        'rolled oats': { price: 2.98, unit: '42oz', source: 'Walmart', lastUpdated: '2024-10-15' },
        'white rice': { price: 2.68, unit: '5lb', source: 'Walmart', lastUpdated: '2024-10-15' },
        'all-purpose flour': { price: 2.98, unit: '5lb', source: 'Walmart', lastUpdated: '2024-10-15' },
        'spaghetti pasta': { price: 1.28, unit: 'lb', source: 'Walmart', lastUpdated: '2024-10-15' },
        'egg noodles': { price: 1.48, unit: '12oz', source: 'Walmart', lastUpdated: '2024-10-15' },
        'bread': { price: 1.28, unit: 'loaf', source: 'Walmart', lastUpdated: '2024-10-15' },
        'black beans': { price: 0.88, unit: 'can', source: 'Walmart', lastUpdated: '2024-10-15' },
        'kidney beans': { price: 0.88, unit: 'can', source: 'Walmart', lastUpdated: '2024-10-15' },
        'dried lentils': { price: 1.68, unit: 'lb', source: 'Walmart', lastUpdated: '2024-10-15' },
        'diced tomatoes': { price: 0.98, unit: 'can', source: 'Walmart', lastUpdated: '2024-10-15' },
        'tomato sauce': { price: 0.88, unit: 'can', source: 'Walmart', lastUpdated: '2024-10-15' },
        'marinara sauce': { price: 1.48, unit: 'jar', source: 'Walmart', lastUpdated: '2024-10-15' },
        'tomato soup': { price: 1.28, unit: 'can', source: 'Walmart', lastUpdated: '2024-10-15' },
        'cream of mushroom soup': { price: 1.28, unit: 'can', source: 'Walmart', lastUpdated: '2024-10-15' },
        'chicken broth': { price: 1.48, unit: '32oz', source: 'Walmart', lastUpdated: '2024-10-15' },
        'vegetable broth': { price: 1.48, unit: '32oz', source: 'Walmart', lastUpdated: '2024-10-15' },
        'tuna': { price: 1.28, unit: 'can', source: 'Walmart', lastUpdated: '2024-10-15' },
        'olive oil': { price: 3.98, unit: '16.9oz', source: 'Walmart', lastUpdated: '2024-10-15' },
        'vegetable oil': { price: 2.98, unit: '48oz', source: 'Walmart', lastUpdated: '2024-10-15' },
        'sugar': { price: 2.98, unit: '4lb', source: 'Walmart', lastUpdated: '2024-10-15' },
        'honey': { price: 3.98, unit: '12oz', source: 'Walmart', lastUpdated: '2024-10-15' },
        'baking powder': { price: 0.98, unit: 'container', source: 'Walmart', lastUpdated: '2024-10-15' },
        'salt': { price: 0.58, unit: 'container', source: 'Walmart', lastUpdated: '2024-10-15' },
        'breadcrumbs': { price: 1.48, unit: 'container', source: 'Walmart', lastUpdated: '2024-10-15' }
    },

    // Spices and seasonings
    spices: {
        'cinnamon': { price: 1.28, unit: 'container', source: 'Walmart', lastUpdated: '2024-10-15' },
        'cumin': { price: 1.28, unit: 'container', source: 'Walmart', lastUpdated: '2024-10-15' },
        'chili powder': { price: 1.28, unit: 'container', source: 'Walmart', lastUpdated: '2024-10-15' },
        'garlic powder': { price: 1.28, unit: 'container', source: 'Walmart', lastUpdated: '2024-10-15' },
        'rosemary': { price: 1.28, unit: 'container', source: 'Walmart', lastUpdated: '2024-10-15' },
        'thyme': { price: 1.28, unit: 'container', source: 'Walmart', lastUpdated: '2024-10-15' },
        'bay leaves': { price: 1.28, unit: 'container', source: 'Walmart', lastUpdated: '2024-10-15' }
    },

    // Frozen items
    frozen: {
        'mixed vegetables': { price: 1.48, unit: '12oz', source: 'Walmart', lastUpdated: '2024-10-15' },
        'frozen peas': { price: 1.28, unit: '12oz', source: 'Walmart', lastUpdated: '2024-10-15' }
    }
};

// Regional price adjustments (multiplier)
const REGIONAL_ADJUSTMENTS = {
    'AL': 0.92, 'AK': 1.32, 'AZ': 1.05, 'AR': 0.89, 'CA': 1.25,
    'CO': 1.08, 'CT': 1.18, 'DE': 1.05, 'FL': 1.02, 'GA': 0.95,
    'HI': 1.45, 'ID': 0.98, 'IL': 1.08, 'IN': 0.95, 'IA': 0.92,
    'KS': 0.94, 'KY': 0.91, 'LA': 0.93, 'ME': 1.12, 'MD': 1.15,
    'MA': 1.22, 'MI': 0.98, 'MN': 1.05, 'MS': 0.88, 'MO': 0.92,
    'MT': 1.02, 'NE': 0.94, 'NV': 1.08, 'NH': 1.12, 'NJ': 1.18,
    'NM': 0.98, 'NY': 1.28, 'NC': 0.96, 'ND': 0.95, 'OH': 0.96,
    'OK': 0.91, 'OR': 1.12, 'PA': 1.05, 'RI': 1.15, 'SC': 0.94,
    'SD': 0.95, 'TN': 0.92, 'TX': 0.96, 'UT': 1.02, 'VT': 1.15,
    'VA': 1.08, 'WA': 1.15, 'WV': 0.94, 'WI': 0.98, 'WY': 1.05
};

// Unit conversion helpers
const UNIT_CONVERSIONS = {
    // Convert everything to a standard unit for calculation
    volume: {
        'tsp': 0.021, // to cups
        'tbsp': 0.063, // to cups
        'cups': 1,
        'pint': 2,
        'quart': 4,
        'gallon': 16,
        'oz': 0.125 // fluid oz to cups
    },
    weight: {
        'oz': 0.063, // to lbs
        'lb': 1,
        'lbs': 1
    },
    count: {
        'whole': 1,
        'each': 1,
        'cloves': 0.1, // garlic cloves per head
        'stalks': 0.33, // celery stalks per bunch
        'slices': 0.05 // bread slices per loaf
    }
};

// Cache for calculated prices
let priceCache = new Map();

// Get price for an ingredient with regional adjustment
function getIngredientPrice(ingredient, amount, unit, location = null) {
    const cacheKey = `${ingredient}-${amount}-${unit}-${location}`;
    
    if (priceCache.has(cacheKey)) {
        return priceCache.get(cacheKey);
    }

    // Find ingredient in database
    let ingredientData = null;
    let category = null;

    for (const [cat, items] of Object.entries(INGREDIENT_PRICES)) {
        if (items[ingredient]) {
            ingredientData = items[ingredient];
            category = cat;
            break;
        }
    }

    if (!ingredientData) {
        // Default price for unknown ingredients
        const defaultPrice = { price: 2.00, unit: 'lb', estimated: true };
        priceCache.set(cacheKey, defaultPrice);
        return defaultPrice;
    }

    // Calculate price based on amount and unit
    let calculatedPrice = calculateUnitPrice(ingredientData, amount, unit);
    
    // Apply regional adjustment if location provided
    if (location) {
        const state = extractStateFromLocation(location);
        const adjustment = REGIONAL_ADJUSTMENTS[state] || 1.0;
        calculatedPrice *= adjustment;
    }

    const result = {
        price: Math.round(calculatedPrice * 100) / 100, // Round to 2 decimal places
        unit: unit,
        source: ingredientData.source,
        lastUpdated: ingredientData.lastUpdated,
        regional: location ? true : false
    };

    priceCache.set(cacheKey, result);
    return result;
}

// Calculate price based on unit conversions
function calculateUnitPrice(ingredientData, amount, requestedUnit) {
    const basePrice = ingredientData.price;
    const baseUnit = ingredientData.unit;
    
    // If units match, simple calculation
    if (baseUnit === requestedUnit) {
        return basePrice * amount;
    }

    // Handle complex unit conversions
    if (baseUnit === 'gallon' && (requestedUnit === 'cups' || requestedUnit === 'cup')) {
        return (basePrice / 16) * amount; // 16 cups per gallon
    }
    
    if (baseUnit === '42oz' && requestedUnit === 'cups') {
        return (basePrice / 5.25) * amount; // ~5.25 cups per 42oz oats
    }
    
    if (baseUnit === '5lb' && (requestedUnit === 'cups' || requestedUnit === 'cup')) {
        // Approximate: 5lb flour = ~20 cups, 5lb rice = ~11 cups
        const cupsPerPound = requestedUnit.includes('flour') ? 4 : 2.2;
        return (basePrice / (5 * cupsPerPound)) * amount;
    }
    
    if (baseUnit === 'dozen' && requestedUnit === 'whole') {
        return (basePrice / 12) * amount;
    }
    
    if (baseUnit === 'loaf' && requestedUnit === 'slices') {
        return (basePrice / 20) * amount; // ~20 slices per loaf
    }
    
    if (baseUnit === 'head' && requestedUnit === 'cloves') {
        return (basePrice / 10) * amount; // ~10 cloves per head
    }
    
    if (baseUnit === 'bunch' && requestedUnit === 'stalks') {
        return (basePrice / 3) * amount; // ~3 stalks per bunch
    }

    // Default conversion for weight/volume
    if (UNIT_CONVERSIONS.weight[baseUnit] && UNIT_CONVERSIONS.weight[requestedUnit]) {
        const baseInLbs = UNIT_CONVERSIONS.weight[baseUnit];
        const requestedInLbs = UNIT_CONVERSIONS.weight[requestedUnit];
        return (basePrice / baseInLbs) * (requestedInLbs * amount);
    }
    
    if (UNIT_CONVERSIONS.volume[baseUnit] && UNIT_CONVERSIONS.volume[requestedUnit]) {
        const baseInCups = UNIT_CONVERSIONS.volume[baseUnit];
        const requestedInCups = UNIT_CONVERSIONS.volume[requestedUnit];
        return (basePrice / baseInCups) * (requestedInCups * amount);
    }

    // Fallback: assume similar units
    return basePrice * amount;
}

// Extract state abbreviation from location string
function extractStateFromLocation(location) {
    const stateAbbrevs = Object.keys(REGIONAL_ADJUSTMENTS);
    const upperLocation = location.toUpperCase();
    
    for (const state of stateAbbrevs) {
        if (upperLocation.includes(state)) {
            return state;
        }
    }
    
    // Default to national average if state not found
    return null;
}

// Clear price cache (useful for updates)
function clearPriceCache() {
    priceCache.clear();
}

// Get all ingredients for a recipe with prices
function getRecipePricing(recipe, location = null) {
    let totalCost = 0;
    const itemizedCosts = [];

    for (const ingredient of recipe.ingredients) {
        const pricing = getIngredientPrice(
            ingredient.name, 
            ingredient.amount, 
            ingredient.unit, 
            location
        );
        
        totalCost += pricing.price;
        itemizedCosts.push({
            name: ingredient.name,
            amount: ingredient.amount,
            unit: ingredient.unit,
            price: pricing.price,
            category: ingredient.category
        });
    }

    return {
        totalCost: Math.round(totalCost * 100) / 100,
        costPerServing: Math.round((totalCost / recipe.servings) * 100) / 100,
        items: itemizedCosts,
        lastUpdated: new Date().toISOString().split('T')[0]
    };
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        INGREDIENT_PRICES,
        REGIONAL_ADJUSTMENTS,
        getIngredientPrice,
        getRecipePricing,
        clearPriceCache
    };
}