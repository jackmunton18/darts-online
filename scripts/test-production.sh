#!/bin/bash
# Production Test Script for Darts Platform

echo "🎯 Darts Platform - Production Test Script"
echo "=========================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2"
    fi
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

echo ""
echo "1. Building project..."
npm run build
build_status=$?
print_status $build_status "Build completed"

if [ $build_status -ne 0 ]; then
    echo -e "${RED}Build failed. Please fix errors before deploying.${NC}"
    exit 1
fi

echo ""
echo "2. Checking output structure..."
if [ -d ".output" ]; then
    print_status 0 ".output directory exists"
else
    print_status 1 ".output directory missing"
fi

if [ -d ".output/public" ]; then
    print_status 0 ".output/public directory exists"
else
    print_status 1 ".output/public directory missing"
fi

if [ -d ".netlify/functions-internal" ]; then
    print_status 0 "Netlify functions directory exists"
else
    print_status 1 "Netlify functions directory missing"
fi

echo ""
echo "3. Checking critical files..."
critical_files=(
    ".output/public/index.html"
    ".netlify/functions-internal/server/server.mjs"
    "netlify.toml"
    "nuxt.config.ts"
)

for file in "${critical_files[@]}"; do
    if [ -f "$file" ]; then
        print_status 0 "$file exists"
    else
        print_status 1 "$file missing"
    fi
done

echo ""
echo "4. Checking environment variables setup..."
if [ -f ".env.production.example" ]; then
    print_status 0 "Production environment template exists"
else
    print_status 1 "Production environment template missing"
fi

echo ""
echo "5. Firebase configuration check..."
if grep -q "NUXT_PUBLIC_FIREBASE_API_KEY" .env.production.example; then
    print_status 0 "Firebase client config template found"
else
    print_status 1 "Firebase client config template missing"
fi

if grep -q "FIREBASE_PROJECT_ID" .env.production.example; then
    print_status 0 "Firebase admin config template found"
else
    print_status 1 "Firebase admin config template missing"
fi

echo ""
echo "6. API Routes check..."
api_routes=(
    ".netlify/functions-internal/server/chunks/routes/api/users/create.mjs"
    ".netlify/functions-internal/server/chunks/routes/api/users/me.mjs"
    ".netlify/functions-internal/server/chunks/routes/api/games/join.mjs"
    ".netlify/functions-internal/server/chunks/routes/api/auth.mjs"
)

for route in "${api_routes[@]}"; do
    if [ -f "$route" ]; then
        print_status 0 "$(basename "$route" .mjs) API route built"
    else
        print_status 1 "$(basename "$route" .mjs) API route missing"
    fi
done

echo ""
echo "7. Bundle size analysis..."
bundle_size=$(du -sh .output/public | cut -f1)
functions_size=$(du -sh .netlify/functions-internal | cut -f1)
echo "   Client bundle size: $bundle_size"
echo "   Server functions size: $functions_size"

if [ -f ".output/public/_nuxt/63YxoALd.js" ]; then
    large_chunk_size=$(stat -f%z .output/public/_nuxt/63YxoALd.js 2>/dev/null || stat -c%s .output/public/_nuxt/63YxoALd.js 2>/dev/null)
    if [ "$large_chunk_size" -gt 500000 ]; then
        print_warning "Large chunk detected (${large_chunk_size} bytes). Consider code splitting."
    fi
fi

echo ""
echo "=========================================="
echo "🎯 Production Test Summary"
echo "=========================================="

if [ $build_status -eq 0 ]; then
    echo -e "${GREEN}✓ Build successful - Ready for Netlify deployment${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Push to your Git repository"
    echo "2. Configure Netlify environment variables"
    echo "3. Deploy and test in production"
    echo ""
    echo "📖 See NETLIFY_DEPLOYMENT.md for detailed deployment instructions"
else
    echo -e "${RED}✗ Build failed - Fix errors before deploying${NC}"
    exit 1
fi
