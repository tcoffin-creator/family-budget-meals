# Cloudflare Pages Deployment Guide

## 🚀 Quick Setup

### 1. Deploy to Cloudflare Pages

1. **Connect Repository**: Link your GitHub repo to Cloudflare Pages
2. **Build Settings**: 
   - Build command: `(leave empty)`
   - Build output directory: `/`
   - Root directory: `/`

### 2. Configure Environment Variables

Go to your Cloudflare Pages dashboard → Settings → Environment Variables and add:

#### Required:
- `OPENAI_API_KEY`: Your OpenAI API key (starts with `sk-`)

#### Optional (but recommended):
- None required! The system now uses AI-enhanced pricing and web scraping

### 3. API Endpoints

The app uses Cloudflare Pages Functions located in `/functions/`:

- `POST /functions/generate-recipes` - Generates AI recipes
- `POST /functions/get-pricing` - Gets real-time Walmart pricing

### 4. File Structure

```
family-budget-meals/
├── functions/                 # Cloudflare Pages Functions (Backend)
│   ├── generate-recipes.js   # OpenAI recipe generation
│   └── get-pricing.js        # Walmart pricing API
├── js/
│   ├── services/
│   │   └── secureAPIClient.js # Frontend API client
│   └── app.js                # Main application
├── index.html                # Frontend
└── .env.example              # Environment variables template
```

## 🔑 Getting API Keys

### OpenAI API Key (Required)
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create new API key
3. Copy the key (starts with `sk-`)

### Walmart API Key (Optional)
1. Go to [Walmart IO](https://walmart.io/)
2. Sign up for developer account
3. Get API key for Catalog API

## 🛡️ Security

- ✅ API keys are stored securely in Cloudflare environment variables
- ✅ No API keys exposed to frontend/browser
- ✅ CORS properly configured for your domain
- ✅ Functions handle errors gracefully with fallbacks

## 🎯 Features

- **AI Recipe Generation**: Uses OpenAI GPT-4 for unique, healthy recipes
- **Real-time Pricing**: Walmart API for accurate local pricing
- **Secure Backend**: No API keys in frontend code
- **Graceful Fallbacks**: Works with estimated pricing if APIs fail
- **Serverless**: Fully serverless architecture with Cloudflare

## 🔧 Local Development

For local testing:
1. Install Cloudflare Wrangler: `npm install -g wrangler`
2. Run locally: `wrangler pages dev .`
3. Set environment variables in `.dev.vars` file

## 📱 Production

Your app will be available at: `https://your-app-name.pages.dev`

The backend functions automatically handle:
- API authentication
- Error handling
- CORS headers
- Response formatting