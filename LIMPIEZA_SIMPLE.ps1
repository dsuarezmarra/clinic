# Script de limpieza simplificado
$ErrorActionPreference = "Continue"
$rootPath = "C:\git\clinic"

Write-Host "=== LIMPIEZA DEL PROYECTO CLINIC ===" -ForegroundColor Cyan

# 1. ELIMINAR CARPETAS
Write-Host "`n1. Eliminando carpetas obsoletas..." -ForegroundColor Yellow
Remove-Item "$rootPath\actifisio-deploy" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "$rootPath\DISTRIBUCION" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "$rootPath\node_modules" -Recurse -Force -ErrorAction SilentlyContinue

# 2. ELIMINAR SCRIPTS PS1 EN RAIZ
Write-Host "2. Eliminando scripts PowerShell obsoletos..." -ForegroundColor Yellow
Remove-Item "$rootPath\DEPLOY_ACTIFISIO.ps1" -Force -ErrorAction SilentlyContinue
Remove-Item "$rootPath\DEPLOY_ACTIFISIO_VERCEL.ps1" -Force -ErrorAction SilentlyContinue
Remove-Item "$rootPath\DEPLOY_MASAJE_CORPORAL.ps1" -Force -ErrorAction SilentlyContinue
Remove-Item "$rootPath\DEPLOY_V2.4.4_MOVIL.ps1" -Force -ErrorAction SilentlyContinue
Remove-Item "$rootPath\FIX_ACTIFISIO_ENV.ps1" -Force -ErrorAction SilentlyContinue
Remove-Item "$rootPath\REDEPLOY_BACKEND.ps1" -Force -ErrorAction SilentlyContinue

# 3. CREAR CARPETAS HISTORICAS
Write-Host "3. Creando carpetas historicas..." -ForegroundColor Yellow
New-Item -Path "$rootPath\docs\historico\fases" -ItemType Directory -Force | Out-Null
New-Item -Path "$rootPath\docs\historico\sql" -ItemType Directory -Force | Out-Null

# 4. MOVER FASES
Write-Host "4. Moviendo archivos FASE..." -ForegroundColor Yellow
Move-Item "$rootPath\FASE1_COMPLETADA.md" "$rootPath\docs\historico\fases\" -Force -ErrorAction SilentlyContinue
Move-Item "$rootPath\FASE2_COMPLETADA.md" "$rootPath\docs\historico\fases\" -Force -ErrorAction SilentlyContinue
Move-Item "$rootPath\FASE3_COMPLETADA.md" "$rootPath\docs\historico\fases\" -Force -ErrorAction SilentlyContinue
Move-Item "$rootPath\FASE4_COMPLETADA.md" "$rootPath\docs\historico\fases\" -Force -ErrorAction SilentlyContinue
Move-Item "$rootPath\FASE5_COMPLETADA.md" "$rootPath\docs\historico\fases\" -Force -ErrorAction SilentlyContinue

# 5. MOVER SQLs
Write-Host "5. Moviendo archivos SQL..." -ForegroundColor Yellow
Move-Item "$rootPath\AGREGAR_FOREIGN_KEYS_ACTIFISIO.sql" "$rootPath\docs\historico\sql\" -Force -ErrorAction SilentlyContinue
Move-Item "$rootPath\CREAR_TENANT_ACTIFISIO.sql" "$rootPath\docs\historico\sql\" -Force -ErrorAction SilentlyContinue
Move-Item "$rootPath\VERIFICAR_COLUMNAS_ACTIFISIO.sql" "$rootPath\docs\historico\sql\" -Force -ErrorAction SilentlyContinue

# 6. ELIMINAR DOCUMENTACION DEPLOYMENT
Write-Host "6. Eliminando documentacion Deployment..." -ForegroundColor Yellow
$deployDocs = @(
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
foreach ($file in $deployDocs) {
    Remove-Item "$rootPath\$file" -Force -ErrorAction SilentlyContinue
}

# 7. ELIMINAR DOCUMENTACION CORRECCIONES
Write-Host "7. Eliminando documentacion Correcciones..." -ForegroundColor Yellow
$correctionDocs = @(
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
foreach ($file in $correctionDocs) {
    Remove-Item "$rootPath\$file" -Force -ErrorAction SilentlyContinue
}

# 8. ELIMINAR DOCUMENTACION DIAGNOSTICOS
Write-Host "8. Eliminando documentacion Diagnosticos..." -ForegroundColor Yellow
Remove-Item "$rootPath\DIAGNOSTICO_API_404_ACTIFISIO.md" -Force -ErrorAction SilentlyContinue
Remove-Item "$rootPath\DIAGNOSTICO_CARGA_ACTIFISIO.md" -Force -ErrorAction SilentlyContinue
Remove-Item "$rootPath\DIAGNOSTICO_VARIABLES_ENTORNO.md" -Force -ErrorAction SilentlyContinue

# 9. ELIMINAR DOCUMENTACION SOLUCIONES
Write-Host "9. Eliminando documentacion Soluciones..." -ForegroundColor Yellow
$solutionDocs = @(
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
foreach ($file in $solutionDocs) {
    Remove-Item "$rootPath\$file" -Force -ErrorAction SilentlyContinue
}

# 10. ELIMINAR DOCUMENTACION PROBLEMAS Y FIXES
Write-Host "10. Eliminando documentacion Problemas/Fixes..." -ForegroundColor Yellow
$problemDocs = @(
    "PROBLEMA_BACKEND_PUERTO.md",
    "PROBLEMA_RESUELTO.md",
    "PROBLEMA_RESUELTO_SDK_SUPABASE.md",
    "FIX_ACTIFISIO_URGENTE.md",
    "FIX_MASAJE_CORPORAL_DEPLOYMENT.md",
    "FIX_VERCEL_ROUTING.md"
)
foreach ($file in $problemDocs) {
    Remove-Item "$rootPath\$file" -Force -ErrorAction SilentlyContinue
}

# 11. ELIMINAR DOCUMENTACION VERIFICACIONES Y URLS
Write-Host "11. Eliminando documentacion Verificaciones/URLs..." -ForegroundColor Yellow
$verificationDocs = @(
    "VERIFICACION_ACTIFISIO.md",
    "VERIFICACION_ACTIFISIO_COMPLETA.md",
    "VERIFICAR_DATOS_DIRECTOS.md",
    "TENANTS_VERIFICADOS.md",
    "URLS_CLIENTES_ESTATICAS.md",
    "URLS_FINALES.md",
    "URLS_FINALES_ACTUALIZADAS.md",
    "URLS_PERMANENTES_SOLUCION_FINAL.md"
)
foreach ($file in $verificationDocs) {
    Remove-Item "$rootPath\$file" -Force -ErrorAction SilentlyContinue
}

# 12. ELIMINAR DOCUMENTACION VARIOS
Write-Host "12. Eliminando documentacion varios..." -ForegroundColor Yellow
$miscDocs = @(
    "ACTUALIZACION_CLIENTE_ACTIFISIO.md",
    "ACTUALIZACION_COMPLETADA_V3.md",
    "AUDITORIA_MULTITENANT.md",
    "AUDITORIA_PROYECTOS_VERCEL.md",
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
foreach ($file in $miscDocs) {
    Remove-Item "$rootPath\$file" -Force -ErrorAction SilentlyContinue
}

# 13. ELIMINAR SCRIPTS DUPLICADOS
Write-Host "13. Eliminando scripts duplicados..." -ForegroundColor Yellow
Remove-Item "$rootPath\scripts\deploy-vercel.ps1" -Force -ErrorAction SilentlyContinue
Remove-Item "$rootPath\scripts\deploy-vercel-fixed.ps1" -Force -ErrorAction SilentlyContinue
Remove-Item "$rootPath\scripts\deploy-to-vercel.ps1" -Force -ErrorAction SilentlyContinue
Remove-Item "$rootPath\scripts\deploy-vercel.sh" -Force -ErrorAction SilentlyContinue
Remove-Item "$rootPath\scripts\build-client.ps1" -Force -ErrorAction SilentlyContinue
Remove-Item "$rootPath\frontend\build-client.ps1" -Force -ErrorAction SilentlyContinue

# 14. ELIMINAR CHECKLISTS OBSOLETOS
Write-Host "14. Eliminando checklists obsoletos..." -ForegroundColor Yellow
Remove-Item "$rootPath\docs\implementacion-clientes\CHECKLIST_NUEVO_CLIENTE_RAPIDO.md" -Force -ErrorAction SilentlyContinue
Remove-Item "$rootPath\docs\implementacion-clientes\CHECKLIST_NUEVO_CLIENTE_V2.md" -Force -ErrorAction SilentlyContinue

# 15. ELIMINAR CODIGO OBSOLETO FRONTEND
Write-Host "15. Eliminando codigo obsoleto frontend..." -ForegroundColor Yellow
Remove-Item "$rootPath\frontend\src\app\app.component.clean.ts" -Force -ErrorAction SilentlyContinue
Remove-Item "$rootPath\frontend\src\app\app.component.clean.scss" -Force -ErrorAction SilentlyContinue
Remove-Item "$rootPath\frontend\src\app\app.component.new.html" -Force -ErrorAction SilentlyContinue
Remove-Item "$rootPath\frontend\src\app\app.component.spec.ts" -Force -ErrorAction SilentlyContinue
Remove-Item "$rootPath\frontend\src\app\pages\paciente-detalle\paciente-detalle.component.new.ts" -Force -ErrorAction SilentlyContinue

# 16. ELIMINAR CODIGO OBSOLETO BACKEND
Write-Host "16. Eliminando codigo obsoleto backend..." -ForegroundColor Yellow
Remove-Item "$rootPath\backend\src\corporate-bypass.js" -Force -ErrorAction SilentlyContinue
Remove-Item "$rootPath\backend\src\sql.js" -Force -ErrorAction SilentlyContinue
Remove-Item "$rootPath\backend\src\routes\bridge.js.backup" -Force -ErrorAction SilentlyContinue
Remove-Item "$rootPath\backend\src\routes\debug.js" -Force -ErrorAction SilentlyContinue
Remove-Item "$rootPath\backend\src\routes\test-direct.js" -Force -ErrorAction SilentlyContinue

Write-Host "`n=== LIMPIEZA COMPLETADA ===" -ForegroundColor Green
Write-Host "`nArchivos eliminados:" -ForegroundColor Cyan
Write-Host "  - Carpetas: 3" -ForegroundColor White
Write-Host "  - Scripts .ps1: 11" -ForegroundColor White
Write-Host "  - Documentos .md: ~90" -ForegroundColor White
Write-Host "  - Codigo frontend: 5" -ForegroundColor White
Write-Host "  - Codigo backend: 5" -ForegroundColor White
Write-Host "  - Archivos movidos: 8`n" -ForegroundColor White
