# Start SurrealDB Server
# This script starts SurrealDB with the correct configuration

Write-Host "🚀 Starting SurrealDB server..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  URL: ws://localhost:8000/rpc" -ForegroundColor White
Write-Host "  Namespace: theroundtable" -ForegroundColor White
Write-Host "  Database: council" -ForegroundColor White
Write-Host "  Username: root" -ForegroundColor White
Write-Host "  Password: root" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host ""

# Start SurrealDB
surreal start --log trace --user root --pass root memory