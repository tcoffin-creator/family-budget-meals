// Main application logic for Family Budget Meals with Secure Backend
class FamilyBudgetMealsApp {
    constructor() {
        // Initialize secure API client for backend communication
        this.secureAPI = new SecureAPIClient();
        this.shoppingListGenerator = new SimpleShoppingListGenerator();
        this.recipeSaver = new RecipeSaver();
        
        // Legacy services for fallback
        this.mealSelector = new MealSelector(RECIPES_DATABASE);
        this.walmartAPI = new WalmartPricingAPI();
        
        this.currentMealPlan = null;
        this.currentShoppingList = null;
        this.userParams = null;
        this.currentStore = null;
        
        this.init();
    }

    // Initialize the application
    init() {
        this.bindEvents();
        this.loadSavedData();
        this.showSection('setup'); // Go directly to setup, no API config needed
    }

    // Bind event listeners
    bindEvents() {
        // Form submission
        const form = document.getElementById('meal-planner-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // Start Over button
        const startOverBtn = document.getElementById('start-over-btn');
        if (startOverBtn) {
            startOverBtn.addEventListener('click', () => this.startOver());
        }

        // New plan button
        const newPlanBtn = document.getElementById('new-plan-btn');
        if (newPlanBtn) {
            newPlanBtn.addEventListener('click', () => this.startNewPlan());
        }

        // Save meal plan button
        const savePlanBtn = document.getElementById('save-meal-plan-btn');
        if (savePlanBtn) {
            savePlanBtn.addEventListener('click', () => this.showSaveMealPlanDialog());
        }

        // View saved recipes button
        const viewSavedBtn = document.getElementById('view-saved-btn');
        if (viewSavedBtn) {
            viewSavedBtn.addEventListener('click', () => this.showSavedRecipes());
        }

        // Save shopping list button
        const saveShoppingListBtn = document.getElementById('save-shopping-list-btn');
        if (saveShoppingListBtn) {
            saveShoppingListBtn.addEventListener('click', () => this.saveShoppingList());
        }

        // Save all recipes to PDF button
        const saveAllRecipesBtn = document.getElementById('save-all-recipes-btn');
        if (saveAllRecipesBtn) {
            saveAllRecipesBtn.addEventListener('click', () => this.saveAllRecipesToPDF());
        }

        // Note: Recipe upload functionality will be handled by automatic website integration

        // Kids input change - show/hide age input
        const kidsInput = document.getElementById('kids');
        const kidAgesGroup = document.getElementById('kid-ages').parentElement;
        if (kidsInput && kidAgesGroup) {
            kidsInput.addEventListener('change', (e) => {
                if (parseInt(e.target.value) > 0) {
                    kidAgesGroup.style.display = 'block';
                } else {
                    kidAgesGroup.style.display = 'none';
                }
            });
        }
    }

    // Handle form submission
    async handleFormSubmit(e) {
        e.preventDefault();
        console.log('Form submitted');
        
        const formData = new FormData(e.target);
        this.userParams = {
            weeklyBudget: parseFloat(formData.get('weeklyBudget')),
            adults: parseInt(formData.get('adults')),
            kids: parseInt(formData.get('kids')),
            kidAges: formData.get('kidAges'),
            zipCode: formData.get('zipcode'),
            mealsCount: parseInt(formData.get('mealsCount')),
            allergies: formData.get('allergies')
        };

        console.log('User params:', this.userParams);

        // Validate form data
        if (!this.validateParams(this.userParams)) {
            return;
        }

        console.log('Validation passed');

        // Save parameters for later use
        this.saveUserParams();

        // Show loading and generate meal plan
        this.showSection('loading');
        console.log('Loading section shown');
        
        try {
            await this.generateAIMealPlan();
        } catch (error) {
            console.error('Error generating meal plan:', error);
            this.showError('Failed to generate meal plan. Please try again.');
            this.showSection('setup');
        }
    }

    // Validate form parameters
    validateParams(params) {
        console.log('Validating params:', params);
        
        if (!params.weeklyBudget || params.weeklyBudget < 20) {
            this.showError('Weekly budget must be at least $20');
            return false;
        }

        if (!params.adults || params.adults < 1) {
            this.showError('Must have at least 1 adult');
            return false;
        }

        if (params.kids > 0 && !params.kidAges) {
            this.showError('Please enter the ages of children');
            return false;
        }

        if (!params.zipCode || !/^\d{5}$/.test(params.zipCode)) {
            this.showError('Please enter a valid 5-digit zip code');
            return false;
        }

        return true;
    }

    // Generate meal plan
    async generateMealPlan() {
        try {
            console.log('Starting meal plan generation...');
            
            // For now, let's use a simpler approach without the Walmart API
            await this.updateStatus('Selecting budget-friendly meals...');
            console.log('Selecting meals...');
            
            // Use the original meal selector but with zip code mapped to location
            this.currentMealPlan = this.mealSelector.selectMeals({
                ...this.userParams,
                location: `Zip: ${this.userParams.zipCode}` // Simple mapping for now
            });
            
            console.log('Selected meals:', this.currentMealPlan);
            
            if (!this.currentMealPlan || this.currentMealPlan.length === 0) {
                throw new Error('No suitable meals found for your criteria');
            }

            // Generate simplified shopping list
            await this.updateStatus('Creating your shopping list...');
            console.log('Generating shopping list...');
            
            this.currentShoppingList = this.generateSimpleShoppingList();
            console.log('Shopping list:', this.currentShoppingList);

            // Display results
            console.log('Displaying results...');
            this.displayResults();
            this.showSection('results');
            console.log('Done!');
        } catch (error) {
            console.error('Error in generateMealPlan:', error);
            throw error;
        }
    }

    // Generate AI-powered meal plan with secure backend
    async generateAIMealPlan() {
        try {
            console.log('Starting secure AI meal plan generation...');
            
            await this.updateStatus('🤖 Generating healthy AI recipes for your family...');
            console.log('Generating AI recipes via secure backend...');
            
            // Calculate family size and dietary restrictions
            const familySize = this.userParams.adults + this.userParams.kids;
            const dietaryRestrictions = this.userParams.allergies ? 
                this.userParams.allergies.split(',').map(s => s.trim()).filter(s => s) : [];
            
            // Generate AI recipes using secure backend
            this.currentMealPlan = await this.secureAPI.generateHealthyRecipes(
                familySize, 
                this.userParams.weeklyBudget, 
                this.userParams.zipCode,
                dietaryRestrictions
            );
            
            console.log('AI recipes generated:', this.currentMealPlan);
            
            if (!this.currentMealPlan || this.currentMealPlan.length === 0) {
                throw new Error('AI failed to generate suitable recipes for your criteria');
            }

            await this.updateStatus(`💲 Searching for live grocery prices in your area (${this.userParams.zipCode})...`);
            console.log('Getting real-time geographic pricing via secure backend...');
            
            // Update recipes with real-time pricing using secure backend
            this.currentMealPlan = await this.updateMealPlanWithSecurePricing(this.currentMealPlan);

            // Generate shopping list with proper grocery store quantities
            await this.updateStatus('🛒 Creating your optimized shopping list...');
            console.log('Generating shopping list...');
            
            this.currentShoppingList = this.generateSimpleShoppingList();
            console.log('Shopping list:', this.currentShoppingList);

            // Display results
            console.log('Displaying results...');
            this.displayResults();
            this.showSection('results');
            console.log('Secure AI meal plan generation complete!');
        } catch (error) {
            console.error('Error in generateAIMealPlan:', error);
            // Fallback to static recipes if secure API fails
            console.log('Falling back to static recipes...');
            await this.generateMealPlan();
        }
    }

    // Update meal plan with real pricing using secure backend
    async updateMealPlanWithSecurePricing(mealPlan) {
        const updatedMeals = [];
        
        for (const meal of mealPlan) {
            console.log(`Getting secure pricing for ${meal.name}...`);
            
            // Get pricing for each ingredient using secure backend
            const pricedIngredients = await this.secureAPI.getBulkPricing(
                meal.ingredients, 
                this.userParams.zipCode
            );
            
            // Calculate total meal cost
            let totalCost = 0;
            const updatedIngredients = pricedIngredients.map(ingredient => {
                const price = ingredient.pricing.price || 0;
                totalCost += price;
                
                return {
                    ...ingredient,
                    price: price,
                    productName: ingredient.pricing.name || ingredient.name,
                    inStock: ingredient.pricing.inStock !== false
                };
            });
            
            // Update meal with pricing information
            const updatedMeal = {
                ...meal,
                ingredients: updatedIngredients,
                pricing: {
                    totalCost: Math.round(totalCost * 100) / 100,
                    costPerServing: Math.round((totalCost / meal.servings) * 100) / 100,
                    lastUpdated: new Date().toISOString()
                }
            };
            
            updatedMeals.push(updatedMeal);
        }
        
        return updatedMeals;
    }
    
    // Generate simple shopping list using grocery store quantities
    generateSimpleShoppingList() {
        return this.shoppingListGenerator.generateShoppingList(this.currentMealPlan, this.userParams.zipCode);
    }

    // Update loading status
    async updateStatus(message) {
        const statusElement = document.querySelector('#loading-section p');
        if (statusElement) {
            statusElement.textContent = message;
        }
        await this.delay(500);
    }

    // Select meals with real Walmart pricing
    async selectMealsWithRealPricing() {
        // Use the meal selector but with real pricing
        const selectedMeals = this.mealSelector.selectMeals({
            ...this.userParams,
            location: this.userParams.zipCode // Pass zip code as location for now
        });

        // Update each meal with real Walmart pricing
        const mealsWithRealPricing = [];
        for (const meal of selectedMeals) {
            const updatedMeal = await this.updateMealWithRealPricing(meal);
            mealsWithRealPricing.push(updatedMeal);
        }

        return mealsWithRealPricing;
    }

    // Update a meal with real Walmart pricing
    async updateMealWithRealPricing(meal) {
        const pricedIngredients = await this.walmartAPI.getBulkPricing(
            meal.ingredients,
            this.userParams.zipCode
        );

        let totalCost = 0;
        const updatedIngredients = pricedIngredients.map(ingredient => {
            const unitPrice = ingredient.pricing.price;
            const totalPrice = unitPrice * ingredient.amount;
            totalCost += totalPrice;

            return {
                ...ingredient,
                unitPrice: unitPrice,
                totalPrice: totalPrice,
                productName: ingredient.pricing.productName,
                inStock: ingredient.pricing.inStock
            };
        });

        return {
            ...meal,
            ingredients: updatedIngredients,
            pricing: {
                totalCost: Math.round(totalCost * 100) / 100,
                costPerServing: Math.round((totalCost / meal.scaledServings) * 100) / 100,
                lastUpdated: new Date().toISOString(),
                source: 'Walmart Real-Time Pricing'
            }
        };
    }

    // Note: Shopping list generation now handled by SimpleShoppingListGenerator

    // Display meal plan and shopping list results
    displayResults() {
        this.displayBudgetSummary();
        this.displayMealPlan();
        this.displayShoppingList();
    }

    // Display budget summary using shopping list total
    displayBudgetSummary() {
        const totalCost = this.currentShoppingList.totals.totalCost;
        const avgCostPerMeal = totalCost / this.currentMealPlan.length;

        document.getElementById('total-budget').textContent = `$${this.userParams.weeklyBudget.toFixed(2)}`;
        document.getElementById('estimated-cost').textContent = `$${totalCost.toFixed(2)}`;
        document.getElementById('per-meal-cost').textContent = `$${avgCostPerMeal.toFixed(2)}`;

        // Color code based on budget adherence
        const costElement = document.getElementById('estimated-cost');
        if (totalCost <= this.userParams.weeklyBudget) {
            costElement.className = 'value text-success';
        } else if (totalCost <= this.userParams.weeklyBudget * 1.1) {
            costElement.className = 'value text-warning';
        } else {
            costElement.className = 'value text-danger';
        }
    }

    // Display meal plan grid
    displayMealPlan() {
        const mealGrid = document.getElementById('meal-plan-grid');
        mealGrid.innerHTML = '';

        this.currentMealPlan.forEach((meal, index) => {
            const mealCard = this.createMealCard(meal, index);
            mealGrid.appendChild(mealCard);
        });
    }

    // Create individual meal card
    createMealCard(meal, index) {
        const card = document.createElement('div');
        card.className = 'meal-card';
        card.innerHTML = `
            <div class="meal-header">
                <h3 class="meal-title">${meal.name}</h3>
                <div class="meal-cost">$${meal.pricing.totalCost.toFixed(2)}</div>
            </div>
            <div class="meal-info">
                <p><strong>Serves:</strong> ${meal.scaledServings} people</p>
                <p><strong>Time:</strong> ${meal.prepTime + meal.cookTime} minutes</p>
                <p><strong>Per Serving:</strong> $${meal.pricing.costPerServing.toFixed(2)}</p>
                <p><strong>Difficulty:</strong> ${meal.difficulty}</p>
            </div>
            <div class="meal-ingredients">
                <h4>Key Ingredients:</h4>
                <ul class="ingredient-list">
                    ${meal.ingredients.slice(0, 5).map(ing => 
                        `<li>${ing.storeUnit || `${ing.amount} ${ing.unit} ${ing.name}`}</li>`
                    ).join('')}
                    ${meal.ingredients.length > 5 ? 
                        `<li><a href="#" onclick="app.showFullRecipe('${meal.id}', ${index}); return false;" class="show-more-link">...and ${meal.ingredients.length - 5} more (click for full recipe)</a></li>` : 
                        `<li><a href="#" onclick="app.showFullRecipe('${meal.id}', ${index}); return false;" class="show-full-recipe-link">View full recipe with instructions</a></li>`
                    }
                </ul>
            </div>
            <div class="meal-actions">
                <button class="btn btn-primary btn-view-recipe" onclick="app.showFullRecipe('${meal.id}', ${index})">
                    <i class="fas fa-book-open"></i> View Recipe
                </button>
                <button class="btn btn-regenerate" onclick="app.regenerateMeal(${index})">
                    <i class="fas fa-refresh"></i> Find Alternative
                </button>
                <button class="btn btn-save-recipe" onclick="app.saveIndividualRecipe('${meal.id}', ${index})" 
                        title="Save this recipe">
                    <i class="fas fa-heart${this.recipeSaver.isRecipeSaved(meal.id) ? ' saved' : ''}"></i> Save Recipe
                </button>
            </div>
        `;
        return card;
    }

    // Display simplified shopping list with grocery store quantities
    displayShoppingList() {
        const shoppingListContainer = document.getElementById('shopping-list');
        const totalElement = document.getElementById('shopping-total');
        const storeElement = document.getElementById('store-number');
        
        shoppingListContainer.innerHTML = '';
        
        // Format shopping list for display
        const formattedList = this.shoppingListGenerator.formatForDisplay(this.currentShoppingList);
        
        // Create simple list
        const listDiv = document.createElement('div');
        listDiv.className = 'shopping-items-simple';
        
        formattedList.items.forEach((item, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'shopping-item-checkbox';
            
            const checkedState = this.getItemCheckedState(item.id) ? 'checked' : '';
            const checkedClass = this.getItemCheckedState(item.id) ? 'checked' : '';
            
            itemDiv.innerHTML = `
                <label class="checkbox-item ${checkedClass}">
                    <input type="checkbox" ${checkedState} onchange="app.toggleShoppingItem('${item.id}', this)" data-item-id="${item.id}">
                    <span class="checkmark"></span>
                    <span class="shopping-item-name">
                        ${item.name}
                        ${!item.inStock ? '<span style="color: #dc3545;"> (Check availability)</span>' : ''}
                    </span>
                    <span class="shopping-item-price">$${item.price.toFixed(2)}</span>
                </label>
            `;
            
            listDiv.appendChild(itemDiv);
        });
        
        shoppingListContainer.appendChild(listDiv);
        
        // Update totals and store info
        totalElement.textContent = `$${this.currentShoppingList.totals.totalCost.toFixed(2)}`;
        if (storeElement) {
            // Show pricing source information
            const pricingSources = this.getPricingSources();
            storeElement.innerHTML = `
                Multiple Stores (${this.userParams.zipCode})
                <small style="display: block; color: #666; font-size: 0.8em;">
                    Pricing: ${pricingSources.join(', ')}
                </small>
            `;
        }
    }

    // Get pricing sources for display with geographic information
    getPricingSources() {
        if (!this.currentMealPlan || this.currentMealPlan.length === 0) {
            return ['Estimated'];
        }

        const sources = new Set();
        const locations = new Set();
        
        this.currentMealPlan.forEach(meal => {
            if (meal.ingredients) {
                meal.ingredients.forEach(ingredient => {
                    if (ingredient.pricing && ingredient.pricing.source) {
                        const source = ingredient.pricing.source;
                        
                        // Add location information if available
                        if (ingredient.pricing.location) {
                            locations.add(ingredient.pricing.location);
                        }
                        if (ingredient.pricing.store) {
                            locations.add(ingredient.pricing.store);
                        }
                        
                        // Categorize pricing sources with geographic context
                        if (source.includes('ai_geographic')) sources.add('AI Regional Search');
                        else if (source.includes('geographic_search')) sources.add('Local Store Data');
                        else if (source.includes('ai_enhanced')) sources.add('AI-Enhanced');
                        else if (source.includes('scraped')) sources.add('Live Web Pricing');
                        else if (source.includes('geographic')) sources.add('Regional Data');
                        else if (source.includes('regional')) sources.add('Regional Estimates');
                        else sources.add('Basic Estimates');
                    }
                });
            }
        });

        const sourceArray = Array.from(sources);
        const locationArray = Array.from(locations);
        
        // If we have location data, include it
        if (locationArray.length > 0 && !sourceArray.includes('Basic Estimates')) {
            return [...sourceArray, `(${locationArray[0]})`];
        }
        
        return sourceArray;
    }

    // Regenerate a specific meal
    async regenerateMeal(mealIndex) {
        if (!this.userParams || !this.currentMealPlan) {
            return;
        }

        try {
            // Show loading state for the specific meal card
            const mealCards = document.querySelectorAll('.meal-card');
            if (mealCards[mealIndex]) {
                mealCards[mealIndex].style.opacity = '0.5';
                mealCards[mealIndex].querySelector('.btn-regenerate').disabled = true;
                mealCards[mealIndex].querySelector('.btn-regenerate').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Finding...';
            }

            // Generate new meal
            const newMeal = this.mealSelector.regenerateMeal(mealIndex, {
                ...this.userParams,
                location: this.userParams.zipCode // Map zipCode to location for meal selector
            });
            
            if (newMeal) {
                this.currentMealPlan[mealIndex] = newMeal;
                
                // Regenerate shopping list
                this.currentShoppingList = this.generateSimpleShoppingList();
                
                // Update display
                this.displayResults();
                
                // Show success message
                this.showMessage(`Replaced with ${newMeal.name}!`, 'success');
            } else {
                this.showMessage('No alternative meals found. Try adjusting your preferences.', 'warning');
            }

        } catch (error) {
            console.error('Error regenerating meal:', error);
            this.showMessage('Failed to find alternative meal. Please try again.', 'error');
        }
    }

    // Handle recipe upload to website
    async handleRecipeUpload() {
        if (!this.currentMealPlan) {
            this.showMessage('No meal plan to upload', 'error');
            return;
        }

        try {
            // Convert meals to blog posts
            const blogPosts = this.recipeUploader.convertRecipesToBlogPosts(
                this.currentMealPlan, 
                { name: 'Family Budget Meals User' }
            );

            // Show upload progress
            this.showUploadProgress();

            // Upload recipes
            const uploadResults = await this.recipeUploader.uploadRecipes(blogPosts, {
                onProgress: (progress) => this.updateUploadProgress(progress)
            });

            // Show results
            this.showUploadResults(uploadResults);

        } catch (error) {
            console.error('Upload error:', error);
            this.showMessage('Failed to upload recipes. Please try again.', 'error');
        }
    }

    // Show upload progress modal
    showUploadProgress() {
        // Create modal if it doesn't exist
        let modal = document.getElementById('upload-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'upload-modal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <h3><i class="fas fa-cloud-upload-alt"></i> Uploading Recipes</h3>
                    <div class="progress-bar">
                        <div class="progress-fill" id="upload-progress-fill"></div>
                    </div>
                    <p id="upload-status">Preparing recipes for upload...</p>
                    <div id="upload-details"></div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        
        // Add modal styles if not already added
        if (!document.getElementById('modal-styles')) {
            const styles = document.createElement('style');
            styles.id = 'modal-styles';
            styles.textContent = `
                .modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }
                .modal-content {
                    background: white;
                    padding: 2rem;
                    border-radius: 15px;
                    max-width: 500px;
                    width: 90%;
                }
                .progress-bar {
                    width: 100%;
                    height: 20px;
                    background: #eee;
                    border-radius: 10px;
                    overflow: hidden;
                    margin: 1rem 0;
                }
                .progress-fill {
                    height: 100%;
                    background: #667eea;
                    width: 0%;
                    transition: width 0.3s ease;
                }
            `;
            document.head.appendChild(styles);
        }
        
        modal.style.display = 'flex';
    }

    // Update upload progress
    updateUploadProgress(progress) {
        const progressFill = document.getElementById('upload-progress-fill');
        const statusElement = document.getElementById('upload-status');
        
        if (progressFill && statusElement) {
            const percentage = (progress.completed / progress.total) * 100;
            progressFill.style.width = `${percentage}%`;
            statusElement.textContent = `Uploading: ${progress.current} (${progress.completed}/${progress.total})`;
        }
    }

    // Show upload results
    showUploadResults(results) {
        const modal = document.getElementById('upload-modal');
        const modalContent = modal.querySelector('.modal-content');
        
        const successCount = results.summary.success;
        const failureCount = results.summary.failed;
        
        modalContent.innerHTML = `
            <h3><i class="fas fa-check-circle"></i> Upload Complete</h3>
            <div class="upload-summary">
                <p><strong>Successfully uploaded:</strong> ${successCount} recipes</p>
                ${failureCount > 0 ? `<p class="text-danger"><strong>Failed:</strong> ${failureCount} recipes</p>` : ''}
            </div>
            <div class="upload-details">
                ${results.results.map(result => `
                    <div class="upload-result ${result.success ? 'success' : 'error'}">
                        <i class="fas fa-${result.success ? 'check' : 'times'}"></i>
                        ${result.post}
                        ${result.success && result.result.url ? `<br><small><a href="${result.result.url}" target="_blank">View on website</a></small>` : ''}
                    </div>
                `).join('')}
            </div>
            <button class="btn btn-primary" onclick="app.closeUploadModal()">Close</button>
        `;
    }

    // Close upload modal
    closeUploadModal() {
        const modal = document.getElementById('upload-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // Start a new meal plan
    startNewPlan() {
        this.currentMealPlan = null;
        this.currentShoppingList = null;
        this.showSection('setup');
        
        // Reset form
        const form = document.getElementById('meal-planner-form');
        if (form) {
            form.reset();
        }
    }

    // Start over - return to setup
    startOver() {
        this.currentMealPlan = null;
        this.currentShoppingList = null;
        this.showSection('setup');
    }

    // Show specific section
    showSection(sectionName) {
        const sections = ['setup', 'loading', 'results'];
        sections.forEach(section => {
            const element = document.getElementById(`${section}-section`);
            if (element) {
                element.classList.toggle('hidden', section !== sectionName);
            }
        });
    }

    // Show error message
    showError(message) {
        this.showMessage(message, 'error');
    }

    // Show message with type
    showMessage(message, type = 'info') {
        // Remove any existing messages
        const existingMessage = document.querySelector('.app-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Create new message
        const messageDiv = document.createElement('div');
        messageDiv.className = `app-message ${type}`;
        messageDiv.innerHTML = `
            <div class="message-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                ${message}
                <button class="message-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        // Add styles if not already added
        if (!document.getElementById('message-styles')) {
            const styles = document.createElement('style');
            styles.id = 'message-styles';
            styles.textContent = `
                .app-message {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 1000;
                    max-width: 400px;
                }
                .message-content {
                    padding: 1rem;
                    border-radius: 8px;
                    color: white;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    animation: slideIn 0.3s ease;
                }
                .app-message.success .message-content { background: #28a745; }
                .app-message.error .message-content { background: #dc3545; }
                .app-message.warning .message-content { background: #ffc107; color: #212529; }
                .app-message.info .message-content { background: #17a2b8; }
                .message-close {
                    background: none;
                    border: none;
                    color: inherit;
                    font-size: 1.2rem;
                    cursor: pointer;
                    margin-left: auto;
                }
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(messageDiv);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentElement) {
                messageDiv.remove();
            }
        }, 5000);
    }

    // Save user parameters to localStorage
    saveUserParams() {
        if (this.userParams) {
            localStorage.setItem('familyBudgetMeals_userParams', JSON.stringify(this.userParams));
        }
    }

    // Load saved data from localStorage
    loadSavedData() {
        const savedParams = localStorage.getItem('familyBudgetMeals_userParams');
        if (savedParams) {
            try {
                const params = JSON.parse(savedParams);
                this.populateForm(params);
            } catch (error) {
                console.error('Failed to load saved parameters:', error);
            }
        }
    }

    // Populate form with saved parameters
    populateForm(params) {
        const form = document.getElementById('meal-planner-form');
        if (!form) return;

        const fields = ['weeklyBudget', 'adults', 'kids', 'kidAges', 'zipcode', 'mealsCount', 'allergies'];
        fields.forEach(field => {
            const element = form.querySelector(`[name="${field}"]`);
            if (element && params[field] !== undefined) {
                // Handle zipcode vs zipCode mismatch
                const paramKey = field === 'zipcode' ? 'zipCode' : field;
                element.value = params[paramKey];
            }
        });
    }

    // Save individual recipe
    saveIndividualRecipe(recipeId, mealIndex) {
        const meal = this.currentMealPlan[mealIndex];
        if (!meal) return;

        // Show notes dialog
        const notes = prompt('Add any personal notes for this recipe (optional):');
        
        try {
            const savedRecipe = this.recipeSaver.saveRecipe(meal, notes || '');
            this.showMessage(`Recipe "${meal.name}" saved successfully!`, 'success');
            
            // Update the save button icon
            const saveBtn = document.querySelector(`[onclick="app.saveIndividualRecipe('${recipeId}', ${mealIndex})"]`);
            if (saveBtn) {
                const icon = saveBtn.querySelector('i');
                icon.className = 'fas fa-heart saved';
                saveBtn.title = 'Recipe saved!';
            }
        } catch (error) {
            console.error('Error saving recipe:', error);
            this.showError('Failed to save recipe. Please try again.');
        }
    }

    // Show save meal plan dialog
    showSaveMealPlanDialog() {
        if (!this.currentMealPlan || !this.currentShoppingList) {
            this.showError('No meal plan to save. Please generate a meal plan first.');
            return;
        }

        const planName = prompt('Enter a name for this meal plan:', `Meal Plan - ${new Date().toLocaleDateString()}`);
        if (planName === null) return; // User cancelled

        try {
            const savedPlan = this.recipeSaver.saveMealPlan(
                this.currentMealPlan, 
                this.userParams, 
                this.currentShoppingList, 
                planName
            );
            
            this.showMessage(`Meal plan "${planName}" saved successfully!`, 'success');
            
            // Offer to download shopping list
            setTimeout(() => {
                if (confirm('Would you like to download the shopping list as a text file?')) {
                    this.downloadShoppingList();
                }
            }, 1000);
        } catch (error) {
            console.error('Error saving meal plan:', error);
            this.showError('Failed to save meal plan. Please try again.');
        }
    }

    // Show saved recipes and meal plans
    showSavedRecipes() {
        const modal = this.createModal('saved-recipes-modal', 'My Saved Recipes & Meal Plans');
        const modalContent = modal.querySelector('.modal-body');
        
        const savedRecipes = this.recipeSaver.getSavedRecipes();
        const savedMealPlans = this.recipeSaver.getSavedMealPlans();
        const stats = this.recipeSaver.getStorageStats();
        
        modalContent.innerHTML = `
            <div class="saved-content-tabs">
                <button class="tab-btn active" onclick="app.showSavedTab('recipes')">
                    <i class="fas fa-utensils"></i> Recipes (${savedRecipes.length})
                </button>
                <button class="tab-btn" onclick="app.showSavedTab('meal-plans')">
                    <i class="fas fa-calendar-alt"></i> Meal Plans (${savedMealPlans.length})
                </button>
            </div>
            
            <div id="saved-recipes-tab" class="tab-content active">
                ${this.renderSavedRecipes(savedRecipes)}
            </div>
            
            <div id="saved-meal-plans-tab" class="tab-content">
                ${this.renderSavedMealPlans(savedMealPlans)}
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    // Download shopping list as text file
    downloadShoppingList() {
        if (!this.currentShoppingList) return;
        
        const textContent = this.recipeSaver.exportShoppingListText(this.currentShoppingList);
        const filename = `shopping-list-${new Date().toISOString().split('T')[0]}.txt`;
        
        this.recipeSaver.downloadFile(textContent, filename, 'text/plain');
    }

    // Create modal helper
    createModal(id, title) {
        // Remove existing modal
        const existing = document.getElementById(id);
        if (existing) existing.remove();
        
        const modal = document.createElement('div');
        modal.id = id;
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close" onclick="document.getElementById('${id}').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body"></div>
            </div>
        `;
        
        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
        
        return modal;
    }

    // Render saved recipes
    renderSavedRecipes(recipes) {
        if (recipes.length === 0) {
            return '<div class="empty-state"><p>No saved recipes yet. Save recipes from your meal plans!</p></div>';
        }
        
        return `
            <div class="saved-recipes-grid">
                ${recipes.map(recipe => `
                    <div class="saved-recipe-card">
                        <h4>${recipe.name}</h4>
                        <p class="recipe-description">${recipe.description}</p>
                        <div class="recipe-meta">
                            <span><i class="fas fa-users"></i> ${recipe.servings} servings</span>
                            <span><i class="fas fa-clock"></i> ${recipe.prepTime + recipe.cookTime}min</span>
                            <span><i class="fas fa-signal"></i> ${recipe.difficulty}</span>
                        </div>
                        ${recipe.userNotes ? `<div class="user-notes"><strong>Notes:</strong> ${recipe.userNotes}</div>` : ''}
                        <div class="recipe-actions">
                            <button class="btn btn-sm" onclick="app.viewRecipeDetails('${recipe.id}')">
                                <i class="fas fa-eye"></i> View
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="app.deleteRecipe('${recipe.id}')">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                        <small class="saved-date">Saved: ${new Date(recipe.savedDate).toLocaleDateString()}</small>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Render saved meal plans
    renderSavedMealPlans(mealPlans) {
        if (mealPlans.length === 0) {
            return '<div class="empty-state"><p>No saved meal plans yet. Save your current meal plan!</p></div>';
        }
        
        return `
            <div class="saved-meal-plans-list">
                ${mealPlans.map(plan => `
                    <div class="saved-meal-plan-card">
                        <h4>${plan.name}</h4>
                        <div class="plan-meta">
                            <span><i class="fas fa-utensils"></i> ${plan.mealCount} meals</span>
                            <span><i class="fas fa-dollar-sign"></i> $${plan.totalCost.toFixed(2)}</span>
                            <span><i class="fas fa-users"></i> ${plan.parameters.adults} adults, ${plan.parameters.kids} kids</span>
                        </div>
                        <div class="plan-actions">
                            <button class="btn btn-sm" onclick="app.loadMealPlan('${plan.id}')">
                                <i class="fas fa-play"></i> Load Plan
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="app.deleteMealPlan('${plan.id}')">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                        <small class="saved-date">Saved: ${new Date(plan.savedDate).toLocaleDateString()}</small>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Render export/import section
    renderExportImport(stats) {
        return `
            <div class="export-import-section">
                <div class="storage-stats">
                    <h4>Storage Statistics</h4>
                    <p><strong>Saved Recipes:</strong> ${stats.totalRecipes}</p>
                    <p><strong>Saved Meal Plans:</strong> ${stats.totalMealPlans}</p>
                    <p><strong>Storage Used:</strong> ${(stats.storageUsed / 1024).toFixed(1)} KB</p>
                </div>
                
                <div class="export-section">
                    <h4>Export Data</h4>
                    <button class="btn" onclick="app.exportAllRecipes()">
                        <i class="fas fa-download"></i> Export All Recipes
                    </button>
                    <button class="btn" onclick="app.exportAllMealPlans()">
                        <i class="fas fa-download"></i> Export All Meal Plans
                    </button>
                </div>
                
                <div class="import-section">
                    <h4>Import Data</h4>
                    <input type="file" id="import-file" accept=".json" style="display: none;" onchange="app.handleImportFile(event)">
                    <button class="btn" onclick="document.getElementById('import-file').click()">
                        <i class="fas fa-upload"></i> Import Recipes
                    </button>
                    <p><small>Import previously exported recipe files</small></p>
                </div>
            </div>
        `;
    }

    // Switch saved content tabs
    showSavedTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(`saved-${tabName}-tab`).classList.add('active');
    }

    // Export functions
    exportAllRecipes() {
        const jsonData = this.recipeSaver.exportRecipes();
        const filename = `family-budget-recipes-${new Date().toISOString().split('T')[0]}.json`;
        this.recipeSaver.downloadFile(jsonData, filename);
    }

    exportMealPlan(planId) {
        const jsonData = this.recipeSaver.exportMealPlan(planId);
        if (jsonData) {
            const filename = `meal-plan-${planId}-${new Date().toISOString().split('T')[0]}.json`;
            this.recipeSaver.downloadFile(jsonData, filename);
        }
    }

    // Handle file import
    handleImportFile(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const result = this.recipeSaver.importRecipes(e.target.result);
            if (result.success) {
                this.showMessage(`Successfully imported ${result.imported} recipes!`, 'success');
                // Refresh the saved recipes display
                this.showSavedRecipes();
            } else {
                this.showError(`Import failed: ${result.error}`);
            }
        };
        reader.readAsText(file);
    }

    // Delete recipe
    deleteRecipe(recipeId) {
        if (confirm('Are you sure you want to delete this recipe?')) {
            this.recipeSaver.deleteRecipe(recipeId);
            this.showMessage('Recipe deleted successfully!', 'success');
            this.showSavedRecipes(); // Refresh display
        }
    }

    // Delete meal plan
    deleteMealPlan(planId) {
        if (confirm('Are you sure you want to delete this meal plan?')) {
            this.recipeSaver.deleteMealPlan(planId);
            this.showMessage('Meal plan deleted successfully!', 'success');
            this.showSavedRecipes(); // Refresh display
        }
    }

    // Load saved meal plan
    loadMealPlan(planId) {
        const savedMealPlans = this.recipeSaver.getSavedMealPlans();
        const mealPlan = savedMealPlans.find(p => p.id === planId);
        
        if (mealPlan) {
            this.currentMealPlan = mealPlan.meals;
            this.currentShoppingList = mealPlan.shoppingList;
            this.userParams = mealPlan.parameters;
            
            this.displayResults();
            this.showSection('results');
            
            // Close modal
            document.getElementById('saved-recipes-modal').remove();
            
            this.showMessage(`Loaded meal plan: ${mealPlan.name}`, 'success');
        }
    }

    // Toggle shopping item checkbox
    toggleShoppingItem(itemId, checkbox) {
        const checked = checkbox.checked;
        const item = checkbox.closest('.checkbox-item');
        
        if (checked) {
            item.classList.add('checked');
        } else {
            item.classList.remove('checked');
        }
        
        // Save state to localStorage
        this.saveItemCheckedState(itemId, checked);
    }

    // Get checkbox state for item
    getItemCheckedState(itemId) {
        const checkedItems = JSON.parse(localStorage.getItem('shoppingList_checkedItems') || '{}');
        return checkedItems[itemId] || false;
    }

    // Save checkbox state for item
    saveItemCheckedState(itemId, checked) {
        const checkedItems = JSON.parse(localStorage.getItem('shoppingList_checkedItems') || '{}');
        if (checked) {
            checkedItems[itemId] = true;
        } else {
            delete checkedItems[itemId];
        }
        localStorage.setItem('shoppingList_checkedItems', JSON.stringify(checkedItems));
    }

    // Save shopping list as a separate entity
    saveShoppingList() {
        if (!this.currentShoppingList) {
            this.showError('No shopping list to save. Please generate a meal plan first.');
            return;
        }

        const listName = prompt('Enter a name for this shopping list:', `Shopping List - ${new Date().toLocaleDateString()}`);
        if (listName === null) return; // User cancelled

        try {
            const savedLists = JSON.parse(localStorage.getItem('familyBudgetMeals_savedShoppingLists') || '[]');
            
            const shoppingListToSave = {
                id: this.generateId(),
                name: listName,
                items: this.shoppingListGenerator.formatForDisplay(this.currentShoppingList).items,
                totalCost: this.currentShoppingList.totals.totalCost,
                zipCode: this.userParams.zipCode,
                savedDate: new Date().toISOString(),
                checkedItems: JSON.parse(localStorage.getItem('shoppingList_checkedItems') || '{}')
            };

            savedLists.push(shoppingListToSave);
            localStorage.setItem('familyBudgetMeals_savedShoppingLists', JSON.stringify(savedLists));
            
            this.showMessage(`Shopping list "${listName}" saved successfully!`, 'success');
        } catch (error) {
            console.error('Error saving shopping list:', error);
            this.showError('Failed to save shopping list. Please try again.');
        }
    }

    // Generate unique ID helper
    generateId() {
        return 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Show full recipe with all details
    showFullRecipe(recipeId, mealIndex) {
        const meal = this.currentMealPlan[mealIndex];
        if (!meal) return;

        const modal = this.createModal('full-recipe-modal', meal.name);
        const modalContent = modal.querySelector('.modal-body');
        
        modalContent.innerHTML = `
            <div class="full-recipe-content">
                <div class="recipe-overview">
                    <div class="recipe-meta-full">
                        <div class="meta-item">
                            <i class="fas fa-users"></i>
                            <span><strong>Serves:</strong> ${meal.scaledServings || meal.servings} people</span>
                        </div>
                        <div class="meta-item">
                            <i class="fas fa-clock"></i>
                            <span><strong>Total Time:</strong> ${meal.prepTime + meal.cookTime} minutes</span>
                        </div>
                        <div class="meta-item">
                            <i class="fas fa-utensils"></i>
                            <span><strong>Prep:</strong> ${meal.prepTime}min | <strong>Cook:</strong> ${meal.cookTime}min</span>
                        </div>
                        <div class="meta-item">
                            <i class="fas fa-signal"></i>
                            <span><strong>Difficulty:</strong> ${meal.difficulty}</span>
                        </div>
                        <div class="meta-item">
                            <i class="fas fa-dollar-sign"></i>
                            <span><strong>Cost:</strong> $${meal.pricing.totalCost.toFixed(2)} ($${meal.pricing.costPerServing.toFixed(2)} per serving)</span>
                        </div>
                    </div>
                    
                    <div class="recipe-description">
                        <p>${meal.description}</p>
                    </div>
                </div>

                <div class="recipe-sections">
                    <div class="ingredients-section">
                        <h4><i class="fas fa-shopping-cart"></i> Complete Ingredients List</h4>
                        <ul class="full-ingredients-list">
                            ${meal.ingredients.map(ing => `
                                <li class="ingredient-item">
                                    <span class="ingredient-amount">${ing.storeUnit || `${ing.amount} ${ing.unit}`}</span>
                                    <span class="ingredient-name">${ing.name}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>

                    <div class="instructions-section">
                        <h4><i class="fas fa-list-ol"></i> Cooking Instructions</h4>
                        <ol class="instructions-list">
                            ${meal.instructions.map(instruction => `
                                <li class="instruction-step">${instruction}</li>
                            `).join('')}
                        </ol>
                    </div>

                    ${meal.tags && meal.tags.length > 0 ? `
                        <div class="recipe-tags">
                            <h4><i class="fas fa-tags"></i> Tags</h4>
                            <div class="tags-list">
                                ${meal.tags.map(tag => `<span class="recipe-tag">${tag}</span>`).join('')}
                            </div>
                        </div>
                    ` : ''}

                    ${meal.nutrition ? `
                        <div class="nutrition-info">
                            <h4><i class="fas fa-apple-alt"></i> Nutrition (per serving)</h4>
                            <div class="nutrition-grid">
                                <span class="nutrition-item"><strong>Calories:</strong> ${meal.nutrition.calories}</span>
                                <span class="nutrition-item"><strong>Protein:</strong> ${meal.nutrition.protein}g</span>
                                <span class="nutrition-item"><strong>Carbs:</strong> ${meal.nutrition.carbs}g</span>
                                <span class="nutrition-item"><strong>Fat:</strong> ${meal.nutrition.fat}g</span>
                            </div>
                        </div>
                    ` : ''}
                </div>

                <div class="recipe-actions-full">
                    <button class="btn btn-primary" onclick="app.saveIndividualRecipe('${meal.id}', ${mealIndex}); document.getElementById('full-recipe-modal').remove();">
                        <i class="fas fa-heart"></i> Save This Recipe
                    </button>
                    <button class="btn btn-secondary" onclick="app.printRecipe('${meal.id}', ${mealIndex})">
                        <i class="fas fa-print"></i> Print Recipe
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    // Print recipe function
    printRecipe(recipeId, mealIndex) {
        const meal = this.currentMealPlan[mealIndex];
        if (!meal) return;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${meal.name} - Recipe</title>
                <style>
                    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                    .recipe-header { border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 20px; }
                    .recipe-meta { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin: 15px 0; }
                    .ingredients-section, .instructions-section { margin: 20px 0; }
                    .ingredients-section h3, .instructions-section h3 { color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
                    .ingredients-list { list-style: none; padding: 0; }
                    .ingredients-list li { padding: 5px 0; border-bottom: 1px dotted #ccc; }
                    .instructions-list li { margin: 10px 0; line-height: 1.6; }
                    @media print { body { font-size: 14px; } }
                </style>
            </head>
            <body>
                <div class="recipe-header">
                    <h1>${meal.name}</h1>
                    <p>${meal.description}</p>
                </div>
                
                <div class="recipe-meta">
                    <div><strong>Serves:</strong> ${meal.scaledServings || meal.servings} people</div>
                    <div><strong>Total Time:</strong> ${meal.prepTime + meal.cookTime} minutes</div>
                    <div><strong>Prep Time:</strong> ${meal.prepTime} minutes</div>
                    <div><strong>Cook Time:</strong> ${meal.cookTime} minutes</div>
                    <div><strong>Difficulty:</strong> ${meal.difficulty}</div>
                    <div><strong>Cost:</strong> $${meal.pricing.totalCost.toFixed(2)} ($${meal.pricing.costPerServing.toFixed(2)} per serving)</div>
                </div>

                <div class="ingredients-section">
                    <h3>Ingredients</h3>
                    <ul class="ingredients-list">
                        ${meal.ingredients.map(ing => `
                            <li>${ing.storeUnit || `${ing.amount} ${ing.unit}`} ${ing.name}</li>
                        `).join('')}
                    </ul>
                </div>

                <div class="instructions-section">
                    <h3>Instructions</h3>
                    <ol class="instructions-list">
                        ${meal.instructions.map(instruction => `<li>${instruction}</li>`).join('')}
                    </ol>
                </div>

                <p style="margin-top: 30px; font-size: 12px; color: #666;">
                    Generated by Family Budget Meals on ${new Date().toLocaleDateString()}
                </p>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    }

    // Save all recipes to PDF
    saveAllRecipesToPDF() {
        if (!this.currentMealPlan || this.currentMealPlan.length === 0) {
            this.showError('No meal plan to save. Please generate a meal plan first.');
            return;
        }

        const printWindow = window.open('', '_blank');
        const totalCost = this.currentShoppingList.totals.totalCost;
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Family Budget Meals - Recipe Collection</title>
                <style>
                    body { 
                        font-family: 'Georgia', serif; 
                        max-width: 800px; 
                        margin: 0 auto; 
                        padding: 30px 20px;
                        line-height: 1.6;
                        color: #333;
                    }
                    .cover-page { 
                        text-align: center; 
                        padding: 60px 0; 
                        border-bottom: 3px solid #667eea;
                        margin-bottom: 40px;
                    }
                    .cover-title { 
                        font-size: 2.5em; 
                        color: #667eea; 
                        margin-bottom: 20px;
                        font-weight: bold;
                    }
                    .cover-subtitle { 
                        font-size: 1.3em; 
                        color: #666; 
                        margin-bottom: 30px;
                    }
                    .meal-plan-summary {
                        background: #f8f9fa;
                        padding: 20px;
                        border-radius: 10px;
                        margin: 30px 0;
                        border-left: 5px solid #667eea;
                    }
                    .recipe-page { 
                        page-break-before: always; 
                        margin-bottom: 40px;
                        padding: 20px 0;
                    }
                    .recipe-header { 
                        border-bottom: 3px solid #667eea; 
                        padding-bottom: 20px; 
                        margin-bottom: 30px; 
                    }
                    .recipe-title {
                        font-size: 2em;
                        color: #667eea;
                        margin-bottom: 10px;
                    }
                    .recipe-description {
                        font-style: italic;
                        color: #666;
                        font-size: 1.1em;
                    }
                    .recipe-meta { 
                        display: grid; 
                        grid-template-columns: repeat(3, 1fr); 
                        gap: 15px; 
                        margin: 25px 0;
                        background: #f8f9fa;
                        padding: 20px;
                        border-radius: 8px;
                    }
                    .meta-item {
                        text-align: center;
                        padding: 10px;
                    }
                    .meta-label {
                        font-weight: bold;
                        color: #667eea;
                        display: block;
                        margin-bottom: 5px;
                    }
                    .ingredients-section, .instructions-section { 
                        margin: 30px 0; 
                    }
                    .section-title { 
                        color: #667eea; 
                        border-bottom: 2px solid #e9ecef; 
                        padding-bottom: 10px;
                        font-size: 1.3em;
                        margin-bottom: 20px;
                    }
                    .ingredients-list { 
                        list-style: none; 
                        padding: 0; 
                        background: #f8f9fa;
                        border-radius: 8px;
                        padding: 20px;
                    }
                    .ingredients-list li { 
                        padding: 8px 0; 
                        border-bottom: 1px dotted #ccc;
                        display: flex;
                        justify-content: space-between;
                    }
                    .ingredients-list li:last-child {
                        border-bottom: none;
                    }
                    .ingredient-name {
                        flex: 1;
                    }
                    .ingredient-amount {
                        font-weight: bold;
                        color: #28a745;
                        min-width: 150px;
                        text-align: right;
                    }
                    .instructions-list { 
                        counter-reset: step-counter;
                        list-style: none;
                        padding: 0;
                    }
                    .instructions-list li { 
                        counter-increment: step-counter;
                        margin: 20px 0; 
                        padding: 15px;
                        background: #f8f9fa;
                        border-radius: 8px;
                        border-left: 4px solid #667eea;
                        position: relative;
                        padding-left: 60px;
                    }
                    .instructions-list li::before {
                        content: counter(step-counter);
                        position: absolute;
                        left: 15px;
                        top: 15px;
                        background: #667eea;
                        color: white;
                        width: 30px;
                        height: 30px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: bold;
                        font-size: 14px;
                    }
                    .shopping-list-page {
                        page-break-before: always;
                        padding: 20px 0;
                    }
                    .shopping-list {
                        background: #f8f9fa;
                        padding: 20px;
                        border-radius: 10px;
                        margin: 20px 0;
                    }
                    .shopping-item {
                        display: flex;
                        justify-content: space-between;
                        padding: 10px 0;
                        border-bottom: 1px solid #ddd;
                    }
                    .shopping-item:before {
                        content: "☐ ";
                        margin-right: 10px;
                        font-size: 1.2em;
                    }
                    .footer { 
                        text-align: center; 
                        margin-top: 40px; 
                        font-size: 12px; 
                        color: #999;
                        border-top: 1px solid #eee;
                        padding-top: 20px;
                    }
                    @media print { 
                        body { font-size: 12px; }
                        .recipe-page { page-break-before: always; }
                        .shopping-list-page { page-break-before: always; }
                    }
                </style>
            </head>
            <body>
                <!-- Cover Page -->
                <div class="cover-page">
                    <h1 class="cover-title">Family Budget Meals</h1>
                    <p class="cover-subtitle">Your Complete Recipe Collection</p>
                    <div class="meal-plan-summary">
                        <h3>Meal Plan Summary</h3>
                        <p><strong>Total Recipes:</strong> ${this.currentMealPlan.length}</p>
                        <p><strong>Total Cost:</strong> $${totalCost.toFixed(2)}</p>
                        <p><strong>Average Cost per Meal:</strong> $${(totalCost / this.currentMealPlan.length).toFixed(2)}</p>
                        <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
                    </div>
                </div>

                <!-- Shopping List -->
                <div class="shopping-list-page">
                    <h2 class="section-title">🛒 Complete Shopping List</h2>
                    <div class="shopping-list">
                        ${this.shoppingListGenerator.formatForDisplay(this.currentShoppingList).items.map(item => `
                            <div class="shopping-item">
                                <span>${item.name}</span>
                                <span><strong>$${item.price.toFixed(2)}</strong></span>
                            </div>
                        `).join('')}
                        <div class="shopping-item" style="border-top: 2px solid #667eea; margin-top: 20px; padding-top: 15px;">
                            <span><strong>TOTAL COST:</strong></span>
                            <span><strong>$${totalCost.toFixed(2)}</strong></span>
                        </div>
                    </div>
                </div>

                <!-- Individual Recipes -->
                ${this.currentMealPlan.map((meal, index) => `
                    <div class="recipe-page">
                        <div class="recipe-header">
                            <h1 class="recipe-title">${meal.name}</h1>
                            <p class="recipe-description">${meal.description}</p>
                        </div>
                        
                        <div class="recipe-meta">
                            <div class="meta-item">
                                <span class="meta-label">Serves</span>
                                <span>${meal.scaledServings || meal.servings} people</span>
                            </div>
                            <div class="meta-item">
                                <span class="meta-label">Total Time</span>
                                <span>${meal.prepTime + meal.cookTime} minutes</span>
                            </div>
                            <div class="meta-item">
                                <span class="meta-label">Difficulty</span>
                                <span>${meal.difficulty}</span>
                            </div>
                            <div class="meta-item">
                                <span class="meta-label">Prep Time</span>
                                <span>${meal.prepTime} minutes</span>
                            </div>
                            <div class="meta-item">
                                <span class="meta-label">Cook Time</span>
                                <span>${meal.cookTime} minutes</span>
                            </div>
                            <div class="meta-item">
                                <span class="meta-label">Cost</span>
                                <span>$${meal.pricing.totalCost.toFixed(2)}</span>
                            </div>
                        </div>

                        <div class="ingredients-section">
                            <h3 class="section-title">🛒 Ingredients</h3>
                            <ul class="ingredients-list">
                                ${meal.ingredients.map(ing => `
                                    <li>
                                        <span class="ingredient-name">${ing.name}</span>
                                        <span class="ingredient-amount">${ing.storeUnit || `${ing.amount} ${ing.unit}`}</span>
                                    </li>
                                `).join('')}
                            </ul>
                        </div>

                        <div class="instructions-section">
                            <h3 class="section-title">👨‍🍳 Instructions</h3>
                            <ol class="instructions-list">
                                ${meal.instructions.map(instruction => `<li>${instruction}</li>`).join('')}
                            </ol>
                        </div>
                    </div>
                `).join('')}

                <div class="footer">
                    <p><strong>Family Budget Meals</strong> - Smart meal planning within your budget</p>
                    <p>Generated on ${new Date().toLocaleDateString()} | familybudgetmeals.com (coming soon!)</p>
                </div>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();
        
        // Small delay to ensure content loads before printing
        setTimeout(() => {
            printWindow.print();
        }, 500);
        
        this.showMessage('Recipe collection opened in new window. Use your browser\'s print function and "Save as PDF" to create a PDF file.', 'success');
    }

    // Utility function for delays
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export for external initialization
if (typeof window !== 'undefined') {
    window.FamilyBudgetMealsApp = FamilyBudgetMealsApp;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FamilyBudgetMealsApp };
}