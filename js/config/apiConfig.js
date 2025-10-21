// API Configuration
class APIConfig {
    constructor() {
        // Store API keys securely - in production these should be environment variables
        this.openaiApiKey = localStorage.getItem('openai_api_key') || '';
        this.walmartApiKey = localStorage.getItem('walmart_api_key') || '';
        
        // API endpoints
        this.openaiEndpoint = 'https://api.openai.com/v1/chat/completions';
        this.walmartEndpoint = 'https://walmart.io/api/catalog/items';
    }

    // Set API keys
    setOpenAIKey(key) {
        this.openaiApiKey = key;
        localStorage.setItem('openai_api_key', key);
    }

    setWalmartKey(key) {
        this.walmartApiKey = key;
        localStorage.setItem('walmart_api_key', key);
    }

    // Get API keys
    getOpenAIKey() {
        return this.openaiApiKey;
    }

    getWalmartKey() {
        return this.walmartApiKey;
    }

    // Check if keys are configured
    hasOpenAIKey() {
        return this.openaiApiKey && this.openaiApiKey.length > 0;
    }

    hasWalmartKey() {
        return this.walmartApiKey && this.walmartApiKey.length > 0;
    }

    // Validate API key format
    validateOpenAIKey(key) {
        return key && key.startsWith('sk-') && key.length > 40;
    }

    validateWalmartKey(key) {
        return key && key.length > 10; // Basic validation
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.APIConfig = APIConfig;
}