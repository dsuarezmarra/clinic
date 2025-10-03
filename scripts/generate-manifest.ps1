# ============================================================================
# 🎨 Script para generar Manifest PWA por cliente
# ============================================================================
# 
# USO:
#   .\scripts\generate-manifest.ps1 [clientId]
# 
# EJEMPLOS:
#   .\scripts\generate-manifest.ps1 masajecorporaldeportivo
#   .\scripts\generate-manifest.ps1 actifisio
#   .\scripts\generate-manifest.ps1    # Usa cliente por defecto
# 
# ============================================================================

param(
    [string]$ClientId = "masajecorporaldeportivo"
)

# Configuraciones de clientes
$CLIENT_CONFIGS = @{
    masajecorporaldeportivo = @{
        Name        = "Masaje Corporal Deportivo"
        ShortName   = "Clínica MCD"
        Description = "Sistema de gestión para clínica de masaje corporal deportivo"
        ThemeColor  = "#667eea"
        LogoPath    = "assets/clients/masajecorporaldeportivo/logo.png"
    }
    actifisio = @{
        Name        = "Actifisio"
        ShortName   = "Actifisio"
        Description = "Sistema de gestión para centro de fisioterapia Actifisio"
        ThemeColor  = "#ff6b35"
        LogoPath    = "assets/clients/actifisio/logo.png"
    }
}

# ============================================================================
# Funciones
# ============================================================================

function Write-Header {
    Write-Host ""
    Write-Host "🎨 ============================================" -ForegroundColor Cyan
    Write-Host "   Generador de Manifest PWA Multi-Cliente" -ForegroundColor Cyan
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host ""
}

function Get-ClientConfig {
    param([string]$Id)
    
    if (-not $CLIENT_CONFIGS.ContainsKey($Id)) {
        Write-Host "❌ Error: Cliente '$Id' no encontrado" -ForegroundColor Red
        Write-Host "Clientes disponibles:" -ForegroundColor Yellow
        $CLIENT_CONFIGS.Keys | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
        exit 1
    }
    
    return $CLIENT_CONFIGS[$Id]
}

function Test-TemplatePath {
    $templatePath = Join-Path $PSScriptRoot "..\frontend\src\manifest.template.json"
    
    if (-not (Test-Path $templatePath)) {
        Write-Host "❌ Error: No se encontró el template: $templatePath" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Template encontrado: manifest.template.json" -ForegroundColor Green
    return $templatePath
}

function Test-LogoPath {
    param([string]$LogoPath)
    
    $fullLogoPath = Join-Path $PSScriptRoot "..\frontend\src\$LogoPath"
    
    if (-not (Test-Path $fullLogoPath)) {
        Write-Host "⚠️  ADVERTENCIA: Logo no encontrado: $LogoPath" -ForegroundColor Yellow
        Write-Host "   El PWA puede no funcionar correctamente" -ForegroundColor Yellow
        return $false
    }
    
    Write-Host "✅ Logo verificado: $LogoPath" -ForegroundColor Green
    return $true
}

function New-Manifest {
    param(
        [string]$TemplatePath,
        [hashtable]$Config
    )
    
    Write-Host ""
    Write-Host "📋 Generando manifest para: $($Config.Name)" -ForegroundColor Cyan
    Write-Host "   - Nombre corto: $($Config.ShortName)" -ForegroundColor Gray
    Write-Host "   - Color tema: $($Config.ThemeColor)" -ForegroundColor Gray
    Write-Host "   - Logo: $($Config.LogoPath)" -ForegroundColor Gray
    
    # Leer template
    $template = Get-Content $TemplatePath -Raw -Encoding UTF8
    
    # Reemplazar placeholders
    $manifest = $template `
        -replace '{{APP_NAME}}', $Config.Name `
        -replace '{{SHORT_NAME}}', $Config.ShortName `
        -replace '{{DESCRIPTION}}', $Config.Description `
        -replace '{{THEME_COLOR}}', $Config.ThemeColor `
        -replace '{{LOGO_PATH}}', $Config.LogoPath
    
    return $manifest
}

function Save-Manifest {
    param(
        [string]$Content,
        [string]$OutputPath
    )
    
    # Validar JSON antes de guardar
    try {
        $Content | ConvertFrom-Json | Out-Null
    } catch {
        Write-Host "❌ Error: El manifest generado no es JSON válido" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        exit 1
    }
    
    # Guardar archivo
    $Content | Out-File -FilePath $OutputPath -Encoding UTF8 -NoNewline
    
    Write-Host ""
    Write-Host "✅ Manifest generado exitosamente!" -ForegroundColor Green
    Write-Host "   Guardado en: $OutputPath" -ForegroundColor Gray
}

# ============================================================================
# EJECUCIÓN PRINCIPAL
# ============================================================================

Write-Header

# 1. Obtener configuración del cliente
Write-Host "🔍 Cliente seleccionado: $ClientId" -ForegroundColor Cyan
$config = Get-ClientConfig -Id $ClientId

# 2. Verificar template
$templatePath = Test-TemplatePath

# 3. Verificar logo
Test-LogoPath -LogoPath $config.LogoPath | Out-Null

# 4. Generar manifest
$manifestContent = New-Manifest -TemplatePath $templatePath -Config $config

# 5. Guardar manifest
$outputPath = Join-Path $PSScriptRoot "..\frontend\src\manifest.json"
Save-Manifest -Content $manifestContent -OutputPath $outputPath

Write-Host ""
Write-Host "🎉 ¡Proceso completado exitosamente!" -ForegroundColor Green
Write-Host ""
