// Shopping list generator with smart grouping and cost optimization
class ShoppingListGenerator {
    constructor() {
        this.categories = {
            produce: { name: 'Fresh Produce', icon: '🥕', order: 1 },
            meat: { name: 'Meat & Seafood', icon: '🥩', order: 2 },
            dairy: { name: 'Dairy & Eggs', icon: '🥛', order: 3 },
            pantry: { name: 'Pantry Staples', icon: '🏺', order: 4 },
            frozen: { name: 'Frozen Foods', icon: '🧊', order: 5 },
            spices: { name: 'Spices & Seasonings', icon: '🧂', order: 6 }
        };
    }

    // Generate complete shopping list from selected meals
    generateShoppingList(selectedMeals, location = null) {
        // Consolidate ingredients across all meals
        const consolidatedIngredients = this.consolidateIngredients(selectedMeals);
        
        // Group by category for easier shopping
        const categorizedList = this.categorizeIngredients(consolidatedIngredients);
        
        // Calculate prices for each item
        const pricedList = this.calculatePrices(categorizedList, location);
        
        // Optimize for bulk buying and deals
        const optimizedList = this.optimizeForDeals(pricedList);
        
        // Sort within categories for logical shopping flow
        const sortedList = this.sortByShoppingFlow(optimizedList);
        
        // Calculate totals
        const totals = this.calculateTotals(sortedList);
        
        return {
            categories: sortedList,
            totals: totals,
            mealCount: selectedMeals.length,
            lastUpdated: new Date().toISOString(),
            location: location
        };
    }

    // Consolidate ingredients across meals, combining duplicates
    consolidateIngredients(selectedMeals) {
        const ingredientMap = new Map();
        
        for (const meal of selectedMeals) {
            for (const ingredient of meal.ingredients) {
                const key = this.createIngredientKey(ingredient);
                
                if (ingredientMap.has(key)) {
                    const existing = ingredientMap.get(key);
                    existing.totalAmount += ingredient.amount;
                    existing.usedInMeals.push({
                        mealName: meal.name,
                        amount: ingredient.amount,
                        unit: ingredient.unit
                    });
                } else {
                    ingredientMap.set(key, {
                        name: ingredient.name,
                        totalAmount: ingredient.amount,
                        unit: ingredient.unit,
                        category: ingredient.category,
                        usedInMeals: [{
                            mealName: meal.name,
                            amount: ingredient.amount,
                            unit: ingredient.unit
                        }]
                    });
                }
            }
        }
        
        return Array.from(ingredientMap.values());
    }

    // Create unique key for ingredient consolidation
    createIngredientKey(ingredient) {
        // Normalize ingredient name and unit for proper consolidation
        const normalizedName = ingredient.name.toLowerCase().trim();
        const normalizedUnit = this.normalizeUnit(ingredient.unit);
        return `${normalizedName}|${normalizedUnit}`;
    }

    // Normalize units for proper consolidation
    normalizeUnit(unit) {
        const unitMap = {
            'cup': 'cups',
            'cups': 'cups',
            'tbsp': 'tbsp',
            'tablespoon': 'tbsp',
            'tsp': 'tsp',
            'teaspoon': 'tsp',
            'lb': 'lbs',
            'lbs': 'lbs',
            'pound': 'lbs',
            'oz': 'oz',
            'ounce': 'oz',
            'whole': 'whole',
            'each': 'whole',
            'can': 'cans',
            'cans': 'cans',
            'jar': 'jars',
            'jars': 'jars',
            'container': 'containers',
            'containers': 'containers'
        };
        
        return unitMap[unit.toLowerCase()] || unit.toLowerCase();
    }

    // Group ingredients by shopping category
    categorizeIngredients(ingredients) {
        const categorized = {};
        
        // Initialize categories
        for (const [key, categoryInfo] of Object.entries(this.categories)) {
            categorized[key] = {
                ...categoryInfo,
                items: []
            };
        }
        
        // Sort ingredients into categories
        for (const ingredient of ingredients) {
            const category = ingredient.category || 'pantry';
            if (categorized[category]) {
                categorized[category].items.push(ingredient);
            } else {
                // Default to pantry if category not recognized
                categorized.pantry.items.push(ingredient);
            }
        }
        
        // Remove empty categories
        const nonEmptyCategories = {};
        for (const [key, category] of Object.entries(categorized)) {
            if (category.items.length > 0) {
                nonEmptyCategories[key] = category;
            }
        }
        
        return nonEmptyCategories;
    }

    // Calculate prices for all items
    calculatePrices(categorizedList, location) {
        for (const category of Object.values(categorizedList)) {
            for (const item of category.items) {
                const pricing = getIngredientPrice(
                    item.name,
                    item.totalAmount,
                    item.unit,
                    location
                );
                
                item.price = pricing.price;
                item.pricePerUnit = pricing.price / item.totalAmount;
                item.source = pricing.source;
                item.lastUpdated = pricing.lastUpdated;
                item.estimated = pricing.estimated || false;
            }
        }
        
        return categorizedList;
    }

    // Optimize for bulk buying and common deals
    optimizeForDeals(categorizedList) {
        for (const category of Object.values(categorizedList)) {
            category.items = category.items.map(item => this.checkBulkDeals(item));
        }
        
        return categorizedList;
    }

    // Check for bulk buying opportunities
    checkBulkDeals(item) {
        const bulkOpportunities = {
            'ground beef': { bulkSize: 3, bulkUnit: 'lbs', savings: 0.15 },
            'chicken breast': { bulkSize: 5, bulkUnit: 'lbs', savings: 0.20 },
            'chicken thighs': { bulkSize: 5, bulkUnit: 'lbs', savings: 0.18 },
            'rice': { bulkSize: 10, bulkUnit: 'lbs', savings: 0.25 },
            'flour': { bulkSize: 10, bulkUnit: 'lbs', savings: 0.20 },
            'pasta': { bulkSize: 5, bulkUnit: 'lbs', savings: 0.15 },
            'potatoes': { bulkSize: 5, bulkUnit: 'lbs', savings: 0.12 },
            'onion': { bulkSize: 3, bulkUnit: 'lbs', savings: 0.10 }
        };
        
        const bulkDeal = bulkOpportunities[item.name.toLowerCase()];
        if (bulkDeal && item.totalAmount >= bulkDeal.bulkSize * 0.7) {
            const bulkPrice = item.price * (1 - bulkDeal.savings);
            const savings = item.price - bulkPrice;
            
            return {
                ...item,
                bulkOption: {
                    available: true,
                    bulkSize: bulkDeal.bulkSize,
                    bulkPrice: Math.round(bulkPrice * 100) / 100,
                    savings: Math.round(savings * 100) / 100,
                    recommended: savings > 1.00 // Recommend if saving more than $1
                }
            };
        }
        
        return { ...item, bulkOption: { available: false } };
    }

    // Sort items within categories for logical shopping flow
    sortByShoppingFlow(categorizedList) {
        const sortingRules = {
            produce: ['onion', 'garlic', 'potato', 'carrot', 'celery', 'bell pepper', 'banana'],
            meat: ['ground beef', 'chicken breast', 'chicken thigh', 'tuna'],
            dairy: ['milk', 'eggs', 'butter', 'cheese'],
            pantry: ['oil', 'flour', 'rice', 'pasta', 'beans', 'sauce', 'broth', 'sugar'],
            frozen: ['vegetables', 'peas'],
            spices: ['salt', 'pepper', 'garlic powder', 'onion powder']
        };
        
        for (const [categoryKey, category] of Object.entries(categorizedList)) {
            const sortOrder = sortingRules[categoryKey] || [];
            
            category.items.sort((a, b) => {
                const aIndex = sortOrder.findIndex(item => 
                    a.name.toLowerCase().includes(item.toLowerCase())
                );
                const bIndex = sortOrder.findIndex(item => 
                    b.name.toLowerCase().includes(item.toLowerCase())
                );
                
                // If both items have sort order, use that
                if (aIndex !== -1 && bIndex !== -1) {
                    return aIndex - bIndex;
                }
                
                // If only one has sort order, prioritize it
                if (aIndex !== -1) return -1;
                if (bIndex !== -1) return 1;
                
                // Otherwise, sort alphabetically
                return a.name.localeCompare(b.name);
            });
        }
        
        return categorizedList;
    }

    // Calculate totals for the shopping list
    calculateTotals(categorizedList) {
        let totalCost = 0;
        let totalItems = 0;
        let totalSavings = 0;
        const categoryTotals = {};
        
        for (const [categoryKey, category] of Object.entries(categorizedList)) {
            let categoryTotal = 0;
            let categoryItems = 0;
            let categorySavings = 0;
            
            for (const item of category.items) {
                categoryTotal += item.price;
                categoryItems += 1;
                
                if (item.bulkOption && item.bulkOption.available && item.bulkOption.savings) {
                    categorySavings += item.bulkOption.savings;
                }
            }
            
            categoryTotals[categoryKey] = {
                name: category.name,
                total: Math.round(categoryTotal * 100) / 100,
                items: categoryItems,
                savings: Math.round(categorySavings * 100) / 100
            };
            
            totalCost += categoryTotal;
            totalItems += categoryItems;
            totalSavings += categorySavings;
        }
        
        return {
            totalCost: Math.round(totalCost * 100) / 100,
            totalItems: totalItems,
            potentialSavings: Math.round(totalSavings * 100) / 100,
            categoryTotals: categoryTotals,
            averageItemCost: Math.round((totalCost / totalItems) * 100) / 100
        };
    }

    // Generate printable shopping list
    generatePrintableList(shoppingList) {
        let printableList = "FAMILY BUDGET MEALS - SHOPPING LIST\n";
        printableList += `Generated: ${new Date().toLocaleDateString()}\n`;
        printableList += `Location: ${shoppingList.location || 'National Average'}\n`;
        printableList += `Estimated Total: $${shoppingList.totals.totalCost}\n\n`;
        
        // Sort categories by order
        const sortedCategories = Object.entries(shoppingList.categories)
            .sort(([,a], [,b]) => a.order - b.order);
        
        for (const [categoryKey, category] of sortedCategories) {
            printableList += `${category.name.toUpperCase()}\n`;
            printableList += `${'-'.repeat(category.name.length + 5)}\n`;
            
            for (const item of category.items) {
                const amount = item.totalAmount % 1 === 0 ? 
                    item.totalAmount.toString() : 
                    item.totalAmount.toFixed(2);
                
                printableList += `☐ ${amount} ${item.unit} ${item.name}`;
                printableList += ` - $${item.price.toFixed(2)}`;
                
                if (item.bulkOption.available && item.bulkOption.recommended) {
                    printableList += ` (Bulk: $${item.bulkOption.bulkPrice.toFixed(2)})`;
                }
                
                printableList += "\n";
            }
            
            printableList += `Subtotal: $${shoppingList.totals.categoryTotals[categoryKey].total}\n\n`;
        }
        
        printableList += `TOTAL ESTIMATED COST: $${shoppingList.totals.totalCost}\n`;
        if (shoppingList.totals.potentialSavings > 0) {
            printableList += `Potential Bulk Savings: $${shoppingList.totals.potentialSavings}\n`;
        }
        
        return printableList;
    }

    // Generate shopping list for specific stores
    generateStoreOptimizedList(shoppingList, storeType = 'walmart') {
        const storeOptimizations = {
            walmart: {
                name: 'Walmart Supercenter',
                layout: ['produce', 'meat', 'dairy', 'frozen', 'pantry', 'spices'],
                tips: [
                    'Start with produce on the right side of the store',
                    'Meat and dairy are along the back wall',
                    'Frozen foods are in the center aisles',
                    'Pantry items are in the main aisles',
                    'Spices are usually in the baking aisle'
                ]
            },
            kroger: {
                name: 'Kroger',
                layout: ['produce', 'meat', 'dairy', 'pantry', 'frozen', 'spices'],
                tips: [
                    'Produce is typically at the front of the store',
                    'Follow the perimeter for fresh items',
                    'Center aisles for pantry staples'
                ]
            }
        };
        
        const storeInfo = storeOptimizations[storeType] || storeOptimizations.walmart;
        
        const optimizedList = {
            ...shoppingList,
            storeInfo: storeInfo,
            optimizedOrder: storeInfo.layout.map(categoryKey => {
                if (shoppingList.categories[categoryKey]) {
                    return {
                        categoryKey: categoryKey,
                        ...shoppingList.categories[categoryKey]
                    };
                }
                return null;
            }).filter(Boolean)
        };
        
        return optimizedList;
    }

    // Export shopping list to various formats
    exportShoppingList(shoppingList, format = 'text') {
        switch (format) {
            case 'text':
                return this.generatePrintableList(shoppingList);
            case 'json':
                return JSON.stringify(shoppingList, null, 2);
            case 'csv':
                return this.generateCSV(shoppingList);
            default:
                return this.generatePrintableList(shoppingList);
        }
    }

    // Generate CSV format for shopping list
    generateCSV(shoppingList) {
        let csv = "Category,Item,Amount,Unit,Price,Bulk Available,Bulk Price,Used In Meals\n";
        
        for (const [categoryKey, category] of Object.entries(shoppingList.categories)) {
            for (const item of category.items) {
                const meals = item.usedInMeals.map(meal => meal.mealName).join('; ');
                csv += `"${category.name}","${item.name}",${item.totalAmount},"${item.unit}",${item.price},`;
                csv += `${item.bulkOption.available ? 'Yes' : 'No'},`;
                csv += `${item.bulkOption.available ? item.bulkOption.bulkPrice : ''},"${meals}"\n`;
            }
        }
        
        return csv;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ShoppingListGenerator };
}