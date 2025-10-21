// Pricing utility functions
function getIngredientPrice(ingredient, amount, unit, location = null) {
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
        return { price: 2.00 * amount, unit: unit, estimated: true };
    }

    // Calculate price based on amount and unit
    let calculatedPrice = calculateUnitPrice(ingredientData, amount, unit);
    
    // Apply regional adjustment if location provided
    if (location) {
        const state = extractStateFromLocation(location);
        const adjustment = REGIONAL_ADJUSTMENTS[state] || 1.0;
        calculatedPrice *= adjustment;
    }

    return {
        price: Math.round(calculatedPrice * 100) / 100,
        unit: unit,
        source: ingredientData.source,
        lastUpdated: ingredientData.lastUpdated,
        regional: location ? true : false
    };
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

    // Default conversion for similar units
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
    
    return null;
}

// Get recipe pricing with location adjustment
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

// Export functions if module system is available
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getIngredientPrice,
        getRecipePricing,
        calculateUnitPrice,
        extractStateFromLocation
    };
}