#!/bin/bash
# Script to pull production Llama models into Ollama
# Run this script after starting the Ollama container

set -e

OLLAMA_HOST="${OLLAMA_HOST:-http://localhost:11434}"

echo "==================================="
echo "Llama Model Setup for Production"
echo "==================================="
echo ""
echo "Prerequisites:"
echo "  - Meta AI License Agreement accepted"
echo "  - Ollama container running"
echo "  - Sufficient disk space and VRAM"
echo ""

# Check if Ollama is running
echo "Checking Ollama availability..."
if ! curl -sf "${OLLAMA_HOST}/api/tags" > /dev/null 2>&1; then
    echo "ERROR: Ollama is not available at ${OLLAMA_HOST}"
    echo "Please ensure the Ollama container is running."
    exit 1
fi

echo "Ollama is available at ${OLLAMA_HOST}"
echo ""

# Model selection
echo "Available production models:"
echo "  1. llama4-scout   - Llama 4 Scout (17B x 16 experts, ~109B total)"
echo "  2. llama4-maverick - Llama 4 Maverick (17B x 128 experts, ~400B total)"
echo "  3. llama3.3:70b   - Llama 3.3 70B (powerful, smaller than Llama 4)"
echo "  4. llama3.2:3b    - Llama 3.2 3B (development/testing)"
echo ""

MODEL="${1:-}"

if [ -z "$MODEL" ]; then
    echo "Usage: $0 <model-name>"
    echo ""
    echo "Examples:"
    echo "  $0 llama4-scout"
    echo "  $0 llama4-maverick"
    echo "  $0 llama3.3:70b"
    echo ""
    exit 0
fi

echo "Pulling model: ${MODEL}"
echo "This may take a while depending on your internet connection..."
echo ""

curl -X POST "${OLLAMA_HOST}/api/pull" \
    -H "Content-Type: application/json" \
    -d "{\"name\": \"${MODEL}\"}" \
    --no-buffer

echo ""
echo "Model pull completed!"
echo ""
echo "To use this model, set the following in your .env file:"
echo "  OLLAMA_MODEL=${MODEL}"
