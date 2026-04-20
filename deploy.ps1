# Manual deployment using Service Account JSON
# Run this locally when GitHub Actions isn't working

Write-Host "=== Building for production ===" -ForegroundColor Green
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== Deploying to Firebase ===" -ForegroundColor Green
$env:GOOGLE_APPLICATION_CREDENTIALS = "$PSScriptRoot\tire-dashboard-firebase-adminsdk-fbsvc-e0a347d460.json"
firebase deploy --only hosting --project tire-dashboard

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n=== Deployed successfully! ===" -ForegroundColor Green
    Write-Host "Site: https://tire-dashboard.web.app" -ForegroundColor Cyan
} else {
    Write-Host "`n=== Deploy failed ===" -ForegroundColor Red
    Write-Host "Try running: firebase login" -ForegroundColor Yellow
}
