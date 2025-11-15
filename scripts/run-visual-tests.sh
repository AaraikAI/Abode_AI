#!/bin/bash

# Visual Regression Testing Script
# Runs Percy visual regression tests

set -e

echo "🎨 Starting Visual Regression Tests..."

# Check if Percy token is set
if [ -z "$PERCY_TOKEN" ]; then
  echo "⚠️  Warning: PERCY_TOKEN not set. Tests will run in dry-run mode."
  echo "   To enable visual testing, set PERCY_TOKEN environment variable."
  echo ""
fi

# Function to check if command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check dependencies
echo "📦 Checking dependencies..."

if ! command_exists node; then
  echo "❌ Node.js is not installed"
  exit 1
fi

if ! command_exists npm; then
  echo "❌ npm is not installed"
  exit 1
fi

# Install Percy CLI if not present
if ! command_exists percy; then
  echo "📥 Installing Percy CLI..."
  npm install --save-dev @percy/cli @percy/playwright
fi

# Build the application
echo "🔨 Building application..."
npm run build

# Start the application in the background
echo "🚀 Starting application..."
npm run start &
APP_PID=$!

# Wait for application to be ready
echo "⏳ Waiting for application to start..."
npx wait-on http://localhost:3000 --timeout 60000

# Function to cleanup on exit
cleanup() {
  echo "🧹 Cleaning up..."
  kill $APP_PID 2>/dev/null || true
  exit
}

trap cleanup EXIT INT TERM

# Run visual tests
echo "🎨 Running visual regression tests..."

if [ -z "$PERCY_TOKEN" ]; then
  # Dry run mode
  echo "Running in dry-run mode (no snapshots will be uploaded)"
  npx playwright test __tests__/visual --config=playwright.config.visual.ts
else
  # Full Percy mode
  npx percy exec -- playwright test __tests__/visual --config=playwright.config.visual.ts
fi

# Check exit code
if [ $? -eq 0 ]; then
  echo "✅ Visual regression tests completed successfully!"
else
  echo "❌ Visual regression tests failed!"
  exit 1
fi

echo ""
echo "📊 Results:"
if [ -n "$PERCY_TOKEN" ]; then
  echo "   View visual diffs at: https://percy.io/"
else
  echo "   Tests ran in dry-run mode (no visual diffs captured)"
fi
