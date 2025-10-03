# Script para convertir backend a multi-tenant
# Reemplaza todas las referencias hardcodeadas a tablas por llamadas a getTableName()

$filePath = "c:\Users\dsuarez1\git\clinic\backend\src\database\database-manager.js"

Write-Host "🔧 Convirtiendo backend a multi-tenant..." -ForegroundColor Cyan
Write-Host "   Archivo: $filePath" -ForegroundColor Gray

# Leer contenido
$content = Get-Content $filePath -Raw

# Contador de reemplazos
$replaceCount = 0

# Lista de tablas a reemplazar
$tables = @(
    'patients',
    'appointments',
    'credit_packs',
    'credit_redemptions',
    'patient_files',
    'configurations',
    'configuration',  # También está en singular en algunos lugares
    'backups',
    'invoices',
    'invoice_items'
)

# Reemplazar cada tabla
foreach ($table in $tables) {
    $pattern = "\.from\('$table'\)"
    $replacement = ".from(this.getTableName('$table'))"
    
    $matches = [regex]::Matches($content, $pattern)
    $matchCount = $matches.Count
    
    if ($matchCount -gt 0) {
        Write-Host "   Reemplazando '$table': $matchCount ocurrencias" -ForegroundColor Yellow
        $content = $content -replace $pattern, $replacement
        $replaceCount += $matchCount
    }
}

# Guardar archivo modificado
$content | Set-Content $filePath -NoNewline

Write-Host ""
Write-Host "✅ Conversión completada!" -ForegroundColor Green
Write-Host "   Total de reemplazos: $replaceCount" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANTE: Revisar el archivo modificado antes de commitear" -ForegroundColor Yellow
Write-Host "   El backend ahora usará tablas con sufijo cuando tenantSlug esté configurado" -ForegroundColor Gray
Write-Host "   Compatibilidad hacia atrás: Si no hay tenantSlug, usa nombres sin sufijo" -ForegroundColor Gray
