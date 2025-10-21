// Comprehensive recipe database optimized for budget-conscious families
const RECIPES_DATABASE = {
    // Breakfast Recipes
    breakfast: [
        {
            id: 'oatmeal-basic',
            name: 'Hearty Oatmeal',
            description: 'Filling breakfast that keeps kids full until lunch',
            servings: 4,
            prepTime: 10,
            cookTime: 5,
            difficulty: 'Easy',
            tags: ['breakfast', 'healthy', 'filling', 'quick'],
            ingredients: [
                { name: 'rolled oats', amount: 1, unit: 'container', category: 'pantry', storeUnit: '42oz container' },
                { name: 'milk', amount: 1, unit: 'gallon', category: 'dairy', storeUnit: '1 gallon jug' },
                { name: 'honey', amount: 1, unit: 'bottle', category: 'pantry', storeUnit: '12oz bottle' },
                { name: 'cinnamon', amount: 1, unit: 'container', category: 'spices', storeUnit: 'spice container' },
                { name: 'banana', amount: 1, unit: 'bunch', category: 'produce', storeUnit: '1 bunch (6-8 bananas)' }
            ],
            instructions: [
                'Bring milk to a simmer in a large pot',
                'Add oats and cinnamon, cook for 5 minutes stirring occasionally',
                'Stir in honey and sliced bananas',
                'Serve hot with additional toppings if desired'
            ],
            nutrition: { calories: 280, protein: 12, carbs: 45, fat: 6 },
            allergens: ['dairy'],
            commonIngredients: ['oats', 'milk', 'banana', 'cinnamon', 'honey']
        },
        {
            id: 'pancakes-basic',
            name: 'Fluffy Pancakes',
            description: 'Weekend breakfast favorite that uses pantry staples',
            servings: 6,
            prepTime: 10,
            cookTime: 15,
            difficulty: 'Easy',
            tags: ['breakfast', 'weekend', 'kid-friendly'],
            ingredients: [
                { name: 'all-purpose flour', amount: 1, unit: 'bag', category: 'pantry', storeUnit: '5lb bag' },
                { name: 'milk', amount: 1, unit: 'gallon', category: 'dairy', storeUnit: '1 gallon jug' },
                { name: 'eggs', amount: 1, unit: 'dozen', category: 'dairy', storeUnit: '1 dozen eggs' },
                { name: 'baking powder', amount: 1, unit: 'container', category: 'pantry', storeUnit: 'baking powder container' },
                { name: 'sugar', amount: 1, unit: 'bag', category: 'pantry', storeUnit: '4lb bag' },
                { name: 'salt', amount: 1, unit: 'container', category: 'pantry', storeUnit: 'salt container' },
                { name: 'vegetable oil', amount: 1, unit: 'bottle', category: 'pantry', storeUnit: '48oz bottle' }
            ],
            instructions: [
                'Mix dry ingredients in a large bowl',
                'Whisk wet ingredients in separate bowl',
                'Combine wet and dry ingredients until just mixed',
                'Cook on hot griddle until bubbles form, then flip'
            ],
            nutrition: { calories: 220, protein: 8, carbs: 32, fat: 7 },
            allergens: ['dairy', 'eggs', 'gluten'],
            commonIngredients: ['flour', 'milk', 'eggs', 'baking powder']
        }
    ],

    // Lunch Recipes
    lunch: [
        {
            id: 'rice-beans',
            name: 'Rice and Beans',
            description: 'Complete protein meal that stretches the budget',
            servings: 6,
            prepTime: 10,
            cookTime: 25,
            difficulty: 'Easy',
            tags: ['lunch', 'filling', 'protein', 'budget'],
            ingredients: [
                { name: 'white rice', amount: 1, unit: 'bag', category: 'pantry', storeUnit: '5lb bag' },
                { name: 'black beans', amount: 2, unit: 'cans', category: 'pantry', storeUnit: '2 cans' },
                { name: 'onion', amount: 1, unit: 'bag', category: 'produce', storeUnit: '3lb bag' },
                { name: 'garlic', amount: 1, unit: 'head', category: 'produce', storeUnit: '1 head garlic' },
                { name: 'cumin', amount: 1, unit: 'container', category: 'spices', storeUnit: 'spice container' },
                { name: 'olive oil', amount: 1, unit: 'bottle', category: 'pantry', storeUnit: '16.9oz bottle' },
                { name: 'chicken broth', amount: 4, unit: 'cups', category: 'pantry' }
            ],
            instructions: [
                'Cook rice in chicken broth according to package directions',
                'Sauté diced onion and garlic in olive oil',
                'Add drained beans and cumin, heat through',
                'Serve beans over rice'
            ],
            nutrition: { calories: 320, protein: 14, carbs: 58, fat: 5 },
            allergens: [],
            commonIngredients: ['rice', 'beans', 'onion', 'garlic', 'cumin']
        },
        {
            id: 'grilled-cheese-soup',
            name: 'Grilled Cheese & Tomato Soup',
            description: 'Classic comfort food combo that kids love',
            servings: 4,
            prepTime: 10,
            cookTime: 15,
            difficulty: 'Easy',
            tags: ['lunch', 'comfort', 'kid-friendly'],
            ingredients: [
                { name: 'bread', amount: 8, unit: 'slices', category: 'pantry' },
                { name: 'cheddar cheese', amount: 8, unit: 'slices', category: 'dairy' },
                { name: 'butter', amount: 4, unit: 'tbsp', category: 'dairy' },
                { name: 'tomato soup', amount: 2, unit: 'cans', category: 'pantry' },
                { name: 'milk', amount: 1, unit: 'cup', category: 'dairy' }
            ],
            instructions: [
                'Butter one side of each bread slice',
                'Place cheese between bread, butter-side out',
                'Grill sandwiches until golden and cheese melts',
                'Heat soup with milk until warm, serve together'
            ],
            nutrition: { calories: 420, protein: 18, carbs: 38, fat: 22 },
            allergens: ['dairy', 'gluten'],
            commonIngredients: ['bread', 'cheese', 'butter', 'milk']
        }
    ],

    // Dinner Recipes
    dinner: [
        {
            id: 'spaghetti-marinara',
            name: 'Spaghetti with Marinara',
            description: 'Family favorite that feeds a crowd for cheap',
            servings: 8,
            prepTime: 5,
            cookTime: 20,
            difficulty: 'Easy',
            tags: ['dinner', 'pasta', 'kid-friendly', 'large-batch'],
            ingredients: [
                { name: 'spaghetti pasta', amount: 2, unit: 'boxes', category: 'pantry', storeUnit: '2 boxes (1lb each)' },
                { name: 'marinara sauce', amount: 2, unit: 'jars', category: 'pantry', storeUnit: '2 jars marinara sauce' },
                { name: 'ground beef', amount: 1, unit: 'package', category: 'meat', storeUnit: '1lb package ground beef' },
                { name: 'onion', amount: 1, unit: 'bag', category: 'produce', storeUnit: '3lb bag' },
                { name: 'garlic', amount: 1, unit: 'head', category: 'produce', storeUnit: '1 head garlic' },
                { name: 'parmesan cheese', amount: 1, unit: 'container', category: 'dairy', storeUnit: 'grated parmesan container' },
                { name: 'olive oil', amount: 1, unit: 'bottle', category: 'pantry', storeUnit: '16.9oz bottle' }
            ],
            instructions: [
                'Cook pasta according to package directions',
                'Brown ground beef with diced onion and garlic',
                'Add marinara sauce and simmer 10 minutes',
                'Serve over pasta with parmesan cheese'
            ],
            nutrition: { calories: 450, protein: 22, carbs: 52, fat: 15 },
            allergens: ['gluten', 'dairy'],
            commonIngredients: ['pasta', 'marinara', 'ground beef', 'onion', 'garlic']
        },
        {
            id: 'chicken-rice-casserole',
            name: 'Chicken Rice Casserole',
            description: 'One-pan dinner that uses leftover chicken',
            servings: 6,
            prepTime: 15,
            cookTime: 45,
            difficulty: 'Medium',
            tags: ['dinner', 'casserole', 'one-pan', 'leftovers'],
            ingredients: [
                { name: 'chicken breast', amount: 1, unit: 'package', category: 'meat', storeUnit: '2lb package chicken breast' },
                { name: 'white rice', amount: 1, unit: 'bag', category: 'pantry', storeUnit: '5lb bag rice' },
                { name: 'mixed vegetables', amount: 2, unit: 'bags', category: 'frozen', storeUnit: '2 bags frozen mixed vegetables (12oz each)' },
                { name: 'chicken broth', amount: 2, unit: 'cartons', category: 'pantry', storeUnit: '2 cartons chicken broth (32oz each)' },
                { name: 'cheddar cheese', amount: 1, unit: 'bag', category: 'dairy', storeUnit: '1 bag shredded cheddar cheese (8oz)' },
                { name: 'onion', amount: 1, unit: 'bag', category: 'produce', storeUnit: '3lb bag onions' },
                { name: 'cream of mushroom soup', amount: 1, unit: 'can', category: 'pantry', storeUnit: '1 can cream of mushroom soup' }
            ],
            instructions: [
                'Cook and dice chicken breast',
                'Mix rice, chicken, vegetables, and diced onion in casserole dish',
                'Combine broth and soup, pour over rice mixture',
                'Bake covered at 350°F for 45 minutes, top with cheese last 5 minutes'
            ],
            nutrition: { calories: 380, protein: 28, carbs: 35, fat: 14 },
            allergens: ['dairy'],
            commonIngredients: ['chicken', 'rice', 'mixed vegetables', 'broth', 'cheese']
        },
        {
            id: 'slow-cooker-chili',
            name: 'Slow Cooker Chili',
            description: 'Set it and forget it meal that makes great leftovers',
            servings: 10,
            prepTime: 15,
            cookTime: 480,
            difficulty: 'Easy',
            tags: ['dinner', 'slow-cooker', 'large-batch', 'freezer-friendly'],
            ingredients: [
                { name: 'ground beef', amount: 2, unit: 'packages', category: 'meat', storeUnit: '2 packages ground beef (1lb each)' },
                { name: 'kidney beans', amount: 2, unit: 'cans', category: 'pantry', storeUnit: '2 cans kidney beans' },
                { name: 'black beans', amount: 2, unit: 'cans', category: 'pantry', storeUnit: '2 cans black beans' },
                { name: 'diced tomatoes', amount: 2, unit: 'cans', category: 'pantry', storeUnit: '2 cans diced tomatoes' },
                { name: 'tomato sauce', amount: 1, unit: 'can', category: 'pantry', storeUnit: '1 can tomato sauce' },
                { name: 'onion', amount: 1, unit: 'bag', category: 'produce', storeUnit: '3lb bag onions' },
                { name: 'bell pepper', amount: 3, unit: 'peppers', category: 'produce', storeUnit: '3 bell peppers' },
                { name: 'chili powder', amount: 1, unit: 'container', category: 'spices', storeUnit: '1 container chili powder' },
                { name: 'cumin', amount: 1, unit: 'container', category: 'spices', storeUnit: '1 container cumin' }
            ],
            instructions: [
                'Brown ground beef with diced onions and peppers',
                'Transfer to slow cooker with remaining ingredients',
                'Cook on low 8 hours or high 4 hours',
                'Serve with cornbread or over rice'
            ],
            nutrition: { calories: 340, protein: 24, carbs: 28, fat: 12 },
            allergens: [],
            commonIngredients: ['ground beef', 'beans', 'tomatoes', 'onion', 'bell pepper']
        },
        {
            id: 'baked-chicken-thighs',
            name: 'Herb Baked Chicken Thighs',
            description: 'Economical cut of chicken with maximum flavor',
            servings: 6,
            prepTime: 10,
            cookTime: 45,
            difficulty: 'Easy',
            tags: ['dinner', 'chicken', 'budget', 'protein'],
            ingredients: [
                { name: 'chicken thighs', amount: 1, unit: 'package', category: 'meat', storeUnit: '3lb family pack' },
                { name: 'potatoes', amount: 1, unit: 'bag', category: 'produce', storeUnit: '5lb bag potatoes' },
                { name: 'carrots', amount: 2, unit: 'lbs', category: 'produce', storeUnit: '2lb bag carrots' },
                { name: 'onion', amount: 1, unit: 'bag', category: 'produce', storeUnit: '3lb bag' },
                { name: 'olive oil', amount: 1, unit: 'bottle', category: 'pantry', storeUnit: '16.9oz bottle' },
                { name: 'garlic powder', amount: 1, unit: 'container', category: 'spices', storeUnit: 'spice container' },
                { name: 'rosemary', amount: 1, unit: 'container', category: 'spices', storeUnit: 'spice container' },
                { name: 'thyme', amount: 1, unit: 'container', category: 'spices', storeUnit: 'spice container' }
            ],
            instructions: [
                'Cut potatoes and carrots into chunks, slice onion',
                'Toss vegetables with 2 tbsp oil and season',
                'Season chicken with remaining oil and spices',
                'Bake everything at 425°F for 45 minutes until chicken is done'
            ],
            nutrition: { calories: 420, protein: 32, carbs: 28, fat: 18 },
            allergens: [],
            commonIngredients: ['chicken thighs', 'potatoes', 'carrots', 'onion']
        },
        {
            id: 'tuna-noodle-casserole',
            name: 'Tuna Noodle Casserole',
            description: 'Budget-friendly classic using pantry staples',
            servings: 8,
            prepTime: 20,
            cookTime: 30,
            difficulty: 'Easy',
            tags: ['dinner', 'casserole', 'budget', 'pantry-friendly'],
            ingredients: [
                { name: 'egg noodles', amount: 12, unit: 'oz', category: 'pantry' },
                { name: 'tuna', amount: 3, unit: 'cans', category: 'pantry' },
                { name: 'cream of mushroom soup', amount: 2, unit: 'cans', category: 'pantry' },
                { name: 'frozen peas', amount: 2, unit: 'cups', category: 'frozen' },
                { name: 'cheddar cheese', amount: 2, unit: 'cups', category: 'dairy' },
                { name: 'breadcrumbs', amount: 1, unit: 'cup', category: 'pantry' },
                { name: 'butter', amount: 2, unit: 'tbsp', category: 'dairy' }
            ],
            instructions: [
                'Cook noodles according to package directions',
                'Mix noodles, tuna, soup, peas, and half the cheese',
                'Transfer to baking dish, top with remaining cheese and breadcrumbs',
                'Bake at 350°F for 30 minutes until bubbly'
            ],
            nutrition: { calories: 350, protein: 22, carbs: 32, fat: 15 },
            allergens: ['gluten', 'dairy'],
            commonIngredients: ['noodles', 'tuna', 'soup', 'peas', 'cheese']
        }
    ],

    // Budget-Stretcher Meals
    budget: [
        {
            id: 'lentil-soup',
            name: 'Hearty Lentil Soup',
            description: 'Protein-packed soup that costs under $1 per serving',
            servings: 8,
            prepTime: 15,
            cookTime: 45,
            difficulty: 'Easy',
            tags: ['budget', 'soup', 'protein', 'healthy'],
            ingredients: [
                { name: 'dried lentils', amount: 2, unit: 'cups', category: 'pantry' },
                { name: 'vegetable broth', amount: 8, unit: 'cups', category: 'pantry' },
                { name: 'carrots', amount: 3, unit: 'whole', category: 'produce' },
                { name: 'celery', amount: 3, unit: 'stalks', category: 'produce' },
                { name: 'onion', amount: 1, unit: 'whole', category: 'produce' },
                { name: 'diced tomatoes', amount: 1, unit: 'can', category: 'pantry' },
                { name: 'garlic', amount: 4, unit: 'cloves', category: 'produce' },
                { name: 'bay leaves', amount: 2, unit: 'whole', category: 'spices' }
            ],
            instructions: [
                'Sauté diced vegetables in oil until soft',
                'Add lentils, broth, tomatoes, and seasonings',
                'Simmer 45 minutes until lentils are tender',
                'Remove bay leaves before serving'
            ],
            nutrition: { calories: 240, protein: 16, carbs: 40, fat: 2 },
            allergens: [],
            commonIngredients: ['lentils', 'broth', 'carrots', 'celery', 'onion']
        },
        {
            id: 'potato-leek-soup',
            name: 'Creamy Potato Soup',
            description: 'Filling soup using inexpensive potatoes',
            servings: 6,
            prepTime: 20,
            cookTime: 30,
            difficulty: 'Easy',
            tags: ['budget', 'soup', 'creamy', 'filling'],
            ingredients: [
                { name: 'potatoes', amount: 3, unit: 'lbs', category: 'produce' },
                { name: 'onion', amount: 1, unit: 'whole', category: 'produce' },
                { name: 'chicken broth', amount: 6, unit: 'cups', category: 'pantry' },
                { name: 'milk', amount: 2, unit: 'cups', category: 'dairy' },
                { name: 'butter', amount: 3, unit: 'tbsp', category: 'dairy' },
                { name: 'flour', amount: 3, unit: 'tbsp', category: 'pantry' },
                { name: 'cheddar cheese', amount: 1, unit: 'cup', category: 'dairy' }
            ],
            instructions: [
                'Peel and cube potatoes, dice onion',
                'Simmer potatoes and onion in broth until tender',
                'Make roux with butter and flour, add milk',
                'Combine all ingredients, blend partially for texture'
            ],
            nutrition: { calories: 290, protein: 12, carbs: 42, fat: 10 },
            allergens: ['dairy', 'gluten'],
            commonIngredients: ['potatoes', 'onion', 'broth', 'milk', 'cheese']
        }
    ]
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RECIPES_DATABASE };
}