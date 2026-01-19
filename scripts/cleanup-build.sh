#!/bin/bash
# Cleanup script to remove unnecessary build artifacts before Netlify deployment
# This ensures .next/standalone and node_modules are not deployed

set -e

echo "🧹 Cleaning up build artifacts..."

# Remove standalone output (contains duplicated node_modules)
if [ -d ".next/standalone" ]; then
  echo "  ❌ Removing .next/standalone/ (contains node_modules)"
  rm -rf .next/standalone
fi

# Remove cache
if [ -d ".next/cache" ]; then
  echo "  ❌ Removing .next/cache/"
  rm -rf .next/cache
fi

# Remove trace files
if [ -f ".next/trace" ]; then
  echo "  ❌ Removing .next/trace"
  rm -f .next/trace
fi

# Remove types
if [ -d ".next/types" ]; then
  echo "  ❌ Removing .next/types/"
  rm -rf .next/types
fi

# Remove source maps
if find .next -name "*.map" -type f | grep -q .; then
  echo "  ❌ Removing source maps"
  find .next -name "*.map" -type f -delete
fi

# Remove any node_modules inside .next
if find .next -type d -name "node_modules" | grep -q .; then
  echo "  ❌ Removing node_modules from .next/"
  find .next -type d -name "node_modules" -exec rm -rf {} + 2>/dev/null || true
fi

echo "✅ Build cleanup complete!"
echo ""
echo "📊 Remaining essential files:"
echo "  ✅ .next/server/ (SSR pages and runtime)"
echo "  ✅ .next/static/ (static assets)"
echo "  ✅ .next/BUILD_ID"
echo "  ✅ Manifest files"
