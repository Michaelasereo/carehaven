#!/bin/bash

# Standard Netlify Production Deployment Script
# This script provides a reliable, production-ready deployment workflow

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Functions for colored output
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

log_section() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# Check if Netlify CLI is installed
check_netlify_cli() {
    log_section "Checking Netlify CLI"
    
    if command -v netlify &> /dev/null; then
        NETLIFY_VERSION=$(netlify --version)
        log_success "Netlify CLI found: $NETLIFY_VERSION"
    else
        log_info "Netlify CLI not found globally, will use npx"
        USE_NPX=true
    fi
}

# Check git status
check_git_status() {
    log_section "Checking Git Status"
    
    if ! command -v git &> /dev/null; then
        log_warning "Git not found, skipping git checks"
        return
    fi
    
    if [ ! -d .git ]; then
        log_warning "Not a git repository, skipping git checks"
        return
    fi
    
    # Check if there are uncommitted changes
    if ! git diff-index --quiet HEAD --; then
        log_warning "You have uncommitted changes"
        log_info "Consider committing your changes before deploying to production"
        read -p "Continue anyway? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_error "Deployment cancelled"
            exit 1
        fi
    else
        log_success "Working directory is clean"
    fi
    
    # Show current branch
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    log_info "Current branch: $CURRENT_BRANCH"
    
    if [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "master" ]; then
        log_warning "You're not on main/master branch"
        read -p "Deploy to production anyway? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_error "Deployment cancelled"
            exit 1
        fi
    fi
}

# Check Node.js and npm
check_environment() {
    log_section "Checking Environment"
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    
    NODE_VERSION=$(node --version)
    log_success "Node.js: $NODE_VERSION"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed"
        exit 1
    fi
    
    NPM_VERSION=$(npm --version)
    log_success "npm: $NPM_VERSION"
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        log_warning "node_modules not found, installing dependencies..."
        npm install
    else
        log_success "Dependencies installed"
    fi
}

# Check environment variables (basic check)
check_env_vars() {
    log_section "Checking Environment Variables"
    
    # Note: We can't check all env vars here since they might be set in Netlify dashboard
    # But we can check if .env.local exists and warn
    if [ -f ".env.local" ]; then
        log_warning ".env.local file found"
        log_info "Make sure all required environment variables are set in Netlify dashboard"
    fi
    
    log_info "Required Netlify environment variables:"
    echo "  - NEXT_PUBLIC_SUPABASE_URL"
    echo "  - NEXT_PUBLIC_SUPABASE_ANON_KEY"
    echo "  - SUPABASE_SERVICE_ROLE_KEY"
    echo ""
    log_info "Ensure these are configured in Netlify dashboard before deploying"
}

# Build the project
build_project() {
    log_section "Building Project"
    
    log_info "Running production build..."
    
    # Clean previous builds
    if [ -d ".next" ]; then
        log_info "Cleaning previous build..."
        rm -rf .next
    fi
    
    # Run build
    if npm run build; then
        log_success "Build completed successfully"
    else
        log_error "Build failed"
        exit 1
    fi
}

# Deploy to Netlify
deploy_to_netlify() {
    log_section "Deploying to Netlify Production"
    
    # Set deployment environment variables
    export NODE_ENV=production
    export NETLIFY_RETRY_COUNT=5
    export NETLIFY_RETRY_TIMEOUT=300000
    export NETLIFY_CDN_UPLOAD_CONCURRENCY=3
    export NETLIFY_CDN_UPLOAD_TIMEOUT=600
    export NODE_OPTIONS="--max-http-header-size=16384"
    
    log_info "Starting production deployment..."
    log_info "This may take several minutes..."
    echo ""
    
    # Use netlify CLI directly or via npx
    if [ "$USE_NPX" = true ]; then
        DEPLOY_CMD="npx netlify-cli deploy --prod --timeout=600"
    else
        DEPLOY_CMD="netlify deploy --prod --timeout=600"
    fi
    
    if eval "$DEPLOY_CMD"; then
        log_success "Deployment completed successfully!"
        echo ""
        log_info "Your site should be live shortly"
        log_info "Check your Netlify dashboard for deployment status"
    else
        log_error "Deployment failed"
        exit 1
    fi
}

# Main execution
main() {
    echo ""
    echo -e "${CYAN}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║   CareHaven Production Deployment Script                ║${NC}"
    echo -e "${CYAN}╚═══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    # Run all checks and deployment steps
    check_netlify_cli
    check_git_status
    check_environment
    check_env_vars
    
    # Ask for confirmation before building
    echo ""
    read -p "Proceed with build and deployment? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Deployment cancelled by user"
        exit 0
    fi
    
    build_project
    deploy_to_netlify
    
    echo ""
    log_success "Production deployment complete!"
    echo ""
}

# Run main function
main
