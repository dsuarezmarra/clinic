# Build Script para Cliente Específico
# Uso: .\build-client.ps1 -ClientId "nombre-cliente"

param(
    [Parameter(Mandatory=$true)]
    [string]$ClientId
)

Write-Host "🔨 Building para cliente: $ClientId" -ForegroundColor Cyan

# Ruta del archivo de configuración
$configFile = "src/app/config/client.config.ts"

# Leer el archivo
$content = Get-Content $configFile -Raw

# Reemplazar el clientId
$newContent = $content -replace "const clientId = '[^']+';", "const clientId = '$ClientId';"

# Guardar el archivo modificado
Set-Content $configFile $newContent

Write-Host "✅ Configuración actualizada para cliente: $ClientId" -ForegroundColor Green

# Ejecutar build
Write-Host "🏗️  Ejecutando ng build..." -ForegroundColor Yellow
npm run build

Write-Host "✅ Build completado!" -ForegroundColor Green
