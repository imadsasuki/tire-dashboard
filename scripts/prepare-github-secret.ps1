# PowerShell script to encode Firebase Service Account for GitHub Secret
# Run this in PowerShell to get the base64 encoded string for FIREBASE_SERVICE_ACCOUNT

$jsonPath = "C:\Users\imadn\Documents\Work\Zenith\Customers Study\Dashboard\tire-dashboard\tire-dashboard-firebase-adminsdk-fbsvc-e0a347d460.json"

if (Test-Path $jsonPath) {
    $jsonContent = Get-Content $jsonPath -Raw
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($jsonContent)
    $base64 = [Convert]::ToBase64String($bytes)
    
    Write-Host "`n=== BASE64 ENCODED SERVICE ACCOUNT ===" -ForegroundColor Green
    Write-Host $base64
    Write-Host "`n=== COPY THE ABOVE LINE ===" -ForegroundColor Green
    Write-Host "`nAdd this as a GitHub Secret named: FIREBASE_SERVICE_ACCOUNT" -ForegroundColor Yellow
} else {
    Write-Host "Service account file not found at: $jsonPath" -ForegroundColor Red
}

# Also extract environment variables
Write-Host "`n=== ENVIRONMENT VARIABLES FOR GITHUB SECRETS ===" -ForegroundColor Cyan
$json = Get-Content $jsonPath -Raw | ConvertFrom-Json

Write-Host "Project ID: $($json.project_id)"
Write-Host "`nYou'll also need to add these from your .env.local file:"
Write-Host "  - VITE_FIREBASE_API_KEY"
Write-Host "  - VITE_FIREBASE_AUTH_DOMAIN"
Write-Host "  - VITE_FIREBASE_PROJECT_ID"
Write-Host "  - VITE_FIREBASE_STORAGE_BUCKET"
Write-Host "  - VITE_FIREBASE_MESSAGING_SENDER_ID"
Write-Host "  - VITE_FIREBASE_APP_ID"
