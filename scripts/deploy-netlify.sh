#!/bin/bash

# Netlify Deployment Script with Fallback Methods
# This script tries multiple deployment methods to ensure successful deployment

# Don't exit on error - we handle errors manually for fallbacks
set +e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Log file
LOG_FILE="/tmp/netlify-deploy-$(date +%Y%m%d-%H%M%S).log"

echo -e "${GREEN}🚀 Starting Netlify Deployment with Fallback Methods...${NC}"
echo "📝 Full logs will be saved to: $LOG_FILE"
echo ""

# Function to log output
log() {
    echo "$1" | tee -a "$LOG_FILE"
}

# Function to try deployment method
try_deploy() {
    local method_name=$1
    local deploy_command=$2
    
    log ""
    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log "Trying Method: $method_name"
    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log ""
    
    if eval "$deploy_command" 2>&1 | tee -a "$LOG_FILE"; then
        log ""
        log "✅ SUCCESS with Method: $method_name"
        log "📋 Full deployment log: $LOG_FILE"
        return 0
    else
        log ""
        log "⚠️  Method $method_name failed, trying next method..."
        return 1
    fi
}

# Method 1: Standard deploy with increased timeout
log "Method 1: Standard deploy with timeout..."
if try_deploy "Standard Deploy (with timeout)" "npx netlify-cli deploy --prod --timeout=600"; then
    exit 0
fi

# Method 2: Deploy with plugin disabled
log ""
log "Method 2: Deploy without plugins..."
if try_deploy "Deploy without Plugins" "NETLIFY_USE_PLUGINS=false npx netlify-cli deploy --prod --timeout=600"; then
    exit 0
fi

# Method 3: Build locally then deploy from .next folder
log ""
log "Method 3: Build locally then deploy..."
log "Building project locally..."
if npm run build 2>&1 | tee -a "$LOG_FILE"; then
    log "✅ Build completed successfully"
    if try_deploy "Direct Deploy from .next" "npx netlify-cli deploy --dir=.next --prod --functions=netlify/functions --timeout=600"; then
        exit 0
    fi
else
    log "❌ Local build failed, skipping Method 3"
fi

# Method 4: Deploy with verbose logging (last resort)
log ""
log "Method 4: Deploy with verbose logging..."
if try_deploy "Verbose Deploy" "npx netlify-cli deploy --prod --timeout=600 --debug 2>&1"; then
    exit 0
fi

# All methods failed
log ""
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log -e "${RED}❌ All deployment methods failed${NC}"
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log ""
log "📋 Check the full log file: $LOG_FILE"
log ""
log "💡 Alternative options:"
log "   1. Check Netlify dashboard: https://app.netlify.com/projects/carehavenapp"
log "   2. Try manual deployment via Netlify dashboard"
log "   3. Check network connectivity and Netlify API status"
log "   4. Verify authentication: npx netlify-cli status"
log ""
log "🔍 Last 50 lines of log:"
tail -50 "$LOG_FILE"
log ""

exit 1
