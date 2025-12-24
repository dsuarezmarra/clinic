# Script para corregir problemas de encoding en archivos del proyecto
# Reemplaza caracteres mal codificados

param(
    [switch]$DryRun = $false,
    [string]$SearchDir = "c:\git\clinic"
)

Write-Host "======================================"
Write-Host "  CORRECCION DE ENCODING UTF-8"
Write-Host "======================================"
Write-Host ""

if ($DryRun) {
    Write-Host "MODO DRY-RUN: No se modificaran archivos"
    Write-Host ""
}

# Reemplazos de palabras/frases completas con tildes
$wordReplacements = @{
    # Palabras con o con tilde
    "localizaci" + [char]0xFFFD + "n" = "localizacion"
    "informaci" + [char]0xFFFD + "n" = "informacion"  
    "configuraci" + [char]0xFFFD + "n" = "configuracion"
    "confirmaci" + [char]0xFFFD + "n" = "confirmacion"
    "sesi" + [char]0xFFFD + "n" = "sesion"
    "Sesi" + [char]0xFFFD + "n" = "Sesion"
    "duraci" + [char]0xFFFD + "n" = "duracion"
    "Duraci" + [char]0xFFFD + "n" = "Duracion"
    "direcci" + [char]0xFFFD + "n" = "direccion"
    "Direcci" + [char]0xFFFD + "n" = "Direccion"
    "acci" + [char]0xFFFD + "n" = "accion"
    "Acci" + [char]0xFFFD + "n" = "Accion"
    "gesti" + [char]0xFFFD + "n" = "gestion"
    "Gesti" + [char]0xFFFD + "n" = "Gestion"
    "paginaci" + [char]0xFFFD + "n" = "paginacion"
    "navegaci" + [char]0xFFFD + "n" = "navegacion"
    "edici" + [char]0xFFFD + "n" = "edicion"
    "conexi" + [char]0xFFFD + "n" = "conexion"
    "validaci" + [char]0xFFFD + "n" = "validacion"
    "descripci" + [char]0xFFFD + "n" = "descripcion"
    "actualizaci" + [char]0xFFFD + "n" = "actualizacion"
    "transacci" + [char]0xFFFD + "n" = "transaccion"
    "funci" + [char]0xFFFD + "n" = "funcion"
    "petici" + [char]0xFFFD + "n" = "peticion"
    "notificaci" + [char]0xFFFD + "n" = "notificacion"
    "separaci" + [char]0xFFFD + "n" = "separacion"
    "comprensi" + [char]0xFFFD + "n" = "comprension"
    "categor" + [char]0xFFFD + "a" = "categoria"
    
    # Palabras con a con tilde
    "est" + [char]0xFFFD = "esta"
    "Est" + [char]0xFFFD = "Esta"
    "p" + [char]0xFFFD + "gina" = "pagina"
    "m" + [char]0xFFFD + "s" = "mas"
    "ser" + [char]0xFFFD = "sera"
    
    # Palabras con e con tilde
    "tel" + [char]0xFFFD + "fono" = "telefono"
    "Tel" + [char]0xFFFD + "fono" = "Telefono"
    "cr" + [char]0xFFFD + "ditos" = "creditos"
    "Cr" + [char]0xFFFD + "ditos" = "Creditos"
    "m" + [char]0xFFFD + "todo" = "metodo"
    "M" + [char]0xFFFD + "todo" = "Metodo"
    "despu" + [char]0xFFFD + "s" = "despues"
    "tambi" + [char]0xFFFD + "n" = "tambien"
    
    # Palabras con i con tilde
    "estad" + [char]0xFFFD + "sticas" = "estadisticas"
    "Estad" + [char]0xFFFD + "sticas" = "Estadisticas"
    "cl" + [char]0xFFFD + "nica" = "clinica"
    "Cl" + [char]0xFFFD + "nica" = "Clinica"
    "M" + [char]0xFFFD + "rcoles" = "Miercoles"
    "Mi" + [char]0xFFFD = "Mie"
    "t" + [char]0xFFFD + "tulo" = "titulo"
    "f" + [char]0xFFFD + "sica" = "fisica"
    "b" + [char]0xFFFD + "squeda" = "busqueda"
    "B" + [char]0xFFFD + "squeda" = "Busqueda"
    "v" + [char]0xFFFD + "lido" = "valido"
    "inv" + [char]0xFFFD + "lido" = "invalido"
    "autom" + [char]0xFFFD + "tico" = "automatico"
    "Autom" + [char]0xFFFD + "tico" = "Automatico"
    "autom" + [char]0xFFFD + "tica" = "automatica"
    "d" + [char]0xFFFD + "a" = "dia"
    "D" + [char]0xFFFD + "a" = "Dia"
    "d" + [char]0xFFFD + "as" = "dias"
    "Anal" + [char]0xFFFD + "tica" = "Analitica"
    "anal" + [char]0xFFFD + "tica" = "analitica"
    "Ecograf" + [char]0xFFFD + "a" = "Ecografia"
    "ecograf" + [char]0xFFFD + "a" = "ecografia"
    "Radiograf" + [char]0xFFFD + "a" = "Radiografia"
    "radiograf" + [char]0xFFFD + "a" = "radiografia"
    "M" + [char]0xFFFD + "dico" = "Medico"
    "m" + [char]0xFFFD + "dico" = "medico"
    "espec" + [char]0xFFFD + "fico" = "especifico"
    "espec" + [char]0xFFFD + "fica" = "especifica"
    
    # Palabras con u con tilde
    "n" + [char]0xFFFD + "mero" = "numero"
    "N" + [char]0xFFFD + "mero" = "Numero"
    [char]0xFFFD + "nico" = "unico"
    [char]0xFFFD + "ltimo" = "ultimo"
    [char]0xFFFD + "ltima" = "ultima"
    "seg" + [char]0xFFFD + "n" = "segun"
    "ning" + [char]0xFFFD + "n" = "ningun"
    "m" + [char]0xFFFD + "ltiples" = "multiples"
    
    # Palabras con enie
    "a" + [char]0xFFFD + "os" = "anos"
    "a" + [char]0xFFFD + "o" = "ano"
    "A" + [char]0xFFFD + "adir" = "Anadir"
    "pesta" + [char]0xFFFD + "a" = "pestana"
    "pesta" + [char]0xFFFD + "as" = "pestanas"
    "tama" + [char]0xFFFD + "o" = "tamano"
    "Tama" + [char]0xFFFD + "o" = "Tamano"
    "espa" + [char]0xFFFD + "ol" = "espanol"
    "dise" + [char]0xFFFD + "o" = "diseno"
    "ma" + [char]0xFFFD + "ana" = "manana"
    "S" + [char]0xFFFD + "bado" = "Sabado"
    "S" + [char]0xFFFD + "b" = "Sab"
    
    # Signos de interrogacion/exclamacion
    [char]0xFFFD + "Est" = "?Est"
    [char]0xFFFD + "Desea" = "?Desea"
    [char]0xFFFD + "Seguro" = "?Seguro"
    
    # Eliminar caracteres de reemplazo sueltos al final de la revision
}

# Directorios a procesar
$directories = @(
    "c:\git\clinic\frontend\src",
    "c:\git\clinic\backend\src"
)

# Extensiones de archivo a procesar
$extensions = @("*.ts", "*.html", "*.js", "*.scss", "*.css")

$totalFiles = 0
$modifiedFiles = 0
$totalReplacements = 0

foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        Write-Host "Directorio no encontrado: $dir"
        continue
    }

    foreach ($ext in $extensions) {
        $files = Get-ChildItem -Path $dir -Filter $ext -Recurse -File
        
        foreach ($file in $files) {
            $totalFiles++
            
            try {
                $content = [System.IO.File]::ReadAllText($file.FullName)
                $originalContent = $content
                $fileReplacements = 0
                
                foreach ($p in $patterns) {
                    $count = ([regex]::Matches($content, [regex]::Escape($p.Old))).Count
                    if ($count -gt 0) {
                        $content = $content.Replace($p.Old, $p.New)
                        $fileReplacements += $count
                    }
                }
                
                if ($content -ne $originalContent) {
                    $modifiedFiles++
                    $totalReplacements += $fileReplacements
                    $relativePath = $file.FullName.Replace("c:\git\clinic\", "")
                    
                    Write-Host "Archivo: $relativePath - $fileReplacements reemplazos"
                    
                    if (-not $DryRun) {
                        $utf8NoBom = New-Object System.Text.UTF8Encoding $false
                        [System.IO.File]::WriteAllText($file.FullName, $content, $utf8NoBom)
                    }
                }
            }
            catch {
                Write-Host "Error procesando: $($file.FullName)"
            }
        }
    }
}

Write-Host ""
Write-Host "======================================"
Write-Host "  RESUMEN"
Write-Host "======================================"
Write-Host "Archivos analizados: $totalFiles"
Write-Host "Archivos modificados: $modifiedFiles"
Write-Host "Total de reemplazos: $totalReplacements"

if ($DryRun) {
    Write-Host ""
    Write-Host "Ejecuta sin -DryRun para aplicar los cambios"
}

Write-Host ""
Write-Host "Proceso completado"
