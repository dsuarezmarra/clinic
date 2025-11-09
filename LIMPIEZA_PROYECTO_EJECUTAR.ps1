# 🧹 SCRIPT DE LIMPIEZA AUTOMÁTICA DEL PROYECTO
# Fecha: 09 de noviembre de 2025
# Ejecutar con: .\LIMPIEZA_PROYECTO_EJECUTAR.ps1 -DryRun (para simular)
#               .\LIMPIEZA_PROYECTO_EJECUTAR.ps1 (para ejecutar)

param(
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Continue"
$rootPath = "c:\git\clinic"

Write-Host "🧹 LIMPIEZA DEL PROYECTO CLINIC" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

if ($DryRun) {
    Write-Host "⚠️  MODO DRY-RUN: Solo se mostrarán las acciones sin ejecutarlas" -ForegroundColor Yellow
    Write-Host ""
}

# Función para eliminar archivo
function Remove-FileItem {
    param([string]$Path)
    if (Test-Path $Path) {
        if ($DryRun) {
            Write-Host "  [DRY-RUN] Eliminaría: $Path" -ForegroundColor Gray
        } else {
            Remove-Item $Path -Force -ErrorAction SilentlyContinue
            if (-not (Test-Path $Path)) {
                Write-Host "  ✅ Eliminado: $Path" -ForegroundColor Green
            } else {
                Write-Host "  ❌ Error al eliminar: $Path" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "  ⚠️  No existe: $Path" -ForegroundColor DarkGray
    }
}

# Función para eliminar carpeta
function Remove-FolderItem {
    param([string]$Path)
    if (Test-Path $Path) {
        if ($DryRun) {
            Write-Host "  [DRY-RUN] Eliminaría carpeta: $Path" -ForegroundColor Gray
        } else {
            Remove-Item $Path -Recurse -Force -ErrorAction SilentlyContinue
            if (-not (Test-Path $Path)) {
                Write-Host "  ✅ Carpeta eliminada: $Path" -ForegroundColor Green
            } else {
                Write-Host "  ❌ Error al eliminar carpeta: $Path" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "  ⚠️  No existe: $Path" -ForegroundColor DarkGray
    }
}

# ============================================
# 1️⃣ ELIMINAR CARPETAS COMPLETAS
# ============================================
Write-Host "1️⃣  ELIMINANDO CARPETAS OBSOLETAS..." -ForegroundColor Cyan
Remove-FolderItem "$rootPath\actifisio-deploy"
Remove-FolderItem "$rootPath\DISTRIBUCION"
Remove-FolderItem "$rootPath\node_modules"
Write-Host ""

# ============================================
# 2️⃣ ELIMINAR SCRIPTS POWERSHELL (RAÍZ)
# ============================================
Write-Host "2️⃣  ELIMINANDO SCRIPTS POWERSHELL OBSOLETOS..." -ForegroundColor Cyan
Remove-FileItem "$rootPath\DEPLOY_ACTIFISIO.ps1"
Remove-FileItem "$rootPath\DEPLOY_ACTIFISIO_VERCEL.ps1"
Remove-FileItem "$rootPath\DEPLOY_MASAJE_CORPORAL.ps1"
Remove-FileItem "$rootPath\DEPLOY_V2.4.4_MOVIL.ps1"
Remove-FileItem "$rootPath\FIX_ACTIFISIO_ENV.ps1"
Remove-FileItem "$rootPath\REDEPLOY_BACKEND.ps1"
Write-Host ""

# ============================================
# 3️⃣ ELIMINAR DOCUMENTACIÓN OBSOLETA
# ============================================
Write-Host "3️⃣  ELIMINANDO DOCUMENTACIÓN OBSOLETA..." -ForegroundColor Cyan

# Deployment (15 archivos)
Write-Host "  📋 Deployment..." -ForegroundColor Yellow
$deploymentFiles = @(
    "DEPLOYMENT_ACTIFISIO_EXITOSO.md",
    "DEPLOYMENT_ACTIFISIO_EXITOSO_FINAL.md",
    "DEPLOYMENT_ACTIFISIO_URLS_FINALES.md",
    "DEPLOYMENT_ACTIFISIO_V2.4.11_COMPLETO.md",
    "DEPLOYMENT_MULTI_TENANT_FINAL.md",
    "DEPLOY_CHECKLIST.md",
    "DEPLOY_VERCEL.md",
    "DEPLOY_VERCEL_ACTIFISIO.md",
    "DEPLOY_VERCEL_WEB.md",
    "DESPLIEGUE_COMPLETADO.md",
    "DESPLIEGUE_EXITOSO_FINAL.md",
    "DESPLIEGUE_V2.4.0_FINAL.md",
    "LISTO_PARA_VERCEL.md",
    "LIMPIEZA_VERCEL_COMPLETADA.md",
    "RESUMEN_DEPLOYMENT.md"
)
foreach ($file in $deploymentFiles) {
    Remove-FileItem "$rootPath\$file"
}

# Correcciones (15 archivos)
Write-Host "  📋 Correcciones..." -ForegroundColor Yellow
$correctionFiles = @(
    "CORRECCION_BACKUPS.md",
    "CORRECCION_BACKUPS_RAPIDO.md",
    "CORRECCION_BOTONES_COMPLETA_V2.4.12.md",
    "CORRECCION_CHECKBOX_PAGO_V2.4.5.md",
    "CORRECCION_CITAS_DUPLICADAS_V2.4.6.md",
    "CORRECCION_CITAS_DUPLICADAS_V2.4.7_FINAL.md",
    "CORRECCION_CSV_COLORES_V2.4.12.md",
    "CORRECCION_CSV_FINAL_V2.4.2.md",
    "CORRECCION_CSV_X_TENANT_SLUG.md",
    "CORRECCION_DOBLES_MENSAJES_V2.4.8.md",
    "CORRECCION_DOBLES_MENSAJES_V2.4.9_FINAL.md",
    "CORRECCION_FILES_CSV_FINAL.md",
    "CORRECCION_FOREIGN_KEYS_COMILLAS.md",
    "CORRECCION_LOGOS_DINAMICOS_V2.4.11.md",
    "CORRECCION_X_TENANT_SLUG_V2.4.13.md"
)
foreach ($file in $correctionFiles) {
    Remove-FileItem "$rootPath\$file"
}

# Diagnósticos (3 archivos)
Write-Host "  📋 Diagnósticos..." -ForegroundColor Yellow
$diagnosticFiles = @(
    "DIAGNOSTICO_API_404_ACTIFISIO.md",
    "DIAGNOSTICO_CARGA_ACTIFISIO.md",
    "DIAGNOSTICO_VARIABLES_ENTORNO.md"
)
foreach ($file in $diagnosticFiles) {
    Remove-FileItem "$rootPath\$file"
}

# Soluciones (12 archivos)
Write-Host "  📋 Soluciones..." -ForegroundColor Yellow
$solutionFiles = @(
    "SOLUCION_BASE_DATOS_VACIA.md",
    "SOLUCION_CACHE_ACTIFISIO.md",
    "SOLUCION_COMPLETA_ACTIFISIO.md",
    "SOLUCION_ELIMINAR_CLINIC.md",
    "SOLUCION_ERROR_FK.md",
    "SOLUCION_ERROR_SSL.md",
    "SOLUCION_LOCALHOST_VS_PRODUCCION.md",
    "SOLUCION_LOGIN_VERCEL_ACTIFISIO.md",
    "SOLUCION_PERMISOS_SERVICE_ROLE.md",
    "SOLUCION_PROYECTOS_SEPARADOS.md",
    "SOLUCION_TEMPORAL_MIDDLEWARE.md",
    "SOLUCION_URGENTE_TABLA_TENANTS.md"
)
foreach ($file in $solutionFiles) {
    Remove-FileItem "$rootPath\$file"
}

# Problemas (3 archivos)
Write-Host "  📋 Problemas..." -ForegroundColor Yellow
$problemFiles = @(
    "PROBLEMA_BACKEND_PUERTO.md",
    "PROBLEMA_RESUELTO.md",
    "PROBLEMA_RESUELTO_SDK_SUPABASE.md"
)
foreach ($file in $problemFiles) {
    Remove-FileItem "$rootPath\$file"
}

# Fixes (3 archivos)
Write-Host "  📋 Fixes..." -ForegroundColor Yellow
$fixFiles = @(
    "FIX_ACTIFISIO_URGENTE.md",
    "FIX_MASAJE_CORPORAL_DEPLOYMENT.md",
    "FIX_VERCEL_ROUTING.md"
)
foreach ($file in $fixFiles) {
    Remove-FileItem "$rootPath\$file"
}

# Verificaciones (4 archivos)
Write-Host "  📋 Verificaciones..." -ForegroundColor Yellow
$verificationFiles = @(
    "VERIFICACION_ACTIFISIO.md",
    "VERIFICACION_ACTIFISIO_COMPLETA.md",
    "VERIFICAR_DATOS_DIRECTOS.md",
    "TENANTS_VERIFICADOS.md"
)
foreach ($file in $verificationFiles) {
    Remove-FileItem "$rootPath\$file"
}

# URLs (4 archivos)
Write-Host "  📋 URLs..." -ForegroundColor Yellow
$urlFiles = @(
    "URLS_CLIENTES_ESTATICAS.md",
    "URLS_FINALES.md",
    "URLS_FINALES_ACTUALIZADAS.md",
    "URLS_PERMANENTES_SOLUCION_FINAL.md"
)
foreach ($file in $urlFiles) {
    Remove-FileItem "$rootPath\$file"
}

# Actualizaciones (2 archivos)
Write-Host "  📋 Actualizaciones..." -ForegroundColor Yellow
Remove-FileItem "$rootPath\ACTUALIZACION_CLIENTE_ACTIFISIO.md"
Remove-FileItem "$rootPath\ACTUALIZACION_COMPLETADA_V3.md"

# Auditorías (2 archivos)
Write-Host "  📋 Auditorías..." -ForegroundColor Yellow
Remove-FileItem "$rootPath\AUDITORIA_MULTITENANT.md"
Remove-FileItem "$rootPath\AUDITORIA_PROYECTOS_VERCEL.md"

# Varios (10 archivos)
Write-Host "  📋 Varios..." -ForegroundColor Yellow
$miscFiles = @(
    "ARQUITECTURA_CORRECTA_FINAL.md",
    "DESACTIVAR_PROTECCION_VERCEL.md",
    "DESACTIVAR_RLS.md",
    "ENCONTRAR_SERVICE_KEY.md",
    "CORREGIR_SERVICE_KEY.md",
    "ESTADO_ACTUAL.md",
    "ESTADO_MULTITENANT_02OCT.md",
    "INSTRUCCIONES_CREAR_TABLAS.md",
    "REFACTORIZACION_CONFIG.md",
    "RESTAURACION_BACKUPS_COMPLETADO.md",
    "VISUAL_DEPLOYMENT.md",
    "SCRIPT_SQL_ACTIFISIO.md"
)
foreach ($file in $miscFiles) {
    Remove-FileItem "$rootPath\$file"
}

Write-Host ""

# ============================================
# 4️⃣ MOVER ARCHIVOS HISTÓRICOS
# ============================================
Write-Host "4️⃣  MOVIENDO ARCHIVOS HISTÓRICOS..." -ForegroundColor Cyan

if (-not $DryRun) {
    # Crear carpetas históricas
    New-Item -Path "$rootPath\docs\historico\fases" -ItemType Directory -Force | Out-Null
    New-Item -Path "$rootPath\docs\historico\sql" -ItemType Directory -Force | Out-Null
}

# Mover FASEs
Write-Host "  📂 Moviendo FASES..." -ForegroundColor Yellow
$faseFiles = @("FASE1_COMPLETADA.md", "FASE2_COMPLETADA.md", "FASE3_COMPLETADA.md", 
               "FASE4_COMPLETADA.md", "FASE5_COMPLETADA.md")
foreach ($file in $faseFiles) {
    if (Test-Path "$rootPath\$file") {
        if ($DryRun) {
            Write-Host "  [DRY-RUN] Movería: $file a docs\historico\fases\" -ForegroundColor Gray
        } else {
            Move-Item "$rootPath\$file" "$rootPath\docs\historico\fases\" -Force
            Write-Host "  ✅ Movido: $file" -ForegroundColor Green
        }
    }
}

# Mover SQLs
Write-Host "  📂 Moviendo SQLs ejecutados..." -ForegroundColor Yellow
$sqlFiles = @("AGREGAR_FOREIGN_KEYS_ACTIFISIO.sql", "CREAR_TENANT_ACTIFISIO.sql", 
              "VERIFICAR_COLUMNAS_ACTIFISIO.sql")
foreach ($file in $sqlFiles) {
    if (Test-Path "$rootPath\$file") {
        if ($DryRun) {
            Write-Host "  [DRY-RUN] Movería: $file a docs\historico\sql\" -ForegroundColor Gray
        } else {
            Move-Item "$rootPath\$file" "$rootPath\docs\historico\sql\" -Force
            Write-Host "  ✅ Movido: $file" -ForegroundColor Green
        }
    }
}

Write-Host ""

# ============================================
# 5️⃣ ELIMINAR SCRIPTS DUPLICADOS
# ============================================
Write-Host "5️⃣  ELIMINANDO SCRIPTS DUPLICADOS..." -ForegroundColor Cyan
Remove-FileItem "$rootPath\scripts\deploy-vercel.ps1"
Remove-FileItem "$rootPath\scripts\deploy-vercel-fixed.ps1"
Remove-FileItem "$rootPath\scripts\deploy-to-vercel.ps1"
Remove-FileItem "$rootPath\scripts\deploy-vercel.sh"
Remove-FileItem "$rootPath\scripts\build-client.ps1"
Remove-FileItem "$rootPath\frontend\build-client.ps1"
Write-Host ""

# ============================================
# 6️⃣ ELIMINAR CHECKLIST OBSOLETO EN DOCS
# ============================================
Write-Host "6️⃣  ELIMINANDO CHECKLIST OBSOLETO EN DOCS..." -ForegroundColor Cyan
Remove-FileItem "$rootPath\docs\implementacion-clientes\CHECKLIST_NUEVO_CLIENTE_RAPIDO.md"
Remove-FileItem "$rootPath\docs\implementacion-clientes\CHECKLIST_NUEVO_CLIENTE_V2.md"
Write-Host ""

# ============================================
# 7️⃣ ELIMINAR CÓDIGO OBSOLETO FRONTEND
# ============================================
Write-Host "7️⃣  ELIMINANDO CÓDIGO OBSOLETO EN FRONTEND..." -ForegroundColor Cyan
Remove-FileItem "$rootPath\frontend\src\app\app.component.clean.ts"
Remove-FileItem "$rootPath\frontend\src\app\app.component.clean.scss"
Remove-FileItem "$rootPath\frontend\src\app\app.component.new.html"
Remove-FileItem "$rootPath\frontend\src\app\app.component.spec.ts"
Remove-FileItem "$rootPath\frontend\src\app\pages\paciente-detalle\paciente-detalle.component.new.ts"
Write-Host ""

# ============================================
# 8️⃣ ELIMINAR CÓDIGO OBSOLETO BACKEND
# ============================================
Write-Host "8️⃣  ELIMINANDO CÓDIGO OBSOLETO EN BACKEND..." -ForegroundColor Cyan
Remove-FileItem "$rootPath\backend\src\corporate-bypass.js"
Remove-FileItem "$rootPath\backend\src\sql.js"
Remove-FileItem "$rootPath\backend\src\routes\bridge.js.backup"
Remove-FileItem "$rootPath\backend\src\routes\debug.js"
Remove-FileItem "$rootPath\backend\src\routes\test-direct.js"
Write-Host ""

# ============================================
# 7️⃣ RESUMEN
# ============================================
Write-Host ""
Write-Host "✅ LIMPIEZA COMPLETADA" -ForegroundColor Green
Write-Host "=====================" -ForegroundColor Green
Write-Host ""

if ($DryRun) {
    Write-Host "⚠️  Esto fue una simulación. Para ejecutar realmente:" -ForegroundColor Yellow
    Write-Host "   .\LIMPIEZA_PROYECTO_EJECUTAR.ps1" -ForegroundColor White
} else {
    Write-Host "📊 Archivos eliminados:" -ForegroundColor Cyan
    Write-Host "   • Carpetas: 3" -ForegroundColor White
    Write-Host "   • Scripts .ps1: 11" -ForegroundColor White
    Write-Host "   • Documentos .md: ~90" -ForegroundColor White
    Write-Host "   • Código obsoleto frontend: 5 archivos" -ForegroundColor White
    Write-Host "   • Código obsoleto backend: 5 archivos" -ForegroundColor White
    Write-Host "   • Archivos históricos movidos: 8" -ForegroundColor White
    Write-Host ""
    Write-Host "🎯 PRÓXIMOS PASOS:" -ForegroundColor Cyan
    Write-Host "   1. Revisar cambios: git status" -ForegroundColor White
    Write-Host "   2. Limpiar package.json root (eliminar Electron)" -ForegroundColor White
    Write-Host "   3. Ejecutar tests: .\scripts\test-multicliente.ps1" -ForegroundColor White
    Write-Host "   4. Commit: git add -A && git commit -m chore: limpieza masiva" -ForegroundColor White
}

Write-Host ""
