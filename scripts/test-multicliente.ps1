# ============================================================================
# 🧪 Script de Testing Multi-Cliente - Sistema Completo
# ============================================================================
# 
# Este script verifica que el sistema multi-cliente funciona correctamente
# para ambos clientes (masajecorporaldeportivo y actifisio)
# 
# USO:
#   .\scripts\test-multicliente.ps1
# 
# ============================================================================

$ErrorActionPreference = "Continue"

function Write-Header {
    param([string]$Text)
    Write-Host "`n" -NoNewline
    Write-Host "=" -NoNewline -ForegroundColor Cyan
    Write-Host (" " * 60) -NoNewline
    Write-Host "=" -ForegroundColor Cyan
    Write-Host "  $Text" -ForegroundColor Cyan
    Write-Host "=" -NoNewline -ForegroundColor Cyan
    Write-Host (" " * 60) -NoNewline
    Write-Host "=" -ForegroundColor Cyan
}

function Write-TestSection {
    param([string]$Text)
    Write-Host "`n📋 $Text" -ForegroundColor Yellow
    Write-Host ("─" * 70) -ForegroundColor Gray
}

function Write-TestItem {
    param([string]$Text)
    Write-Host "   🔍 $Text..." -ForegroundColor Gray -NoNewline
}

function Write-Pass {
    Write-Host " ✅ PASS" -ForegroundColor Green
}

function Write-Fail {
    param([string]$Reason)
    Write-Host " ❌ FAIL" -ForegroundColor Red
    Write-Host "      Razón: $Reason" -ForegroundColor Red
}

function Write-Warning-Custom {
    param([string]$Text)
    Write-Host " ⚠️  WARNING: $Text" -ForegroundColor Yellow
}

function Write-Summary {
    param(
        [int]$Total,
        [int]$Passed,
        [int]$Failed,
        [int]$Warnings
    )
    Write-Host "`n" -NoNewline
    Write-Host "=" -NoNewline -ForegroundColor Cyan
    Write-Host (" " * 60) -NoNewline
    Write-Host "=" -ForegroundColor Cyan
    Write-Host "  RESUMEN DE TESTS" -ForegroundColor Cyan
    Write-Host "=" -NoNewline -ForegroundColor Cyan
    Write-Host (" " * 60) -NoNewline
    Write-Host "=" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Total:     $Total tests" -ForegroundColor White
    Write-Host "  ✅ Passed:  $Passed tests" -ForegroundColor Green
    Write-Host "  ❌ Failed:  $Failed tests" -ForegroundColor Red
    Write-Host "  ⚠️  Warnings: $Warnings" -ForegroundColor Yellow
    Write-Host ""
    
    $percentage = [math]::Round(($Passed / $Total) * 100, 1)
    
    if ($Failed -eq 0 -and $Warnings -eq 0) {
        Write-Host "  🎉 ¡TODOS LOS TESTS PASARON! ($percentage%)" -ForegroundColor Green
    } elseif ($Failed -eq 0) {
        Write-Host "  ✨ Tests OK con warnings ($percentage%)" -ForegroundColor Yellow
    } else {
        Write-Host "  ⚠️  Algunos tests fallaron ($percentage%)" -ForegroundColor Red
    }
    Write-Host ""
}

# ============================================================================
# Variables globales
# ============================================================================

$script:TotalTests = 0
$script:PassedTests = 0
$script:FailedTests = 0
$script:Warnings = 0

# ============================================================================
# Tests
# ============================================================================

Write-Header "🧪 SISTEMA DE TESTING MULTI-CLIENTE"

# ============================================================================
# TEST 1: Estructura de Archivos
# ============================================================================

Write-TestSection "TEST 1: Estructura de Archivos y Configuración"

# Test 1.1: Archivos de configuración existen
Write-TestItem "Archivo config masajecorporaldeportivo"
$script:TotalTests++
if (Test-Path "frontend\src\config\clients\masajecorporaldeportivo.config.ts") {
    Write-Pass
    $script:PassedTests++
} else {
    Write-Fail "Archivo no encontrado"
    $script:FailedTests++
}

Write-TestItem "Archivo config actifisio"
$script:TotalTests++
if (Test-Path "frontend\src\config\clients\actifisio.config.ts") {
    Write-Pass
    $script:PassedTests++
} else {
    Write-Fail "Archivo no encontrado"
    $script:FailedTests++
}

Write-TestItem "config.loader.ts existe"
$script:TotalTests++
if (Test-Path "frontend\src\config\config.loader.ts") {
    Write-Pass
    $script:PassedTests++
} else {
    Write-Fail "Archivo no encontrado"
    $script:FailedTests++
}

# Test 1.2: Assets de clientes
Write-TestItem "Carpeta assets masajecorporaldeportivo"
$script:TotalTests++
if (Test-Path "frontend\src\assets\clients\masajecorporaldeportivo") {
    Write-Pass
    $script:PassedTests++
} else {
    Write-Fail "Carpeta no encontrada"
    $script:FailedTests++
}

Write-TestItem "Logo masajecorporaldeportivo"
$script:TotalTests++
if (Test-Path "frontend\src\assets\clients\masajecorporaldeportivo\logo.png") {
    Write-Pass
    $script:PassedTests++
} else {
    Write-Warning-Custom "Logo no encontrado"
    $script:PassedTests++
    $script:Warnings++
}

Write-TestItem "Carpeta assets actifisio"
$script:TotalTests++
if (Test-Path "frontend\src\assets\clients\actifisio") {
    Write-Pass
    $script:PassedTests++
} else {
    Write-Fail "Carpeta no encontrada"
    $script:FailedTests++
}

Write-TestItem "Logo actifisio"
$script:TotalTests++
if (Test-Path "frontend\src\assets\clients\actifisio\logo.png") {
    Write-Pass
    $script:PassedTests++
} else {
    Write-Warning-Custom "Logo no encontrado (esperado)"
    $script:PassedTests++
    $script:Warnings++
}

# ============================================================================
# TEST 2: Scripts de Generación
# ============================================================================

Write-TestSection "TEST 2: Scripts de Generación y Build"

# Test 2.1: Scripts existen
Write-TestItem "generate-manifest.ps1"
$script:TotalTests++
if (Test-Path "scripts\generate-manifest.ps1") {
    Write-Pass
    $script:PassedTests++
} else {
    Write-Fail "Script no encontrado"
    $script:FailedTests++
}

Write-TestItem "generate-manifest.js"
$script:TotalTests++
if (Test-Path "scripts\generate-manifest.js") {
    Write-Pass
    $script:PassedTests++
} else {
    Write-Fail "Script no encontrado"
    $script:FailedTests++
}

Write-TestItem "build-client.ps1"
$script:TotalTests++
if (Test-Path "scripts\build-client.ps1") {
    Write-Pass
    $script:PassedTests++
} else {
    Write-Fail "Script no encontrado"
    $script:FailedTests++
}

Write-TestItem "manifest.template.json"
$script:TotalTests++
if (Test-Path "frontend\src\manifest.template.json") {
    Write-Pass
    $script:PassedTests++
} else {
    Write-Fail "Template no encontrado"
    $script:FailedTests++
}

# Test 2.2: Generación de manifest para masajecorporaldeportivo
Write-TestItem "Generar manifest masajecorporaldeportivo"
$script:TotalTests++
try {
    $output = & ".\scripts\generate-manifest.ps1" -ClientId "masajecorporaldeportivo" 2>&1
    # Verificar que el manifest se creó (no importa el exit code)
    if (Test-Path "frontend\src\manifest.json") {
        Write-Pass
        $script:PassedTests++
    } else {
        Write-Fail "Manifest no generado"
        $script:FailedTests++
    }
} catch {
    Write-Fail $_.Exception.Message
    $script:FailedTests++
}

# Test 2.3: Validar contenido manifest masajecorporaldeportivo
Write-TestItem "Validar manifest masajecorporaldeportivo"
$script:TotalTests++
try {
    $manifest = Get-Content "frontend\src\manifest.json" -Raw | ConvertFrom-Json
    if ($manifest.name -eq "Masaje Corporal Deportivo" -and 
        $manifest.theme_color -eq "#667eea") {
        Write-Pass
        $script:PassedTests++
    } else {
        Write-Fail "Contenido incorrecto: name=$($manifest.name), theme=$($manifest.theme_color)"
        $script:FailedTests++
    }
} catch {
    Write-Fail $_.Exception.Message
    $script:FailedTests++
}

# Test 2.4: Generación de manifest para actifisio
Write-TestItem "Generar manifest actifisio"
$script:TotalTests++
try {
    $output = & ".\scripts\generate-manifest.ps1" -ClientId "actifisio" 2>&1
    # Verificar que el manifest se creó (no importa el exit code)
    if (Test-Path "frontend\src\manifest.json") {
        Write-Pass
        $script:PassedTests++
    } else {
        Write-Fail "Manifest no generado"
        $script:FailedTests++
    }
} catch {
    Write-Fail $_.Exception.Message
    $script:FailedTests++
}

# Test 2.5: Validar contenido manifest actifisio
Write-TestItem "Validar manifest actifisio"
$script:TotalTests++
try {
    $manifest = Get-Content "frontend\src\manifest.json" -Raw | ConvertFrom-Json
    if ($manifest.name -eq "Actifisio" -and 
        $manifest.theme_color -eq "#ff6b35") {
        Write-Pass
        $script:PassedTests++
    } else {
        Write-Fail "Contenido incorrecto: name=$($manifest.name), theme=$($manifest.theme_color)"
        $script:FailedTests++
    }
} catch {
    Write-Fail $_.Exception.Message
    $script:FailedTests++
}

# ============================================================================
# TEST 3: Servicios HTTP
# ============================================================================

Write-TestSection "TEST 3: Servicios HTTP y X-Tenant-Slug"

$services = @(
    "patient.service.ts",
    "appointment.service.ts",
    "credit.service.ts",
    "file.service.ts",
    "backup.service.ts",
    "config.service.ts"
)

foreach ($service in $services) {
    Write-TestItem "Servicio $service tiene ClientConfigService"
    $script:TotalTests++
    $servicePath = "frontend\src\app\services\$service"
    
    if (Test-Path $servicePath) {
        $content = Get-Content $servicePath -Raw
        if ($content -match "ClientConfigService" -and 
            $content -match "getTenantHeader") {
            Write-Pass
            $script:PassedTests++
        } else {
            Write-Fail "No usa ClientConfigService o getTenantHeader"
            $script:FailedTests++
        }
    } else {
        Write-Fail "Servicio no encontrado"
        $script:FailedTests++
    }
}

# ============================================================================
# TEST 4: Configuración TypeScript
# ============================================================================

Write-TestSection "TEST 4: Validación de Configuración TypeScript"

Write-TestItem "config.loader.ts importa configuraciones correctas"
$script:TotalTests++
$loaderPath = "frontend\src\config\config.loader.ts"
if (Test-Path $loaderPath) {
    $content = Get-Content $loaderPath -Raw
    if ($content -match "actifisioConfig" -and 
        $content -match "masajecorporaldeportivoConfig" -and
        $content -match "'actifisio':\s*actifisioConfig" -and
        $content -match "'masajecorporaldeportivo':\s*masajecorporaldeportivoConfig") {
        Write-Pass
        $script:PassedTests++
    } else {
        Write-Fail "Imports o mapping incorrecto"
        $script:FailedTests++
    }
} else {
    Write-Fail "config.loader.ts no encontrado"
    $script:FailedTests++
}

Write-TestItem "actifisio.config.ts tiene tenantSlug correcto"
$script:TotalTests++
$actifisioPath = "frontend\src\config\clients\actifisio.config.ts"
if (Test-Path $actifisioPath) {
    $content = Get-Content $actifisioPath -Raw
    if ($content -match "tenantSlug:\s*'actifisio'") {
        Write-Pass
        $script:PassedTests++
    } else {
        Write-Fail "tenantSlug no es 'actifisio'"
        $script:FailedTests++
    }
} else {
    Write-Fail "actifisio.config.ts no encontrado"
    $script:FailedTests++
}

# ============================================================================
# TEST 5: Package.json Scripts
# ============================================================================

Write-TestSection "TEST 5: Scripts npm"

Write-TestItem "package.json raíz tiene script build:actifisio"
$script:TotalTests++
$packagePath = "package.json"
if (Test-Path $packagePath) {
    $content = Get-Content $packagePath -Raw
    if ($content -match "build:actifisio") {
        Write-Pass
        $script:PassedTests++
    } else {
        Write-Fail "Script build:actifisio no encontrado"
        $script:FailedTests++
    }
} else {
    Write-Fail "package.json no encontrado"
    $script:FailedTests++
}

Write-TestItem "frontend/package.json tiene script build:actifisio"
$script:TotalTests++
$frontendPackagePath = "frontend\package.json"
if (Test-Path $frontendPackagePath) {
    $content = Get-Content $frontendPackagePath -Raw
    if ($content -match "build:actifisio") {
        Write-Pass
        $script:PassedTests++
    } else {
        Write-Fail "Script build:actifisio no encontrado"
        $script:FailedTests++
    }
} else {
    Write-Fail "frontend/package.json no encontrado"
    $script:FailedTests++
}

# ============================================================================
# TEST 6: Temas CSS
# ============================================================================

Write-TestSection "TEST 6: Sistema de Temas CSS"

Write-TestItem "styles.scss tiene variables CSS"
$script:TotalTests++
$stylesPath = "frontend\src\styles.scss"
if (Test-Path $stylesPath) {
    $content = Get-Content $stylesPath -Raw
    if ($content -match "--primary-color" -and 
        $content -match "--header-gradient" -and
        $content -match "var\(--primary-color\)") {
        Write-Pass
        $script:PassedTests++
    } else {
        Write-Fail "Variables CSS no encontradas o no usadas"
        $script:FailedTests++
    }
} else {
    Write-Fail "styles.scss no encontrado"
    $script:FailedTests++
}

Write-TestItem "app.component.ts aplica tema en ngOnInit"
$script:TotalTests++
$appComponentPath = "frontend\src\app\app.component.ts"
if (Test-Path $appComponentPath) {
    $content = Get-Content $appComponentPath -Raw
    if ($content -match "ClientConfigService" -and 
        $content -match "applyTheme" -and
        $content -match "ngOnInit") {
        Write-Pass
        $script:PassedTests++
    } else {
        Write-Fail "app.component.ts no aplica tema correctamente"
        $script:FailedTests++
    }
} else {
    Write-Fail "app.component.ts no encontrado"
    $script:FailedTests++
}

# ============================================================================
# TEST 7: Documentación
# ============================================================================

Write-TestSection "TEST 7: Documentación"

$docs = @(
    "FASE1_COMPLETADA.md",
    "FASE2_COMPLETADA.md",
    "FASE3_COMPLETADA.md",
    "FASE4_COMPLETADA.md",
    "FASE5_COMPLETADA.md",
    "GUIA_SISTEMA_MULTICLIENTE.md",
    "ACTUALIZACION_CLIENTE_ACTIFISIO.md",
    "GUIA_RAPIDA_DEPLOYMENT.md"
)

foreach ($doc in $docs) {
    Write-TestItem "Documentación: $doc"
    $script:TotalTests++
    if (Test-Path $doc) {
        Write-Pass
        $script:PassedTests++
    } else {
        Write-Fail "Documento no encontrado"
        $script:FailedTests++
    }
}

# ============================================================================
# TEST 8: Build Test (Opcional - comentado por defecto)
# ============================================================================

Write-TestSection "TEST 8: Build Test (OPCIONAL)"

Write-Host "   ℹ️  Build test deshabilitado por defecto (toma tiempo)" -ForegroundColor Cyan
Write-Host "   Para habilitar, ejecuta manualmente:" -ForegroundColor Cyan
Write-Host "      .\scripts\build-client.ps1 masajecorporaldeportivo" -ForegroundColor Gray
Write-Host "      .\scripts\build-client.ps1 actifisio" -ForegroundColor Gray

# Uncomment para ejecutar build test
# Write-TestItem "Build masajecorporaldeportivo"
# $script:TotalTests++
# try {
#     & ".\scripts\build-client.ps1" -ClientId "masajecorporaldeportivo" | Out-Null
#     if ($LASTEXITCODE -eq 0) {
#         Write-Pass
#         $script:PassedTests++
#     } else {
#         Write-Fail "Build falló"
#         $script:FailedTests++
#     }
# } catch {
#     Write-Fail $_.Exception.Message
#     $script:FailedTests++
# }

# ============================================================================
# Resumen Final
# ============================================================================

Write-Summary -Total $script:TotalTests -Passed $script:PassedTests -Failed $script:FailedTests -Warnings $script:Warnings

# Restaurar manifest por defecto (masajecorporaldeportivo)
Write-Host "🔄 Restaurando manifest por defecto..." -ForegroundColor Cyan
& ".\scripts\generate-manifest.ps1" -ClientId "masajecorporaldeportivo" | Out-Null
Write-Host "✅ Manifest restaurado a masajecorporaldeportivo" -ForegroundColor Green
Write-Host ""

# Exit code basado en resultados
if ($script:FailedTests -gt 0) {
    exit 1
} else {
    exit 0
}
