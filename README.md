# Family Budget Meals - Smart Meal Planning

A comprehensive web application that helps families create budget-friendly meal plans optimized for shared ingredients, real-world pricing, and nutritional needs.

## Features

### 🍽️ Smart Meal Planning
- **Budget-First Approach**: Set your weekly grocery budget and get meals that fit
- **Family Size Scaling**: Automatically adjusts portions for adults and children of different ages
- **Allergy & Preference Filtering**: Excludes meals based on dietary restrictions and dislikes
- **Ingredient Optimization**: Selects meals that share common ingredients to minimize waste

### 💰 Real-World Pricing
- **Walmart-Based Pricing**: Uses current Walmart prices as baseline for accurate cost estimates
- **Regional Adjustment**: Adjusts prices based on your location across all 50 US states
- **Live Cost Tracking**: Shows total cost, per-meal cost, and cost per serving
- **Bulk Buying Optimization**: Suggests bulk purchases when cost-effective

### 🛒 Smart Shopping Lists
- **Categorized Lists**: Groups ingredients by store section (produce, meat, dairy, etc.)
- **Consolidated Quantities**: Combines ingredients used across multiple meals
- **Store-Optimized Layout**: Organizes list for efficient shopping at major retailers
- **Cost Breakdown**: Shows price for each item and category totals

### 📝 Recipe Management
- **Comprehensive Database**: 20+ budget-friendly family recipes with detailed instructions
- **Nutritional Information**: Calories, protein, carbs, and fat per serving
- **Difficulty Ratings**: Easy-to-follow recipes suitable for busy families
- **Prep Time Tracking**: Know exactly how long each meal takes to prepare

### 🌐 Website Integration
- **Auto-Upload to Blog**: Converts meal plans into blog posts for your website
- **SEO-Optimized Content**: Generates complete articles with ingredients, instructions, and tips
- **Recipe Scaling Documentation**: Includes scaling information and budget tips
- **Metadata Rich**: Includes nutritional info, costs, and preparation details

## How It Works

1. **Set Your Parameters**
   - Weekly grocery budget
   - Family size (adults + kids with ages)
   - Location for pricing accuracy
   - Number of meals to plan
   - Allergies and food dislikes

2. **AI-Powered Selection**
   - Algorithm analyzes 20+ recipes for budget fit
   - Optimizes for ingredient overlap to minimize waste
   - Considers nutrition, family-friendliness, and preparation time
   - Scales portions automatically for your family size

3. **Get Your Plan**
   - Complete meal plan with cost breakdown
   - Detailed shopping list organized by store section
   - Individual recipe regeneration options
   - Export options for printing or digital use

4. **Upload to Website** (Optional)
   - Convert meal plan to blog content
   - Individual recipe posts with full details
   - Automatic SEO optimization
   - Integration with tcoffin-dashboard

## Getting Started

### Quick Start
1. Open `index.html` in a web browser
2. Fill out the meal planning form
3. Click "Generate Meal Plan"
4. Review your customized meal plan and shopping list
5. Optionally upload recipes to your website

## File Structure

```
family-budget-meals/
├── index.html                 # Main application page
├── styles/
│   └── main.css              # Application styles
├── js/
│   ├── app.js                # Main application logic
│   ├── data/
│   │   ├── recipes.js        # Recipe database
│   │   └── prices.js         # Pricing database with regional data  
│   └── utils/
│       ├── mealSelector.js   # Meal selection algorithm
│       ├── shoppingList.js   # Shopping list generation
│       ├── recipeUploader.js # Website integration
│       └── pricing.js        # Pricing utilities
└── README.md                 # This file
```

**Built with families in mind** - helping you eat nutritiously without breaking the bank! 🍽️💰
