#!/bin/bash

# Netlify Deployment Diagnostic Script
# Based on 30 years of deployment battle scars
# This script performs comprehensive diagnostics for Netlify blob upload failures

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🔍 Netlify Deployment Diagnostic Tool${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Output file
DIAGNOSTIC_FILE="netlify-diagnostic-$(date +%Y%m%d-%H%M%S).txt"

log() {
    echo "$1" | tee -a "$DIAGNOSTIC_FILE"
}

log_section() {
    echo ""
    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log "$1"
    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
}

# 1. Network Layer Check
log_section "1. NETWORK LAYER CHECK"

log "Testing connectivity to Netlify's blob endpoints..."
if curl -v --max-time 10 https://api.netlify.com > /dev/null 2>&1; then
    log "${GREEN}✅ api.netlify.com is reachable${NC}"
else
    log "${RED}❌ api.netlify.com is NOT reachable${NC}"
fi

if curl -v --max-time 10 https://blob-storage.prod.netlify.com > /dev/null 2>&1; then
    log "${GREEN}✅ blob-storage.prod.netlify.com is reachable${NC}"
else
    log "${YELLOW}⚠️  blob-storage.prod.netlify.com may not be directly accessible (this is normal)${NC}"
fi

log ""
log "Checking DNS resolution..."
if command -v nslookup &> /dev/null; then
    log "api.netlify.com:"
    nslookup api.netlify.com 2>&1 | tee -a "$DIAGNOSTIC_FILE"
    log ""
    log "blob-storage.prod.netlify.com:"
    nslookup blob-storage.prod.netlify.com 2>&1 | tee -a "$DIAGNOSTIC_FILE"
fi

# 2. Firewall/Proxy Investigation
log_section "2. FIREWALL/PROXY INVESTIGATION"

if [ -n "$http_proxy" ] || [ -n "$https_proxy" ] || [ -n "$HTTP_PROXY" ] || [ -n "$HTTPS_PROXY" ]; then
    log "${YELLOW}⚠️  Proxy detected:${NC}"
    log "  http_proxy: ${http_proxy:-$HTTP_PROXY:-not set}"
    log "  https_proxy: ${https_proxy:-$HTTPS_PROXY:-not set}"
    log ""
    log "Testing direct connection (bypassing proxy)..."
    if curl --proxy "" --max-time 10 https://api.netlify.com > /dev/null 2>&1; then
        log "${GREEN}✅ Direct connection works${NC}"
    else
        log "${RED}❌ Direct connection failed${NC}"
    fi
else
    log "${GREEN}✅ No proxy detected${NC}"
fi

# 3. Build Artifact Analysis
log_section "3. BUILD ARTIFACT ANALYSIS"

if [ -d "./dist" ]; then
    DIST_SIZE=$(du -sh ./dist/ 2>/dev/null | cut -f1)
    DIST_FILES=$(find ./dist -type f 2>/dev/null | wc -l | tr -d ' ')
    log "dist/ directory:"
    log "  Size: $DIST_SIZE"
    log "  Files: $DIST_FILES"
fi

if [ -d "./.next" ]; then
    NEXT_SIZE=$(du -sh ./.next/ 2>/dev/null | cut -f1)
    NEXT_FILES=$(find ./.next -type f 2>/dev/null | wc -l | tr -d ' ')
    log ".next/ directory:"
    log "  Size: $NEXT_SIZE"
    log "  Files: $NEXT_FILES"
    
    if [ "$NEXT_FILES" -gt 10000 ]; then
        log "${YELLOW}⚠️  Large number of files ($NEXT_FILES) may cause timeout${NC}"
    fi
fi

if [ -d "./public" ]; then
    PUBLIC_SIZE=$(du -sh ./public/ 2>/dev/null | cut -f1)
    PUBLIC_FILES=$(find ./public -type f 2>/dev/null | wc -l | tr -d ' ')
    log "public/ directory:"
    log "  Size: $PUBLIC_SIZE"
    log "  Files: $PUBLIC_FILES"
fi

# 4. Netlify CLI Status
log_section "4. NETLIFY CLI STATUS"

if command -v netlify &> /dev/null || command -v npx &> /dev/null; then
    log "Checking Netlify CLI authentication..."
    if npx netlify-cli status 2>&1 | tee -a "$DIAGNOSTIC_FILE"; then
        log "${GREEN}✅ Netlify CLI is authenticated${NC}"
    else
        log "${RED}❌ Netlify CLI authentication failed${NC}"
        log "Run: npx netlify-cli login"
    fi
else
    log "${YELLOW}⚠️  Netlify CLI not found in PATH${NC}"
fi

# 5. Environment Variables Check
log_section "5. ENVIRONMENT VARIABLES CHECK"

log "Checking Netlify-related environment variables:"
if [ -n "$NETLIFY_TOKEN" ]; then
    log "${GREEN}✅ NETLIFY_TOKEN is set${NC}"
else
    log "${YELLOW}⚠️  NETLIFY_TOKEN is not set${NC}"
fi

if [ -n "$NETLIFY_RETRY_COUNT" ]; then
    log "${GREEN}✅ NETLIFY_RETRY_COUNT: $NETLIFY_RETRY_COUNT${NC}"
else
    log "${YELLOW}⚠️  NETLIFY_RETRY_COUNT is not set (default: 3)${NC}"
fi

if [ -n "$NETLIFY_RETRY_TIMEOUT" ]; then
    log "${GREEN}✅ NETLIFY_RETRY_TIMEOUT: $NETLIFY_RETRY_TIMEOUT${NC}"
else
    log "${YELLOW}⚠️  NETLIFY_RETRY_TIMEOUT is not set (default: 30000)${NC}"
fi

# 6. Netlify Service Status
log_section "6. NETLIFY SERVICE STATUS"

log "Checking Netlify status page..."
NETLIFY_STATUS=$(curl -s --max-time 10 https://www.netlifystatus.com/api/v2/status.json 2>/dev/null)
if [ -n "$NETLIFY_STATUS" ]; then
    if command -v jq &> /dev/null; then
        STATUS_INDICATOR=$(echo "$NETLIFY_STATUS" | jq -r '.status.indicator' 2>/dev/null)
        STATUS_DESCRIPTION=$(echo "$NETLIFY_STATUS" | jq -r '.status.description' 2>/dev/null)
        log "Status Indicator: $STATUS_INDICATOR"
        log "Status Description: $STATUS_DESCRIPTION"
        if [ "$STATUS_INDICATOR" = "none" ] || [ "$STATUS_INDICATOR" = "minor" ]; then
            log "${GREEN}✅ Netlify services appear operational${NC}"
        else
            log "${RED}❌ Netlify services may be experiencing issues${NC}"
        fi
    else
        log "$NETLIFY_STATUS"
        log "${YELLOW}⚠️  Install 'jq' for better status parsing${NC}"
    fi
else
    log "${YELLOW}⚠️  Could not fetch Netlify status${NC}"
fi

# 7. Configuration Check
log_section "7. CONFIGURATION CHECK"

if [ -f "./netlify.toml" ]; then
    log "${GREEN}✅ netlify.toml found${NC}"
    
    # Check for retry settings
    if grep -q "NETLIFY_RETRY_COUNT" ./netlify.toml; then
        log "${GREEN}✅ Retry configuration found in netlify.toml${NC}"
    else
        log "${YELLOW}⚠️  No retry configuration in netlify.toml${NC}"
    fi
    
    # Check timeout settings
    if grep -q "timeout" ./netlify.toml; then
        TIMEOUT_VALUE=$(grep -i "timeout" ./netlify.toml | head -1)
        log "${GREEN}✅ Timeout configured: $TIMEOUT_VALUE${NC}"
    else
        log "${YELLOW}⚠️  No timeout configuration found${NC}"
    fi
else
    log "${YELLOW}⚠️  netlify.toml not found${NC}"
fi

# 8. Recommendations
log_section "8. RECOMMENDATIONS"

log "Based on the diagnostics above, here are recommended actions:"
log ""
log "1. If network connectivity issues:"
log "   - Check firewall/proxy settings"
log "   - Try: NETLIFY_REGION=us npx netlify-cli deploy --prod"
log ""
log "2. If too many files:"
log "   - Optimize build output"
log "   - Check .gitignore and .netlifyignore"
log "   - Consider using: npm run deploy:netlify:retry"
log ""
log "3. If authentication issues:"
log "   - Run: npx netlify-cli login"
log "   - Clear cache: rm -rf ~/.netlify"
log ""
log "4. For maximum reliability:"
log "   - Use: npm run deploy:netlify:safe"
log "   - Or: npm run deploy:netlify:retry"
log ""
log "5. For debugging:"
log "   - Use: npm run deploy:netlify:debug"
log "   - Check logs in: $DIAGNOSTIC_FILE"

log_section "9. DIAGNOSTIC COMPLETE"

log "${GREEN}✅ Diagnostic report saved to: $DIAGNOSTIC_FILE${NC}"
log ""
log "Next steps:"
log "  1. Review the diagnostic report above"
log "  2. Try the recommended deployment commands"
log "  3. If issues persist, share this diagnostic file with support"
log ""
