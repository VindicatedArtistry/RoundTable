# Install Security Fixes
# Corrected version - installs only available package versions

Write-Host "🔒 Installing security fixes..." -ForegroundColor Cyan
Write-Host ""

Write-Host "📦 Installing Next.js 14.2.32..." -ForegroundColor Yellow
npm install next@14.2.32

Write-Host "📦 Installing validator 13.15.15 (latest)..." -ForegroundColor Yellow
npm install validator@13.15.15

Write-Host ""
Write-Host "✅ Security updates installed!" -ForegroundColor Green
Write-Host ""
Write-Host "Running audit..." -ForegroundColor Cyan
npm audit

Write-Host ""
Write-Host "🎉 Done! Check audit results above." -ForegroundColor Green