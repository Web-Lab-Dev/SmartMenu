# ========================================
# Script pour supprimer les variables d'environnement système Firebase
# ========================================

Write-Host "🔍 Vérification des variables d'environnement système..." -ForegroundColor Cyan

# Vérifier les variables système
$systemVars = @('FIREBASE_PRIVATE_KEY', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PROJECT_ID')
$found = $false

foreach ($var in $systemVars) {
    $userValue = [System.Environment]::GetEnvironmentVariable($var, 'User')
    $machineValue = [System.Environment]::GetEnvironmentVariable($var, 'Machine')

    if ($userValue) {
        Write-Host "⚠️  Trouvé dans variables UTILISATEUR: $var" -ForegroundColor Yellow
        Write-Host "   Valeur: $($userValue.Substring(0, [Math]::Min(50, $userValue.Length)))..." -ForegroundColor Gray
        $found = $true
    }

    if ($machineValue) {
        Write-Host "⚠️  Trouvé dans variables SYSTÈME: $var" -ForegroundColor Yellow
        Write-Host "   Valeur: $($machineValue.Substring(0, [Math]::Min(50, $machineValue.Length)))..." -ForegroundColor Gray
        $found = $true
    }
}

if (-not $found) {
    Write-Host "✅ Aucune variable Firebase trouvée dans l'environnement système" -ForegroundColor Green
    Write-Host ""
    Write-Host "Le problème doit venir d'ailleurs. Vérifions le .env.local..." -ForegroundColor Cyan
    exit 0
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Red
Write-Host "⚠️  PROBLÈME DÉTECTÉ!" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red
Write-Host ""
Write-Host "Les variables système Firebase écrasent votre .env.local" -ForegroundColor Yellow
Write-Host ""
Write-Host "SOLUTION: Supprimer ces variables système" -ForegroundColor Cyan
Write-Host ""

$response = Read-Host "Voulez-vous supprimer ces variables maintenant? (O/N)"

if ($response -eq 'O' -or $response -eq 'o') {
    Write-Host ""
    Write-Host "🗑️  Suppression des variables..." -ForegroundColor Cyan

    foreach ($var in $systemVars) {
        # Supprimer de User
        $userValue = [System.Environment]::GetEnvironmentVariable($var, 'User')
        if ($userValue) {
            [System.Environment]::SetEnvironmentVariable($var, $null, 'User')
            Write-Host "✅ Supprimé de variables UTILISATEUR: $var" -ForegroundColor Green
        }

        # Supprimer de Machine (nécessite admin)
        try {
            $machineValue = [System.Environment]::GetEnvironmentVariable($var, 'Machine')
            if ($machineValue) {
                [System.Environment]::SetEnvironmentVariable($var, $null, 'Machine')
                Write-Host "✅ Supprimé de variables SYSTÈME: $var" -ForegroundColor Green
            }
        } catch {
            Write-Host "⚠️  Impossible de supprimer de SYSTÈME: $var (nécessite droits admin)" -ForegroundColor Yellow
        }
    }

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✅ TERMINÉ!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "IMPORTANT: Pour que les changements prennent effet:" -ForegroundColor Cyan
    Write-Host "1. Ferme ce terminal" -ForegroundColor White
    Write-Host "2. Ferme VS Code complètement" -ForegroundColor White
    Write-Host "3. Rouvre VS Code et le projet" -ForegroundColor White
    Write-Host "4. Lance 'npm run dev'" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Suppression annulée" -ForegroundColor Red
    Write-Host ""
    Write-Host "Pour supprimer manuellement:" -ForegroundColor Cyan
    Write-Host "1. Win + R → sysdm.cpl" -ForegroundColor White
    Write-Host "2. Avancé → Variables d'environnement" -ForegroundColor White
    Write-Host "3. Supprimer les variables Firebase" -ForegroundColor White
    Write-Host ""
}
