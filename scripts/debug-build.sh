#!/bin/bash

echo "🔍 Debug Build Process"
echo "======================"

echo "📦 Installing dependencies..."
npm install

echo "🏗️ Running build..."
npm run build

echo "📁 Checking output directory..."
if [ -d ".output" ]; then
    echo "✅ .output directory exists"
    ls -la .output/
    
    if [ -d ".output/public" ]; then
        echo "✅ .output/public directory exists"
        ls -la .output/public/
    else
        echo "❌ .output/public directory missing"
    fi
    
    if [ -d ".output/server" ]; then
        echo "✅ .output/server directory exists"
        ls -la .output/server/
    else
        echo "❌ .output/server directory missing"
    fi
else
    echo "❌ .output directory does not exist"
fi

echo "🔧 Nuxt info..."
npx nuxt info

echo "Debug complete!"
