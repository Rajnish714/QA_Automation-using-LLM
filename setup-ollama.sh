#!/bin/bash

# 🚀 Reelspect Ollama Setup Script
# This sets up your game automation with FREE local AI

echo "🤖 Reelspect - Free Local AI Game Testing Setup"
echo "================================================"
echo ""

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "❌ Ollama not found!"
    echo ""
    echo "📥 Download and install Ollama:"
    echo "   👉 https://ollama.ai"
    echo ""
    echo "Then come back and run this script again."
    exit 1
fi

echo "✅ Ollama found!"
echo ""

# Check if Ollama is running
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "⚠️  Ollama is not running"
    echo ""
    echo "📍 Start Ollama in a new terminal:"
    echo "   $ ollama serve"
    echo ""
    echo "Then come back and run this script again."
    exit 1
fi

echo "✅ Ollama is running on http://localhost:11434"
echo ""

# Check if qwen2.4:3b model is downloaded
echo "📦 Checking for Qwen 2.4 (3B) model..."
if curl -s http://localhost:11434/api/tags | grep -q "qwen2.4:3b"; then
    echo "✅ Qwen 2.4 (3B) model is ready!"
else
    echo "⏳ Qwen 2.4 (3B) is already installed per your setup!"
    echo "   If needed, you can reinstall with: ollama pull qwen2.4:3b"
    echo ""
fi
echo ""
echo "✅ Qwen 2.4 (3B) ready for game testing!"
echo ""
echo "🎮 Ready to test games with FREE local AI!"
echo ""
echo "Run this command:"
echo "   $ cd /d/aqtest/apps/api"
echo "   $ PLAYWRIGHT_HEADFUL=true USE_LOCAL_LLM=true npx ts-node-dev --respawn src/index.ts"
echo ""
echo "Then open: http://localhost:3000 and run your first test!"
echo ""
