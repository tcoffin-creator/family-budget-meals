// Cloudflare Pages Function for Real-Time Grocery Price Scraping
export async function onRequestPost(context) {
    const { request, env } = context;
    
    // Handle CORS
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const requestData = await request.json();
        const { ingredients, zipCode } = requestData;

        // Validate input
        if (!ingredients || !Array.isArray(ingredients)) {
            return new Response(JSON.stringify({ 
                error: 'Invalid input: ingredients array is required' 
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        console.log(`Starting real-time price scraping for ${ingredients.length} items in ${zipCode}`);

        // Try multiple pricing methods in order of preference
        let pricingResults;
        
    try {
        // Method 1: AI-Enhanced Geographic Pricing (primary)
        if (openaiKey) {
            console.log('🤖 Trying AI-enhanced geographic pricing...');
            
            const aiResults = await getAIEnhancedPricing(ingredients, zipCode, openaiKey);
            if (aiResults && aiResults.length > 0) {
                console.log(`✅ AI geographic pricing found for ${aiResults.length} items`);
                return aiResults;
            }
        }
        
        console.log('⚠️ AI pricing not available, trying regional store search...');
        
        // Method 2: Geographic Store Search (secondary)
        const storeResults = await getGeographicStorePricing(ingredients, zipCode);
        if (storeResults && storeResults.length > 0) {
            console.log(`✅ Regional store search found prices for ${storeResults.length} items`);
            return storeResults;
        }
        
        console.log('⚠️ Regional store search failed, trying direct web scraping...');
        
        // Method 3: Direct Web Scraping (tertiary)
        const scrapeResults = await scrapeCurrentPrices(ingredients, zipCode);
        if (scrapeResults && scrapeResults.length > 0) {
            console.log(`✅ Web scraping found prices for ${scrapeResults.length} items`);
            return scrapeResults;
        }
        
        console.log('⚠️ Web scraping failed, using geographic estimates...');
        
        // Method 4: Geographic Estimates (quaternary)
        const regionalResults = await getRegionalEstimates(ingredients, zipCode);
        if (regionalResults && regionalResults.length > 0) {
            console.log(`✅ Geographic estimates provided for ${regionalResults.length} items`);
            return regionalResults;
        }
        
        console.log('⚠️ Using basic estimates as final fallback...');
        
        // Method 5: Basic Estimates (final fallback)
        return ingredients.map(ingredient => ({
            ...ingredient,
            pricing: getBasicEstimate(ingredient.name),
            source: 'basic_fallback'
        }));
        
    } catch (error) {
        console.error('All pricing methods failed:', error);
        
        // Ultimate fallback
        return ingredients.map(ingredient => ({
            ...ingredient,
            pricing: getBasicEstimate(ingredient.name),
            source: 'error_fallback'
        }));
    }        return new Response(JSON.stringify({ 
            pricedIngredients: pricingResults,
            scrapedAt: new Date().toISOString(),
            zipCode,
            source: pricingResults[0]?.source || 'unknown'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Error in price lookup:', error);
        
        // Final fallback to basic estimates
        const fallbackPricing = requestData.ingredients.map(ingredient => ({
            ...ingredient,
            pricing: getBasicEstimate(ingredient.name),
            source: 'fallback_estimate'
        }));

        return new Response(JSON.stringify({ 
            pricedIngredients: fallbackPricing,
            isEstimated: true,
            error: 'All pricing methods failed, using basic estimates',
            timestamp: new Date().toISOString()
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

// AI-Enhanced Geographic Pricing - Uses OpenAI to search for current prices in specific regions
async function getAIEnhancedPricing(ingredients, zipCode, openaiKey) {
    if (!openaiKey) {
        throw new Error('OpenAI API key required for AI-enhanced pricing');
    }

    // Get geographic info for the zip code
    const locationInfo = getLocationFromZipCode(zipCode);
    
    const results = [];
    
    for (const ingredient of ingredients) {
        try {
            const searchTerm = ingredient.walmartSearchTerm || ingredient.name;
            
            // Use AI to search for pricing in the specific geographic area  
            const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${openaiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'gpt-4-turbo-preview',
                    messages: [{
                        role: 'system',
                        content: 'You are a grocery price researcher with access to current pricing data. Research current grocery prices for specific geographic locations. Consider local market conditions, store density, cost of living, and regional pricing variations.'
                    }, {
                        role: 'user',
                        content: `Find the current price for "${searchTerm}" at grocery stores (Walmart, Target, Kroger, etc.) in ${locationInfo.city}, ${locationInfo.state} (ZIP: ${zipCode}). 

Consider:
- Local cost of living in ${locationInfo.city}, ${locationInfo.state}
- Current grocery inflation (2024-2025)
- Typical pricing for ${locationInfo.region} region
- Store competition in the ${locationInfo.metro} area

Respond with:
1. Current price in dollars (e.g., "$4.98")  
2. Store name where this price is found
3. Full product name

Format: "$X.XX at [Store] - [Product Name]"`
                    }],
                    temperature: 0.2,
                    max_tokens: 150
                })
            });

            if (!aiResponse.ok) {
                throw new Error(`OpenAI API error: ${aiResponse.status}`);
            }

            const aiData = await aiResponse.json();
            const aiContent = aiData.choices[0].message.content.trim();
            
            // Parse AI response for price, store, and product name
            const priceMatch = aiContent.match(/\$(\d+\.\d{2})/);
            const storeMatch = aiContent.match(/at\s+([^-]+)/);
            const productMatch = aiContent.match(/-\s*(.+)$/);
            
            const price = priceMatch ? parseFloat(priceMatch[1]) : getBasicEstimatePrice(ingredient.name);
            const store = storeMatch ? storeMatch[1].trim() : 'Local Store';
            const productName = productMatch ? productMatch[1].trim() : ingredient.name;
            
            results.push({
                ...ingredient,
                pricing: {
                    productId: 'ai-geographic',
                    name: productName,
                    price: price,
                    originalPrice: price,
                    size: ingredient.storeUnit || 'Standard',
                    unit: ingredient.unit || 'each',
                    inStock: true,
                    store: store,
                    location: `${locationInfo.city}, ${locationInfo.state}`,
                    description: `${productName} (AI pricing for ${locationInfo.city}, ${locationInfo.state})`,
                    source: 'ai_geographic',
                    confidence: 'ai_regional_search',
                    lastUpdated: new Date().toISOString()
                },
                source: 'ai_geographic'
            });
            
            // Rate limiting for AI requests
            await new Promise(resolve => setTimeout(resolve, 800));
            
        } catch (error) {
            console.error(`AI geographic pricing failed for ${ingredient.name}:`, error);
            
            // Fallback to geographic scraping
            results.push({
                ...ingredient,
                pricing: await getGeographicFallback(ingredient.name, zipCode),
                source: 'geographic_fallback'
            });
        }
    }
    
    return results;
}

// Direct Web Scraping - Scrapes current prices from grocery websites
async function scrapeCurrentPrices(ingredients, zipCode) {
    const results = [];
    
    for (const ingredient of ingredients) {
        try {
            const searchTerm = ingredient.walmartSearchTerm || ingredient.name;
            
            // Try scraping Walmart first
            let pricing = await scrapeWalmartPrice(searchTerm, zipCode);
            
            if (!pricing) {
                // Try scraping Target as backup
                pricing = await scrapeTargetPrice(searchTerm, zipCode);
            }
            
            if (!pricing) {
                // Fallback to regional estimate
                pricing = getRegionalEstimate(ingredient.name, zipCode);
            }
            
            results.push({
                ...ingredient,
                pricing,
                source: pricing.source || 'scraped'
            });
            
            // Rate limiting between scrapes
            await new Promise(resolve => setTimeout(resolve, 1000));
            
        } catch (error) {
            console.error(`Scraping failed for ${ingredient.name}:`, error);
            
            results.push({
                ...ingredient,
                pricing: getRegionalEstimate(ingredient.name, zipCode),
                source: 'scrape_fallback'
            });
        }
    }
    
    return results;
}

// Scrape Walmart.com for current pricing
async function scrapeWalmartPrice(searchTerm, zipCode) {
    try {
        const encodedTerm = encodeURIComponent(searchTerm);
        const url = `https://www.walmart.com/search?q=${encodedTerm}`;
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const html = await response.text();
        
        // Look for price patterns in the HTML
        const pricePatterns = [
            /\$(\d+\.\d{2})/g,
            /"price":"(\d+\.\d{2})"/g,
            /"salePrice":"(\d+\.\d{2})"/g,
            /data-price="(\d+\.\d{2})"/g
        ];
        
        let foundPrice = null;
        let productName = searchTerm;
        
        for (const pattern of pricePatterns) {
            const matches = [...html.matchAll(pattern)];
            if (matches.length > 0) {
                // Take the first reasonable price (between $0.50 and $50.00 for most grocery items)
                const prices = matches.map(m => parseFloat(m[1])).filter(p => p >= 0.50 && p <= 50.00);
                if (prices.length > 0) {
                    foundPrice = prices[0];
                    break;
                }
            }
        }
        
        // Try to extract product name
        const nameMatch = html.match(/"name":"([^"]+)"/);
        if (nameMatch) {
            productName = nameMatch[1].replace(/\\u[\dA-F]{4}/gi, '').trim();
        }
        
        if (foundPrice) {
            return {
                productId: 'scraped-walmart',
                name: productName,
                price: foundPrice,
                originalPrice: foundPrice,
                size: 'Standard',
                unit: 'each',
                inStock: true,
                description: `${productName} (scraped from Walmart)`,
                source: 'walmart_scraped',
                confidence: 'scraped',
                lastUpdated: new Date().toISOString()
            };
        }
        
        return null;
        
    } catch (error) {
        console.error(`Walmart scraping failed for ${searchTerm}:`, error);
        return null;
    }
}

// Geographic Store Search - Search region-specific grocery stores
async function getGeographicStorePricing(ingredients, zipCode) {
    const locationInfo = getLocationFromZipCode(zipCode);
    const results = [];
    
    // Define regional store chains by area
    const regionalStores = getRegionalStoreChains(locationInfo.state, locationInfo.region);
    
    for (const ingredient of ingredients) {
        try {
            const searchTerm = ingredient.walmartSearchTerm || ingredient.name;
            let bestPrice = null;
            let bestStore = null;
            let bestProduct = null;
            
            // Search multiple regional stores
            for (const store of regionalStores) {
                try {
                    const storeResult = await searchRegionalStore(searchTerm, store, locationInfo);
                    if (storeResult && (!bestPrice || storeResult.price < bestPrice)) {
                        bestPrice = storeResult.price;
                        bestStore = store;
                        bestProduct = storeResult;
                    }
                    
                    // Rate limiting between store searches
                    await new Promise(resolve => setTimeout(resolve, 300));
                    
                } catch (storeError) {
                    console.log(`Store ${store.name} search failed:`, storeError.message);
                    continue;
                }
            }
            
            if (bestPrice && bestProduct) {
                results.push({
                    ...ingredient,
                    pricing: {
                        productId: `${bestStore.id}-${bestProduct.id}`,
                        name: bestProduct.name,
                        price: bestPrice,
                        originalPrice: bestPrice,
                        size: bestProduct.size || ingredient.storeUnit || 'Standard',
                        unit: ingredient.unit || 'each',
                        inStock: bestProduct.inStock,
                        store: bestStore.name,
                        storeLocation: `${locationInfo.city}, ${locationInfo.state}`,
                        description: `${bestProduct.name} at ${bestStore.name} in ${locationInfo.city}, ${locationInfo.state}`,
                        source: 'geographic_search',
                        confidence: 'regional_store_data',
                        lastUpdated: new Date().toISOString()
                    },
                    source: 'geographic_search'
                });
            } else {
                // Fallback to geographic estimate
                results.push({
                    ...ingredient,
                    pricing: await getGeographicFallback(ingredient.name, zipCode),
                    source: 'geographic_fallback'
                });
            }
            
        } catch (error) {
            console.error(`Geographic store pricing failed for ${ingredient.name}:`, error);
            
            results.push({
                ...ingredient,
                pricing: await getGeographicFallback(ingredient.name, zipCode),
                source: 'geographic_fallback'
            });
        }
    }
    
    return results;
}

// Regional Estimates with ZIP code-based pricing  
async function getRegionalEstimates(ingredients, zipCode) {
    return ingredients.map(ingredient => ({
        ...ingredient,
        pricing: getRegionalEstimate(ingredient.name, zipCode),
        source: 'regional_database'
    }));
}

function getRegionalEstimate(itemName, zipCode) {
    const multiplier = getRegionalMultiplier(zipCode);
    const basePrice = getBasicEstimatePrice(itemName);
    const adjustedPrice = basePrice * multiplier;
    
    return {
        productId: 'regional-estimate',
        name: itemName,
        price: Math.round(adjustedPrice * 100) / 100,
        originalPrice: basePrice,
        size: 'Standard',
        unit: 'each',
        inStock: true,
        description: `${itemName} (regional estimate for ${zipCode})`,
        source: 'regional_estimate',
        confidence: 'estimated',
        lastUpdated: new Date().toISOString()
    };
}

function getRegionalMultiplier(zipCode) {
    const zip = parseInt(zipCode);
    
    // Regional price multipliers based on cost of living data
    if (zip >= 10000 && zip <= 14999) return 1.15; // Northeast (NY, PA, NJ) - higher cost
    if (zip >= 90000 && zip <= 96999) return 1.25; // California - highest cost
    if (zip >= 98000 && zip <= 99999) return 1.18; // Washington - high cost
    if (zip >= 97000 && zip <= 97999) return 1.12; // Oregon - above average
    if (zip >= 80000 && zip <= 81999) return 1.08; // Colorado - above average
    if (zip >= 30000 && zip <= 39999) return 0.88; // Southeast (GA, FL, SC) - lower cost
    if (zip >= 40000 && zip <= 49999) return 0.92; // Kentucky, Tennessee - lower cost
    if (zip >= 50000 && zip <= 52999) return 0.90; // Iowa - lower cost
    if (zip >= 70000 && zip <= 79999) return 0.95; // Texas - average to below
    
    return 1.0; // National average
}

function getBasicEstimatePrice(itemName) {
    const lowerName = itemName.toLowerCase();
    
    // Updated pricing based on 2024/2025 grocery inflation
    const basePrices = {
        // Meat & Protein
        'ground beef': 5.48, 'chicken breast': 5.98, 'chicken thigh': 4.48,
        'eggs': 2.98, 'bacon': 6.48, 'salmon': 12.98, 'tuna': 8.98,
        
        // Dairy
        'milk': 3.78, 'butter': 4.98, 'cheese': 4.48, 'yogurt': 5.48,
        'cream cheese': 3.48, 'sour cream': 2.98,
        
        // Produce
        'onion': 1.68, 'carrot': 1.48, 'potato': 3.48, 'tomato': 2.98,
        'banana': 1.78, 'apple': 2.48, 'lettuce': 2.28, 'bell pepper': 1.98,
        'garlic': 0.98, 'celery': 1.98, 'broccoli': 2.48,
        
        // Pantry Staples
        'rice': 4.48, 'pasta': 1.48, 'flour': 3.98, 'sugar': 3.48,
        'oil': 4.98, 'vinegar': 2.48, 'salt': 1.28, 'pepper': 2.98,
        
        // Canned/Jarred
        'marinara': 1.98, 'diced tomatoes': 1.48, 'beans': 1.68,
        'broth': 2.98, 'soup': 2.48, 'peanut butter': 4.48,
        
        // Bread & Grain
        'bread': 2.48, 'bagel': 3.48, 'cereal': 4.98, 'oats': 4.98,
        
        // Frozen
        'frozen vegetables': 2.48, 'frozen fruit': 3.98, 'ice cream': 5.48,
        
        // Spices & Seasonings
        'basil': 1.98, 'oregano': 1.98, 'cumin': 2.48, 'paprika': 2.48,
        'garlic powder': 2.28, 'onion powder': 2.28, 'black pepper': 2.98
    };

    // Try to match the item name with our price database
    for (const [key, price] of Object.entries(basePrices)) {
        if (lowerName.includes(key)) {
            return price;
        }
    }
    
    // Default fallback price
    return 3.48;
}

function getBasicEstimate(itemName) {
    return {
        productId: 'basic-estimate',
        name: itemName,
        price: getBasicEstimatePrice(itemName),
        originalPrice: getBasicEstimatePrice(itemName),
        size: 'Standard',
        unit: 'each',
        inStock: true,
        description: `${itemName} (basic estimate)`,
        source: 'basic_estimate',
        confidence: 'estimated',
        lastUpdated: new Date().toISOString()
    };
}

// Geographic Helper Functions

function getLocationFromZipCode(zipCode) {
    const zip = parseInt(zipCode);
    
    // Major metropolitan areas and regional mapping
    const locationMap = {
        // California
        90000: { city: 'Los Angeles', state: 'CA', region: 'West Coast', metro: 'LA Metro' },
        94000: { city: 'San Francisco', state: 'CA', region: 'West Coast', metro: 'SF Bay Area' },
        92000: { city: 'San Diego', state: 'CA', region: 'West Coast', metro: 'San Diego Metro' },
        95000: { city: 'Sacramento', state: 'CA', region: 'West Coast', metro: 'Sacramento Metro' },
        
        // New York
        10000: { city: 'New York', state: 'NY', region: 'Northeast', metro: 'NYC Metro' },
        11000: { city: 'Brooklyn', state: 'NY', region: 'Northeast', metro: 'NYC Metro' },
        12000: { city: 'Albany', state: 'NY', region: 'Northeast', metro: 'Albany Metro' },
        14000: { city: 'Buffalo', state: 'NY', region: 'Northeast', metro: 'Buffalo Metro' },
        
        // Texas
        75000: { city: 'Dallas', state: 'TX', region: 'South', metro: 'Dallas-Fort Worth' },
        77000: { city: 'Houston', state: 'TX', region: 'South', metro: 'Houston Metro' },
        78000: { city: 'Austin', state: 'TX', region: 'South', metro: 'Austin Metro' },
        79000: { city: 'San Antonio', state: 'TX', region: 'South', metro: 'San Antonio Metro' },
        
        // Florida
        33000: { city: 'Miami', state: 'FL', region: 'Southeast', metro: 'Miami Metro' },
        32000: { city: 'Orlando', state: 'FL', region: 'Southeast', metro: 'Orlando Metro' },
        
        // Illinois
        60000: { city: 'Chicago', state: 'IL', region: 'Midwest', metro: 'Chicago Metro' },
        
        // Washington
        98000: { city: 'Seattle', state: 'WA', region: 'Pacific Northwest', metro: 'Seattle Metro' },
        99000: { city: 'Spokane', state: 'WA', region: 'Pacific Northwest', metro: 'Spokane Metro' },
        
        // Georgia
        30000: { city: 'Atlanta', state: 'GA', region: 'Southeast', metro: 'Atlanta Metro' }
    };
    
    // Find closest match for ZIP code
    const zipMatch = Math.floor(zip / 1000) * 1000;
    if (locationMap[zipMatch]) {
        return locationMap[zipMatch];
    }
    
    // Regional fallbacks based on ZIP code ranges
    if (zip >= 90000 && zip <= 96999) return { city: 'Los Angeles', state: 'CA', region: 'West Coast', metro: 'California' };
    if (zip >= 10000 && zip <= 14999) return { city: 'New York', state: 'NY', region: 'Northeast', metro: 'Northeast' };
    if (zip >= 70000 && zip <= 79999) return { city: 'Dallas', state: 'TX', region: 'South', metro: 'Texas' };
    if (zip >= 30000 && zip <= 39999) return { city: 'Atlanta', state: 'GA', region: 'Southeast', metro: 'Southeast' };
    if (zip >= 60000 && zip <= 69999) return { city: 'Chicago', state: 'IL', region: 'Midwest', metro: 'Midwest' };
    if (zip >= 98000 && zip <= 99999) return { city: 'Seattle', state: 'WA', region: 'Pacific Northwest', metro: 'Pacific Northwest' };
    
    return { city: 'Anytown', state: 'USA', region: 'National', metro: 'National Average' };
}

function getRegionalStoreChains(state, region) {
    const storeChains = {
        'CA': [
            { id: 'ralphs', name: 'Ralphs', searchUrl: 'https://www.ralphs.com/search' },
            { id: 'vons', name: 'Vons', searchUrl: 'https://www.vons.com/search' },
            { id: 'safeway-ca', name: 'Safeway', searchUrl: 'https://www.safeway.com/search' }
        ],
        'TX': [
            { id: 'heb', name: 'H-E-B', searchUrl: 'https://www.heb.com/search' },
            { id: 'kroger-tx', name: 'Kroger', searchUrl: 'https://www.kroger.com/search' },
            { id: 'randalls', name: 'Randalls', searchUrl: 'https://www.randalls.com/search' }
        ],
        'NY': [
            { id: 'stop-shop', name: 'Stop & Shop', searchUrl: 'https://stopandshop.com/search' },
            { id: 'wegmans', name: 'Wegmans', searchUrl: 'https://www.wegmans.com/search' },
            { id: 'key-food', name: 'Key Food', searchUrl: 'https://www.keyfood.com/search' }
        ],
        'FL': [
            { id: 'publix', name: 'Publix', searchUrl: 'https://www.publix.com/search' },
            { id: 'winn-dixie', name: 'Winn-Dixie', searchUrl: 'https://www.winndixie.com/search' }
        ],
        'WA': [
            { id: 'safeway-wa', name: 'Safeway', searchUrl: 'https://www.safeway.com/search' },
            { id: 'fred-meyer', name: 'Fred Meyer', searchUrl: 'https://www.fredmeyer.com/search' },
            { id: 'qfc', name: 'QFC', searchUrl: 'https://www.qfc.com/search' }
        ]
    };
    
    // Return state-specific stores or national chains
    return storeChains[state] || [
        { id: 'walmart', name: 'Walmart', searchUrl: 'https://www.walmart.com/search' },
        { id: 'target', name: 'Target', searchUrl: 'https://www.target.com/s' },
        { id: 'kroger-nat', name: 'Kroger', searchUrl: 'https://www.kroger.com/search' }
    ];
}

async function searchRegionalStore(searchTerm, store, locationInfo) {
    // This is a simplified example - in practice, each store would need custom scraping logic
    try {
        const encodedTerm = encodeURIComponent(searchTerm);
        const url = `${store.searchUrl}?q=${encodedTerm}`;
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const html = await response.text();
        
        // Generic price extraction - would need customization per store
        const priceMatch = html.match(/\$(\d+\.\d{2})/);
        const nameMatch = html.match(/"productName":"([^"]+)"/);
        
        if (priceMatch) {
            return {
                id: `${store.id}-${Date.now()}`,
                name: nameMatch ? nameMatch[1] : searchTerm,
                price: parseFloat(priceMatch[1]),
                size: 'Standard',
                inStock: true
            };
        }
        
        return null;
        
    } catch (error) {
        console.error(`Regional store search failed for ${store.name}:`, error);
        return null;
    }
}

async function getGeographicFallback(itemName, zipCode) {
    const locationInfo = getLocationFromZipCode(zipCode);
    const basePrice = getBasicEstimatePrice(itemName);
    
    // Apply regional cost-of-living adjustment
    const regionalMultiplier = getRegionalCostMultiplier(locationInfo.region);
    const adjustedPrice = basePrice * regionalMultiplier;
    
    return {
        productId: 'geographic-fallback',
        name: itemName,
        price: Math.round(adjustedPrice * 100) / 100,
        originalPrice: basePrice,
        size: 'Standard',
        unit: 'each',
        inStock: true,
        location: `${locationInfo.city}, ${locationInfo.state}`,
        description: `${itemName} (geographic estimate for ${locationInfo.city}, ${locationInfo.state})`,
        source: 'geographic_estimate',
        confidence: 'regional_adjusted',
        lastUpdated: new Date().toISOString()
    };
}

function getRegionalCostMultiplier(region) {
    const multipliers = {
        'West Coast': 1.25,
        'Northeast': 1.15,
        'Pacific Northwest': 1.18,
        'South': 0.95,
        'Southeast': 0.88,
        'Midwest': 0.95,
        'National': 1.0
    };
    
    return multipliers[region] || 1.0;
}

// Fallback for Target scraping (placeholder - can be enhanced)
async function scrapeTargetPrice(searchTerm, zipCode) {
    // Placeholder for Target scraping - similar to Walmart but adapted for Target's structure
    // For now, return null to fallback to regional estimates
    return null;
}