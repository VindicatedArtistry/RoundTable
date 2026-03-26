# SurrealDB Installation Script for Windows
# Run this script to install and start SurrealDB

Write-Host "🚀 Installing SurrealDB..." -ForegroundColor Cyan

# Install SurrealDB
try {
    iwr https://windows.surrealdb.com -useb | iex
    Write-Host "✅ SurrealDB installed successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install SurrealDB: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📦 Installing Node dependencies..." -ForegroundColor Cyan

# Install npm dependencies
try {
    npm install
    Write-Host "✅ Dependencies installed successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install dependencies: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Installation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "To start SurrealDB, run:" -ForegroundColor Yellow
Write-Host "  surreal start --log trace --user root --pass root memory" -ForegroundColor White
Write-Host ""
Write-Host "Then start your application with:" -ForegroundColor Yellow
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""