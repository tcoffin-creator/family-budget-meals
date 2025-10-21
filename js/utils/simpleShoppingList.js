// Simplified shopping list generator for grocery store quantities
class SimpleShoppingListGenerator {
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

    // Generate simple shopping list with grocery store quantities
    generateShoppingList(selectedMeals, zipCode = null) {
        // Consolidate ingredients by name, keeping highest quantity
        const consolidatedIngredients = this.consolidateGroceryItems(selectedMeals);
        
        // Group by category
        const categorizedList = this.categorizeItems(consolidatedIngredients);
        
        // Add pricing
        const pricedList = this.addPricing(categorizedList, zipCode);
        
        // Calculate totals
        const totals = this.calculateTotals(pricedList);
        
        return {
            categories: pricedList,
            totals: totals,
            mealCount: selectedMeals.length,
            lastUpdated: new Date().toISOString(),
            zipCode: zipCode
        };
    }

    // Consolidate ingredients using grocery store logic
    consolidateGroceryItems(selectedMeals) {
        const itemMap = new Map();
        
        for (const meal of selectedMeals) {
            for (const ingredient of meal.ingredients) {
                const key = ingredient.name.toLowerCase();
                
                if (itemMap.has(key)) {
                    const existing = itemMap.get(key);
                    // For grocery items, take the higher quantity (you can't buy half a jar)
                    if (ingredient.amount > existing.amount) {
                        existing.amount = ingredient.amount;
                        existing.unit = ingredient.unit;
                        existing.storeUnit = ingredient.storeUnit;
                    }
                    existing.usedIn.push(meal.name);
                } else {
                    itemMap.set(key, {
                        name: ingredient.name,
                        amount: ingredient.amount,
                        unit: ingredient.unit,
                        storeUnit: ingredient.storeUnit || `${ingredient.amount} ${ingredient.unit}`,
                        category: ingredient.category,
                        usedIn: [meal.name]
                    });
                }
            }
        }
        
        return Array.from(itemMap.values());
    }

    // Categorize items for shopping
    categorizeItems(ingredients) {
        const categorized = {};
        
        // Initialize categories
        Object.keys(this.categories).forEach(cat => {
            categorized[cat] = {
                ...this.categories[cat],
                items: []
            };
        });
        
        // Sort ingredients into categories
        ingredients.forEach(ingredient => {
            const category = ingredient.category || 'pantry';
            if (categorized[category]) {
                categorized[category].items.push(ingredient);
            } else {
                categorized.pantry.items.push(ingredient);
            }
        });
        
        // Sort items within each category alphabetically
        Object.keys(categorized).forEach(cat => {
            categorized[cat].items.sort((a, b) => a.name.localeCompare(b.name));
        });
        
        return categorized;
    }

    // Add pricing to items
    addPricing(categorizedList, zipCode) {
        Object.keys(categorizedList).forEach(categoryKey => {
            const category = categorizedList[categoryKey];
            category.items.forEach(item => {
                // Get price using the existing pricing function
                const pricing = getIngredientPrice(item.name, item.amount, item.unit, zipCode);
                item.price = pricing.price;
                item.pricePerUnit = pricing.pricePerUnit || pricing.price;
                item.inStock = pricing.inStock !== false;
            });
        });
        
        return categorizedList;
    }

    // Calculate shopping list totals
    calculateTotals(categorizedList) {
        let totalCost = 0;
        let totalItems = 0;
        const categoryTotals = {};
        
        Object.keys(categorizedList).forEach(categoryKey => {
            const category = categorizedList[categoryKey];
            let categoryTotal = 0;
            
            category.items.forEach(item => {
                totalCost += item.price || 0;
                totalItems += 1;
                categoryTotal += item.price || 0;
            });
            
            categoryTotals[categoryKey] = {
                name: category.name,
                total: categoryTotal,
                itemCount: category.items.length
            };
        });
        
        return {
            totalCost: Math.round(totalCost * 100) / 100,
            totalItems: totalItems,
            categoryBreakdown: categoryTotals,
            averagePerItem: totalItems > 0 ? Math.round((totalCost / totalItems) * 100) / 100 : 0
        };
    }

    // Format shopping list for display with proper grocery quantities
    formatForDisplay(shoppingList) {
        const formatted = {
            items: [],
            summary: shoppingList.totals
        };
        
        // Convert to simple list format
        Object.keys(shoppingList.categories).forEach(categoryKey => {
            const category = shoppingList.categories[categoryKey];
            if (category.items && category.items.length > 0) {
                category.items.forEach(item => {
                    // Use storeUnit if available, otherwise convert to proper grocery format
                    let displayName = item.storeUnit;
                    
                    if (!displayName) {
                        displayName = this.convertToGroceryFormat(item.name, item.amount, item.unit, item.category);
                    }
                    
                    formatted.items.push({
                        name: displayName,
                        displayName: item.name,
                        price: item.price || 0,
                        category: category.name,
                        inStock: item.inStock !== false,
                        usedIn: item.usedIn || [],
                        id: `item_${item.name.toLowerCase().replace(/\s+/g, '_')}`
                    });
                });
            }
        });
        
        return formatted;
    }

    // Convert ingredient to proper grocery store format
    convertToGroceryFormat(name, amount, unit, category) {
        const lowerName = name.toLowerCase();
        const lowerUnit = unit ? unit.toLowerCase() : '';
        const cleanAmount = Math.ceil(amount); // Round up decimals to whole numbers
        
        // Handle common cooking measurements that should become store-bought items
        if (lowerUnit === 'tbsp' || lowerUnit === 'tablespoon' || lowerUnit === 'tablespoons') {
            if (lowerName.includes('butter')) return '1 lb butter';
            if (lowerName.includes('oil')) return '1 bottle cooking oil';
            if (lowerName.includes('flour')) return '1 bag flour (5lbs)';
            if (lowerName.includes('honey')) return '1 bottle honey';
            // Generic spice/seasoning
            return `1 container ${name}`;
        }
        
        if (lowerUnit === 'cup' || lowerUnit === 'cups') {
            if (lowerName.includes('milk')) return '1 gallon milk';
            if (lowerName.includes('broth') || lowerName.includes('stock')) {
                return amount > 4 ? '2 cartons broth (32oz each)' : '1 carton broth (32oz)';
            }
            if (lowerName.includes('cheese') && (lowerName.includes('shredded') || lowerName.includes('cheddar'))) {
                return amount > 1 ? '2 bags shredded cheese (8oz each)' : '1 bag shredded cheese (8oz)';
            }
            if (lowerName.includes('frozen peas') || lowerName.includes('peas')) return '1 bag frozen peas (12oz)';
            if (lowerName.includes('breadcrumb')) return '1 container breadcrumbs';
            if (lowerName.includes('lentils')) return '1 bag lentils (1lb)';
            if (lowerName.includes('rice')) return '1 bag rice (5lbs)';
            // Generic pantry item measured in cups
            if (category === 'pantry') return `1 container ${name}`;
        }
        
        if (lowerUnit === 'tsp' || lowerUnit === 'teaspoon' || lowerUnit === 'teaspoons') {
            return `1 container ${name}`;
        }
        
        // Produce items - BE SPECIFIC about varieties and quantities
        if (category === 'produce') {
            if (lowerName.includes('yellow onion') || lowerName.includes('sweet onion')) return '1 bag Yellow/Sweet Onions (3lbs)';
            if (lowerName.includes('red onion')) return cleanAmount > 2 ? '1 bag Red Onions (2lbs)' : cleanAmount > 1 ? `${cleanAmount} Large Red Onions` : '1 Large Red Onion';
            if (lowerName.includes('white onion')) return '1 bag White Onions (3lbs)';
            if (lowerName.includes('onion')) return '1 bag Yellow Onions (3lbs)';
            if (lowerName.includes('baby carrot')) return '1 bag Baby Carrots (2lbs)';
            if (lowerName.includes('carrot')) return '1 bag Large Carrots (2lbs)';
            if (lowerName.includes('russet potato') || lowerName.includes('baking potato')) return '1 bag Russet Potatoes (5lbs)';
            if (lowerName.includes('red potato')) return '1 bag Red Potatoes (3lbs)';
            if (lowerName.includes('yukon potato')) return '1 bag Yukon Gold Potatoes (3lbs)';
            if (lowerName.includes('potato')) return '1 bag Russet Potatoes (5lbs)';
            if (lowerName.includes('garlic')) return '1 head Fresh Garlic';
            if (lowerName.includes('banana')) return '1 bunch Bananas (6-8 bananas)';
            if (lowerName.includes('red bell pepper')) {
                return cleanAmount > 1 ? `${cleanAmount} Red Bell Peppers` : '1 Red Bell Pepper';
            }
            if (lowerName.includes('green bell pepper')) {
                return cleanAmount > 1 ? `${cleanAmount} Green Bell Peppers` : '1 Green Bell Pepper';
            }
            if (lowerName.includes('yellow bell pepper')) {
                return cleanAmount > 1 ? `${cleanAmount} Yellow Bell Peppers` : '1 Yellow Bell Pepper';
            }
            if (lowerName.includes('bell pepper') || lowerName.includes('pepper')) {
                return cleanAmount > 1 ? `${cleanAmount} Bell Peppers (mixed colors)` : '1 Bell Pepper';
            }
            if (lowerName.includes('celery')) return '1 bunch Fresh Celery';
            if (lowerName.includes('romaine lettuce')) return '1 head Romaine Lettuce';
            if (lowerName.includes('iceberg lettuce')) return '1 head Iceberg Lettuce';
            if (lowerName.includes('lettuce')) return '1 head Lettuce (Romaine or Iceberg)';
            if (lowerName.includes('roma tomato') || lowerName.includes('plum tomato')) {
                return cleanAmount > 1 ? `${cleanAmount} Roma/Plum Tomatoes` : '1 Roma/Plum Tomato';
            }
            if (lowerName.includes('beefsteak tomato') || lowerName.includes('large tomato')) {
                return cleanAmount > 1 ? `${cleanAmount} Large Beefsteak Tomatoes` : '1 Large Beefsteak Tomato';
            }
            if (lowerName.includes('cherry tomato')) return '1 container Cherry Tomatoes (1lb)';
            if (lowerName.includes('grape tomato')) return '1 container Grape Tomatoes (1lb)';
            if (lowerName.includes('tomato') && !lowerName.includes('sauce') && !lowerName.includes('diced')) {
                return cleanAmount > 1 ? `${cleanAmount} Medium Tomatoes` : '1 Medium Tomato';
            }
            if (lowerName.includes('broccoli')) return cleanAmount > 1 ? `${cleanAmount} heads Fresh Broccoli` : '1 head Fresh Broccoli';
            if (lowerName.includes('cauliflower')) return '1 head Fresh Cauliflower';
            if (lowerName.includes('spinach')) return '1 bag Fresh Spinach (5oz)';
            if (lowerName.includes('mushroom')) return '1 container White Button Mushrooms (8oz)';
            if (lowerName.includes('zucchini')) return cleanAmount > 1 ? `${cleanAmount} Medium Zucchini` : '1 Medium Zucchini';
            if (lowerName.includes('cucumber')) return cleanAmount > 1 ? `${cleanAmount} Cucumbers` : '1 Cucumber';
            if (lowerName.includes('lime')) return cleanAmount > 3 ? '1 bag Limes (2lbs)' : cleanAmount > 1 ? `${cleanAmount} Limes` : '1 Lime';
            if (lowerName.includes('lemon')) return cleanAmount > 3 ? '1 bag Lemons (2lbs)' : cleanAmount > 1 ? `${cleanAmount} Lemons` : '1 Lemon';
            if (lowerName.includes('apple')) return cleanAmount > 4 ? '1 bag Apples (3lbs)' : cleanAmount > 1 ? `${cleanAmount} Apples` : '1 Apple';
        }
        
        // Pantry items - BE VERY SPECIFIC about what and what size
        if (category === 'pantry') {
            if (lowerName.includes('all-purpose flour') || lowerName.includes('flour')) return '1 bag All-Purpose Flour (5lbs)';
            if (lowerName.includes('brown rice')) return '1 bag Brown Rice (2lbs)';
            if (lowerName.includes('white rice') || lowerName.includes('rice')) return '1 bag White Rice (5lbs)';
            if (lowerName.includes('spaghetti')) return cleanAmount > 1 ? `${cleanAmount} boxes Spaghetti Pasta (1lb each)` : '1 box Spaghetti Pasta (1lb)';
            if (lowerName.includes('penne')) return cleanAmount > 1 ? `${cleanAmount} boxes Penne Pasta (1lb each)` : '1 box Penne Pasta (1lb)';
            if (lowerName.includes('elbow') && lowerName.includes('pasta')) return cleanAmount > 1 ? `${cleanAmount} boxes Elbow Macaroni (1lb each)` : '1 box Elbow Macaroni (1lb)';
            if (lowerName.includes('pasta') || lowerName.includes('noodle')) {
                return cleanAmount > 1 ? `${cleanAmount} boxes ${name} Pasta (1lb each)` : `1 box ${name} Pasta (1lb)`;
            }
            if (lowerName.includes('marinara')) return cleanAmount > 1 ? `${cleanAmount} jars Marinara Sauce (24oz each)` : '1 jar Marinara Sauce (24oz)';
            if (lowerName.includes('tomato sauce')) return cleanAmount > 1 ? `${cleanAmount} cans Tomato Sauce (15oz each)` : '1 can Tomato Sauce (15oz)';
            if (lowerName.includes('diced tomatoes')) return cleanAmount > 1 ? `${cleanAmount} cans Diced Tomatoes (14.5oz each)` : '1 can Diced Tomatoes (14.5oz)';
            if (lowerName.includes('crushed tomatoes')) return cleanAmount > 1 ? `${cleanAmount} cans Crushed Tomatoes (28oz each)` : '1 can Crushed Tomatoes (28oz)';
            if (lowerName.includes('kidney beans')) return cleanAmount > 1 ? `${cleanAmount} cans Kidney Beans (15oz each)` : '1 can Kidney Beans (15oz)';
            if (lowerName.includes('black beans')) return cleanAmount > 1 ? `${cleanAmount} cans Black Beans (15oz each)` : '1 can Black Beans (15oz)';
            if (lowerName.includes('chickpeas') || lowerName.includes('garbanzo')) return cleanAmount > 1 ? `${cleanAmount} cans Chickpeas/Garbanzo Beans (15oz each)` : '1 can Chickpeas/Garbanzo Beans (15oz)';
            if (lowerName.includes('pinto beans')) return cleanAmount > 1 ? `${cleanAmount} cans Pinto Beans (15oz each)` : '1 can Pinto Beans (15oz)';
            if (lowerName.includes('beans') && lowerName.includes('can')) {
                return cleanAmount > 1 ? `${cleanAmount} cans ${name} (15oz each)` : `1 can ${name} (15oz)`;
            }
            if (lowerName.includes('chicken broth')) return cleanAmount > 1 ? `${cleanAmount} cartons Chicken Broth (32oz each)` : '1 carton Chicken Broth (32oz)';
            if (lowerName.includes('vegetable broth')) return cleanAmount > 1 ? `${cleanAmount} cartons Vegetable Broth (32oz each)` : '1 carton Vegetable Broth (32oz)';
            if (lowerName.includes('beef broth')) return cleanAmount > 1 ? `${cleanAmount} cartons Beef Broth (32oz each)` : '1 carton Beef Broth (32oz)';
            if (lowerName.includes('broth') || lowerName.includes('stock')) {
                return cleanAmount > 1 ? `${cleanAmount} cartons ${name} (32oz each)` : `1 carton ${name} (32oz)`;
            }
            if (lowerName.includes('olive oil')) return '1 bottle Extra Virgin Olive Oil (16.9oz)';
            if (lowerName.includes('vegetable oil')) return '1 bottle Vegetable Oil (48oz)';
            if (lowerName.includes('canola oil')) return '1 bottle Canola Oil (48oz)';
            if (lowerName.includes('oil')) return `1 bottle ${name} (16-48oz)`;
            if (lowerName.includes('white sugar') || lowerName.includes('granulated sugar')) return '1 bag Granulated White Sugar (4lbs)';
            if (lowerName.includes('brown sugar')) return '1 box Brown Sugar (1lb)';
            if (lowerName.includes('sugar')) return '1 bag Sugar (4lbs)';
            if (lowerName.includes('rolled oats') || lowerName.includes('old fashioned oats')) return '1 container Old Fashioned Rolled Oats (42oz)';
            if (lowerName.includes('quick oats') || lowerName.includes('instant oats')) return '1 container Quick Cooking Oats (42oz)';
            if (lowerName.includes('oats')) return '1 container Oats (42oz)';
            if (lowerName.includes('white bread') || lowerName.includes('sandwich bread')) return '1 loaf White Sandwich Bread (20oz)';
            if (lowerName.includes('whole wheat bread')) return '1 loaf Whole Wheat Bread (20oz)';
            if (lowerName.includes('bread')) return '1 loaf Bread (20oz)';
            if (lowerName.includes('peanut butter')) return '1 jar Peanut Butter (40oz)';
            if (lowerName.includes('grape jelly') || lowerName.includes('jam')) return '1 jar Grape Jelly (32oz)';
            if (lowerName.includes('honey')) return '1 bottle Honey (12oz)';
            if (lowerName.includes('baking powder')) return '1 container Baking Powder (10oz)';
            if (lowerName.includes('baking soda')) return '1 box Baking Soda (1lb)';
            if (lowerName.includes('vanilla extract')) return '1 bottle Pure Vanilla Extract (4oz)';
            if (lowerName.includes('chicken noodle soup')) return `${cleanAmount} cans Campbell's Chicken Noodle Soup (10.75oz each)`;
            if (lowerName.includes('tomato soup')) return `${cleanAmount} cans Campbell's Tomato Soup (10.75oz each)`;
            if (lowerName.includes('soup')) return `${cleanAmount} cans ${name} (10.75oz each)`;
            if (lowerName.includes('cereal')) return `1 box ${name} Cereal (12-18oz)`;
            if (lowerName.includes('crackers')) return `1 box ${name} Crackers (14-16oz)`;
        }
        
        // Dairy items - BE SPECIFIC about type and size
        if (category === 'dairy') {
            if (lowerName.includes('whole milk')) return '1 gallon Whole Milk';
            if (lowerName.includes('2% milk') || lowerName.includes('reduced fat milk')) return '1 gallon 2% Reduced Fat Milk';
            if (lowerName.includes('skim milk') || lowerName.includes('fat free milk')) return '1 gallon Skim/Fat-Free Milk';
            if (lowerName.includes('milk')) return '1 gallon Milk (2% or Whole)';
            if (lowerName.includes('large eggs') || lowerName.includes('egg')) return '1 dozen Large Eggs';
            if (lowerName.includes('unsalted butter')) return '1 lb Unsalted Butter (4 sticks)';
            if (lowerName.includes('salted butter')) return '1 lb Salted Butter (4 sticks)';
            if (lowerName.includes('butter')) return '1 lb Butter (4 sticks)';
            if (lowerName.includes('sharp cheddar') && (lowerUnit.includes('cup') || lowerName.includes('shredded'))) {
                return cleanAmount > 1 ? '2 bags Sharp Cheddar Shredded Cheese (8oz each)' : '1 bag Sharp Cheddar Shredded Cheese (8oz)';
            }
            if (lowerName.includes('mild cheddar') && (lowerUnit.includes('cup') || lowerName.includes('shredded'))) {
                return cleanAmount > 1 ? '2 bags Mild Cheddar Shredded Cheese (8oz each)' : '1 bag Mild Cheddar Shredded Cheese (8oz)';
            }
            if (lowerName.includes('mozzarella') && (lowerUnit.includes('cup') || lowerName.includes('shredded'))) {
                return cleanAmount > 1 ? '2 bags Mozzarella Shredded Cheese (8oz each)' : '1 bag Mozzarella Shredded Cheese (8oz)';
            }
            if (lowerName.includes('parmesan') && lowerName.includes('grated')) {
                return '1 container Grated Parmesan Cheese (8oz)';
            }
            if (lowerName.includes('cream cheese')) return cleanAmount > 1 ? `${cleanAmount} packages Cream Cheese (8oz each)` : '1 package Cream Cheese (8oz)';
            if (lowerName.includes('sour cream')) return '1 container Sour Cream (16oz)';
            if (lowerName.includes('greek yogurt')) return cleanAmount > 1 ? `${cleanAmount} containers Greek Yogurt (32oz each)` : '1 container Greek Yogurt (32oz)';
            if (lowerName.includes('plain yogurt')) return '1 container Plain Yogurt (32oz)';
            if (lowerName.includes('yogurt')) return `1 container ${name} (32oz)`;
            if (lowerName.includes('heavy cream') || lowerName.includes('heavy whipping cream')) return '1 carton Heavy Whipping Cream (16oz)';
            if (lowerName.includes('half and half')) return '1 carton Half and Half (32oz)';
            if (lowerName.includes('cheese')) {
                if (lowerUnit.includes('cup') || lowerName.includes('shredded')) {
                    return cleanAmount > 1 ? `2 bags ${name} Shredded (8oz each)` : `1 bag ${name} Shredded (8oz)`;
                }
                return `1 package ${name} (8oz)`;
            }
        }
        
        // Meat items - BE VERY SPECIFIC about cuts, grades, and sizes
        if (category === 'meat') {
            if (lowerName.includes('85/15 ground beef') || lowerName.includes('lean ground beef')) {
                return cleanAmount > 1 ? `${cleanAmount} packages 85/15 Lean Ground Beef (1lb each)` : '1 package 85/15 Lean Ground Beef (1lb)';
            }
            if (lowerName.includes('80/20 ground beef')) {
                return cleanAmount > 1 ? `${cleanAmount} packages 80/20 Ground Beef (1lb each)` : '1 package 80/20 Ground Beef (1lb)';
            }
            if (lowerName.includes('ground beef')) {
                return cleanAmount > 1 ? `${cleanAmount} packages Ground Beef 80/20 (1lb each)` : '1 package Ground Beef 80/20 (1lb)';
            }
            if (lowerName.includes('ground turkey')) {
                return cleanAmount > 1 ? `${cleanAmount} packages Ground Turkey 93/7 (1lb each)` : '1 package Ground Turkey 93/7 (1lb)';
            }
            if (lowerName.includes('boneless skinless chicken breast')) {
                return cleanAmount > 2 ? '1 family pack Boneless Skinless Chicken Breasts (3lbs)' : cleanAmount > 1 ? `${cleanAmount}lb package Boneless Skinless Chicken Breasts` : '1lb package Boneless Skinless Chicken Breasts';
            }
            if (lowerName.includes('chicken breast')) {
                return cleanAmount > 2 ? '1 family pack Chicken Breasts (3lbs)' : cleanAmount > 1 ? `${cleanAmount}lb package Chicken Breasts` : '1lb package Chicken Breasts';
            }
            if (lowerName.includes('boneless skinless chicken thigh')) {
                return cleanAmount > 2 ? '1 family pack Boneless Skinless Chicken Thighs (3lbs)' : '1 package Boneless Skinless Chicken Thighs (1.5lbs)';
            }
            if (lowerName.includes('chicken thigh')) {
                return cleanAmount > 2 ? '1 family pack Chicken Thighs (3lbs)' : '1 package Chicken Thighs (1.5lbs)';
            }
            if (lowerName.includes('whole chicken')) {
                return cleanAmount > 1 ? `${cleanAmount} Whole Chickens (3-4lbs each)` : '1 Whole Chicken (3-4lbs)';
            }
            if (lowerName.includes('salmon fillet')) {
                return cleanAmount > 1 ? `${cleanAmount}lb Fresh Salmon Fillets` : '1lb Fresh Salmon Fillets';
            }
            if (lowerName.includes('tilapia')) {
                return cleanAmount > 1 ? `${cleanAmount}lb Tilapia Fillets (frozen)` : '1lb Tilapia Fillets (frozen)';
            }
            if (lowerName.includes('shrimp')) {
                return cleanAmount > 1 ? `${cleanAmount}lb Large Shrimp (31-40 count, frozen)` : '1lb Large Shrimp (31-40 count, frozen)';
            }
            if (lowerName.includes('bacon')) {
                return cleanAmount > 1 ? `${cleanAmount} packages Thick Cut Bacon (1lb each)` : '1 package Thick Cut Bacon (1lb)';
            }
            if (lowerName.includes('italian sausage')) {
                return cleanAmount > 1 ? `${cleanAmount} packages Italian Sausage Links (1lb each)` : '1 package Italian Sausage Links (1lb)';
            }
            if (lowerName.includes('pork chop')) {
                return cleanAmount > 2 ? '1 family pack Bone-in Pork Chops (3lbs)' : cleanAmount > 1 ? `${cleanAmount}lb package Bone-in Pork Chops` : '1lb package Bone-in Pork Chops';
            }
        }
        
        // Frozen items - BE SPECIFIC about brands and sizes when possible
        if (category === 'frozen') {
            if (lowerName.includes('mixed vegetables') || (lowerName.includes('vegetables') && lowerName.includes('mixed'))) {
                return cleanAmount > 1 ? `${cleanAmount} bags Frozen Mixed Vegetables (12oz each)` : '1 bag Frozen Mixed Vegetables (12oz)';
            }
            if (lowerName.includes('frozen peas')) return cleanAmount > 1 ? `${cleanAmount} bags Frozen Green Peas (12oz each)` : '1 bag Frozen Green Peas (12oz)';
            if (lowerName.includes('frozen corn')) return cleanAmount > 1 ? `${cleanAmount} bags Frozen Corn Kernels (12oz each)` : '1 bag Frozen Corn Kernels (12oz)';
            if (lowerName.includes('frozen broccoli')) return cleanAmount > 1 ? `${cleanAmount} bags Frozen Broccoli Florets (12oz each)` : '1 bag Frozen Broccoli Florets (12oz)';
            if (lowerName.includes('frozen spinach')) return cleanAmount > 1 ? `${cleanAmount} boxes Frozen Chopped Spinach (10oz each)` : '1 box Frozen Chopped Spinach (10oz)';
            if (lowerName.includes('ice cream')) return `1 container ${name} Ice Cream (1.5qt)`;
            if (lowerName.includes('frozen pizza')) return cleanAmount > 1 ? `${cleanAmount} Frozen Pizzas (12-inch each)` : '1 Frozen Pizza (12-inch)';
            if (lowerName.includes('frozen')) return cleanAmount > 1 ? `${cleanAmount} bags/boxes ${name} (10-12oz each)` : `1 bag/box ${name} (10-12oz)`;
        }
        
        // Spices & Seasonings - BE SPECIFIC about sizes
        if (category === 'spices') {
            if (lowerName.includes('salt')) return '1 container Table Salt (26oz)';
            if (lowerName.includes('black pepper') || lowerName.includes('ground black pepper')) return '1 container Ground Black Pepper (4oz)';
            if (lowerName.includes('garlic powder')) return '1 container Garlic Powder (3.4oz)';
            if (lowerName.includes('onion powder')) return '1 container Onion Powder (3.1oz)';
            if (lowerName.includes('paprika')) return '1 container Paprika (2.5oz)';
            if (lowerName.includes('cumin')) return '1 container Ground Cumin (2.2oz)';
            if (lowerName.includes('chili powder')) return '1 container Chili Powder (2.5oz)';
            if (lowerName.includes('oregano')) return '1 container Dried Oregano (1oz)';
            if (lowerName.includes('basil')) return '1 container Dried Basil (1oz)'; 
            if (lowerName.includes('thyme')) return '1 container Dried Thyme (1oz)';
            if (lowerName.includes('rosemary')) return '1 container Dried Rosemary (1oz)';
            if (lowerName.includes('cinnamon')) return '1 container Ground Cinnamon (2.4oz)';
            if (lowerName.includes('nutmeg')) return '1 container Ground Nutmeg (1.8oz)';
            if (lowerName.includes('ginger')) return '1 container Ground Ginger (1.8oz)';
            if (lowerName.includes('bay leaves')) return '1 container Bay Leaves (0.5oz)';
            if (lowerName.includes('red pepper flakes')) return '1 container Red Pepper Flakes (1.2oz)';
            if (lowerName.includes('italian seasoning')) return '1 container Italian Seasoning (1oz)';
            if (lowerName.includes('taco seasoning')) return cleanAmount > 1 ? `${cleanAmount} packets Taco Seasoning (1oz each)` : '1 packet Taco Seasoning (1oz)';
            return `1 container ${name} (1-4oz)`;
        }
        
        // Canned goods fallback
        if (lowerUnit === 'can' || lowerUnit === 'cans') {
            return cleanAmount > 1 ? `${cleanAmount} cans ${name}` : `1 can ${name}`;
        }
        
        // Bottle/jar items
        if (lowerUnit === 'bottle' || lowerUnit === 'jar') {
            return cleanAmount > 1 ? `${cleanAmount} ${unit}s ${name}` : `1 ${unit} ${name}`;
        }
        
        // Package items 
        if (lowerUnit === 'package' || lowerUnit === 'bag' || lowerUnit === 'box') {
            return cleanAmount > 1 ? `${cleanAmount} ${unit}s ${name}` : `1 ${unit} ${name}`;
        }
        
        // Head/bunch items
        if (lowerUnit === 'head' || lowerUnit === 'bunch') {
            return cleanAmount > 1 ? `${cleanAmount} ${unit}s ${name}` : `1 ${unit} ${name}`;
        }
        
        // Final fallback - avoid decimals completely, make it grocery-friendly with best guess
        if (cleanAmount <= 1) {
            // Make educated guesses based on common grocery patterns
            if (lowerName.includes('sauce') || lowerName.includes('dressing')) return `1 bottle ${name} (16-24oz)`;
            if (lowerName.includes('cereal') || lowerName.includes('crackers')) return `1 box ${name} (12-16oz)`;
            if (lowerName.includes('nuts') || lowerName.includes('chips')) return `1 bag ${name} (8-16oz)`;
            if (lowerName.includes('seasoning') || lowerName.includes('spice')) return `1 container ${name} (1-4oz)`;
            return `1 package/container ${name} (standard size)`;
        } else {
            // Multiple items - be more specific about what type of containers
            if (lowerName.includes('sauce') || lowerName.includes('dressing')) return `${cleanAmount} bottles ${name} (16-24oz each)`;
            if (lowerName.includes('cereal') || lowerName.includes('crackers')) return `${cleanAmount} boxes ${name} (12-16oz each)`;
            if (lowerName.includes('nuts') || lowerName.includes('chips')) return `${cleanAmount} bags ${name} (8-16oz each)`;
            if (lowerName.includes('seasoning') || lowerName.includes('spice')) return `${cleanAmount} containers ${name} (1-4oz each)`;
            return `${cleanAmount} packages/containers ${name} (standard size each)`;
        }
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.SimpleShoppingListGenerator = SimpleShoppingListGenerator;
}