# 🚀 Cloudflare Pages Setup Instructions

## What You Need to Do in Cloudflare

### Step 1: Create Cloudflare Pages Project

1. **Go to Cloudflare Dashboard**: https://dash.cloudflare.com/
2. **Navigate to Pages**: Click "Pages" in the left sidebar
3. **Connect to Git**: Click "Connect to Git"
4. **Select Repository**: Choose your `family-budget-meals` repository
5. **Configure Build**:
   - **Project name**: `family-budget-meals` (or whatever you prefer)
   - **Production branch**: `main`
   - **Build command**: Leave EMPTY
   - **Build output directory**: `/`
   - **Root directory**: `/`

### Step 2: Set Environment Variables

1. **Go to your Pages project** (after creation)
2. **Click Settings tab**
3. **Click Environment Variables**
4. **Add these variables**:

   **Production Variables:**
   - Variable name: `OPENAI_API_KEY`
   - Value: `sk-your-actual-openai-api-key-here`

   **Preview Variables (optional):**
   - Same as production if you want preview deploys to work

### Step 3: Get Your OpenAI API Key

1. **Go to OpenAI**: https://platform.openai.com/api-keys
2. **Create Account** (if you don't have one)
3. **Generate API Key**: Click "Create new secret key"
4. **Copy the key** (starts with `sk-`)
5. **Paste into Cloudflare** environment variables

### Step 4: Deploy

1. **Trigger Deploy**: Push code to your main branch or click "Retry deployment"
2. **Wait for Deploy**: Usually takes 1-2 minutes
3. **Test**: Your app will be available at `https://your-project-name.pages.dev`

## 🎯 What the System Does

### Real-Time Pricing Methods (in order of preference):

1. **AI-Enhanced Pricing**: Uses OpenAI to research current grocery prices
2. **Web Scraping**: Scrapes Walmart.com for live prices
3. **Regional Database**: Uses ZIP code-based pricing with regional adjustments
4. **Basic Estimates**: Fallback pricing if all else fails

### Features You Get:

✅ **AI Recipe Generation**: Unique healthy recipes every time
✅ **Live Pricing**: Real-time grocery prices when possible
✅ **Regional Accuracy**: Prices adjusted for your ZIP code
✅ **Multi-Store Data**: Checks multiple grocery websites
✅ **Graceful Fallbacks**: Always works, even if APIs fail
✅ **Smart Validation**: AI checks if scraped prices look reasonable

## 🔧 Testing Your Deployment

1. **Visit your site**: `https://your-project-name.pages.dev`
2. **Try generating a meal plan**:
   - Enter a ZIP code (try: 10001 for NYC, 90210 for LA)
   - Set family size and budget
   - Generate meal plan
3. **Check pricing sources**: Look at the shopping list footer to see what pricing methods were used

## 📊 Monitoring

### Check Function Logs:
1. Go to Cloudflare Pages → Your Project → Functions
2. View real-time logs to see pricing attempts
3. Look for these log messages:
   - "AI-enhanced pricing successful"
   - "Direct scraping successful" 
   - "Using regional estimates"

### Expected Behavior:
- **First time**: May take 10-15 seconds (cold start)
- **Subsequent uses**: 3-5 seconds
- **Pricing mix**: Usually 50% AI-enhanced, 30% scraped, 20% regional

## 🚨 Troubleshooting

### If recipes don't generate:
- Check OpenAI API key is correct
- Check you have API credits in OpenAI account

### If pricing seems off:
- Check Cloudflare Pages function logs
- Pricing will fall back to regional estimates if scraping fails

### If site doesn't load:
- Check Cloudflare Pages deployment status
- Ensure all files are committed to your repository

## 💡 Tips

1. **OpenAI Credits**: Start with $5-10 in OpenAI credits (should last months)
2. **Custom Domain**: Add your own domain in Cloudflare Pages settings
3. **Analytics**: Enable Cloudflare Web Analytics for usage insights
4. **Monitoring**: Set up alerts for function errors in Cloudflare dashboard

Your app will now provide real-time, AI-powered meal planning with live grocery pricing! 🎉