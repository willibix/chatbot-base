# Script to pull production Llama models into Ollama
# Run this script after starting the Ollama container

param(
    [string]$Model = ""
)

$OllamaHost = if ($env:OLLAMA_HOST) { $env:OLLAMA_HOST } else { "http://localhost:11434" }

Write-Host "===================================" -ForegroundColor Cyan
Write-Host "Llama Model Setup for Production" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Prerequisites:"
Write-Host "  - Meta AI License Agreement accepted"
Write-Host "  - Ollama container running"
Write-Host "  - Sufficient disk space and VRAM"
Write-Host ""

# Check if Ollama is running
Write-Host "Checking Ollama availability..."
try {
    $response = Invoke-RestMethod -Uri "$OllamaHost/api/tags" -Method Get -ErrorAction Stop
    Write-Host "Ollama is available at $OllamaHost" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Ollama is not available at $OllamaHost" -ForegroundColor Red
    Write-Host "Please ensure the Ollama container is running."
    exit 1
}

Write-Host ""
Write-Host "Available production models:"
Write-Host "  1. llama4-scout    - Llama 4 Scout (17B x 16 experts, ~109B total)"
Write-Host "  2. llama4-maverick - Llama 4 Maverick (17B x 128 experts, ~400B total)"
Write-Host "  3. llama3.3:70b    - Llama 3.3 70B (powerful, smaller than Llama 4)"
Write-Host "  4. llama3.2:3b     - Llama 3.2 3B (development/testing)"
Write-Host ""

if ([string]::IsNullOrEmpty($Model)) {
    Write-Host "Usage: .\pull-model.ps1 -Model <model-name>" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\pull-model.ps1 -Model llama4-scout"
    Write-Host "  .\pull-model.ps1 -Model llama4-maverick"
    Write-Host "  .\pull-model.ps1 -Model llama3.3:70b"
    Write-Host ""
    exit 0
}

Write-Host "Pulling model: $Model" -ForegroundColor Cyan
Write-Host "This may take a while depending on your internet connection..."
Write-Host ""

$body = @{
    name = $Model
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "$OllamaHost/api/pull" -Method Post -Body $body -ContentType "application/json"
    Write-Host ""
    Write-Host "Model pull completed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "To use this model, set the following in your .env file:"
    Write-Host "  OLLAMA_MODEL=$Model" -ForegroundColor Yellow
} catch {
    Write-Host "Error pulling model: $_" -ForegroundColor Red
    exit 1
}
