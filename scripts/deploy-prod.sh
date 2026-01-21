#!/bin/bash

# Netlify Production Deployment Script
# Standard deployment script for production environment
# Usage: ./scripts/deploy-prod.sh or npm run deploy:prod:standard

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_step() {
    echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

# Banner
echo -e "${CYAN}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║     CareHaven - Netlify Production Deployment            ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}\n"

# Step 1: Check prerequisites
log_step "Step 1: Checking Prerequisites"

# Check if Netlify CLI is available
if ! command -v netlify &> /dev/null; then
    log_warning "Netlify CLI not found globally, using npx..."
    NETLIFY_CMD="npx netlify-cli"
else
    NETLIFY_CMD="netlify"
    log_success "Netlify CLI found"
fi

# Check if logged in to Netlify
log_info "Checking Netlify authentication..."
if ! $NETLIFY_CMD status &> /dev/null; then
    log_error "Not authenticated with Netlify. Please run: $NETLIFY_CMD login"
    exit 1
fi
log_success "Authenticated with Netlify"

# Check Node version
log_info "Checking Node.js version..."
NODE_VERSION=$(node --version)
log_success "Node.js version: $NODE_VERSION"

# Check npm version
log_info "Checking npm version..."
NPM_VERSION=$(npm --version)
log_success "npm version: $NPM_VERSION"

# Step 2: Verify environment variables
log_step "Step 2: Verifying Environment Variables"

REQUIRED_ENV_VARS=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
)

MISSING_VARS=()
for var in "${REQUIRED_ENV_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
        log_warning "$var is not set in local environment"
    else
        log_success "$var is set"
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    log_warning "Some environment variables are missing locally"
    log_info "Note: Ensure all required variables are set in Netlify dashboard"
    log_info "Missing locally: ${MISSING_VARS[*]}"
fi

# Step 3: Clean previous build
log_step "Step 3: Cleaning Previous Build"

if [ -d ".next" ]; then
    log_info "Removing .next directory..."
    rm -rf .next
    log_success ".next directory removed"
else
    log_info "No .next directory found, skipping cleanup"
fi

# Step 4: Install dependencies
log_step "Step 4: Installing Dependencies"

log_info "Running npm install..."
if npm ci --prefer-offline --no-audit; then
    log_success "Dependencies installed successfully"
else
    log_error "Failed to install dependencies"
    exit 1
fi

# Step 5: Generate Prisma Client
log_step "Step 5: Generating Prisma Client"

log_info "Generating Prisma Client..."
if npx prisma generate; then
    log_success "Prisma Client generated successfully"
else
    log_error "Failed to generate Prisma Client"
    exit 1
fi

# Step 6: Build project
log_step "Step 6: Building Project"

log_info "Building Next.js application..."
if npm run build; then
    log_success "Build completed successfully"
else
    log_error "Build failed"
    exit 1
fi

# Step 7: Deploy to production
log_step "Step 7: Deploying to Production"

log_info "Starting production deployment to Netlify..."
log_info "This may take several minutes..."

# Deploy with standard settings
DEPLOY_OUTPUT=$($NETLIFY_CMD deploy --prod --timeout=600 2>&1)
DEPLOY_STATUS=$?

if [ $DEPLOY_STATUS -eq 0 ]; then
    log_success "Deployment completed successfully!"
    
    # Extract deploy URL from output
    DEPLOY_URL=$(echo "$DEPLOY_OUTPUT" | grep -oE 'https://[^[:space:]]+\.netlify\.app' | head -1 || echo "")
    
    if [ -n "$DEPLOY_URL" ]; then
        echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        log_success "Your site is live at: ${DEPLOY_URL}"
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
    fi
    
    # Show full deploy output
    echo "$DEPLOY_OUTPUT"
    
    log_success "Production deployment completed!"
else
    log_error "Deployment failed with status code: $DEPLOY_STATUS"
    echo "$DEPLOY_OUTPUT"
    exit 1
fi

# Step 8: Verification (optional)
log_step "Step 8: Post-Deployment Verification"

log_info "Deployment completed. Please verify:"
log_info "  1. Visit your production site"
log_info "  2. Check Netlify dashboard for deployment status"
log_info "  3. Verify environment variables are set correctly"
log_info "  4. Test critical user flows"

log_success "Deployment script completed successfully!"
