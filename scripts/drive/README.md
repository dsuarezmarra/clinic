Drive sync scripts
===================

Estos scripts ayudan a sincronizar la base de datos SQLite (`clinic.db`) con Google Drive usando `rclone`.

Requisitos
---------
- rclone (https://rclone.org/) configurado con un remote llamado `drive` (o cambiad el parámetro `-RemoteRoot`).
- sqlite3 CLI (opcional, para verificar integridad con `PRAGMA integrity_check;`).
- gpg (opcional) si quieres cifrar backups.

Important security note
-----------------------
- DO NOT place your real service-account JSON inside the repository or commit it to git.
- A placeholder `drive-sa-placeholder.json` is included for developer convenience; replace it locally with your real JSON file outside version control and point the scripts to that path.

Scripts
------
- `backup-and-upload.ps1`: crea una copia timestamped de la BD local, ejecuta `PRAGMA integrity_check` (si sqlite3 está disponible), sube el fichero al remote y actualiza una copia `clinic-latest.db` en el remoto. También aplica retención.
- `restore-latest.ps1`: descarga la última copia (`clinic-latest.db` si existe, si no busca el último `clinic-db-*.db`), verifica integridad y reemplaza la BD local realizando un backup previo.

Flujo recomendado
-----------------
1. Antes de abrir la aplicación en otro dispositivo: ejecutar `restore-latest.ps1` para traer la última copia y verificarla.
2. Trabajar en la aplicación en local (arrancar backend, etc.).
3. Cuando termines de trabajar: parar el backend y ejecutar `backup-and-upload.ps1` para subir los cambios y actualizar `clinic-latest.db`.

Notas de seguridad
------------------
- Nunca edites la DB directamente dentro de la carpeta sincronizada de Drive.
- Considera cifrar los backups con GPG si contienen datos sensibles.
- Los scripts usan un lock remoto básico (`clinic.lock`) para evitar conflictos; ajusta su política de tiempos si necesitas otro comportamiento.

Ejemplo rápido
--------------
Configurar rclone (una vez):

```powershell
rclone config
# crear remote llamado 'drive' apuntando a Google Drive
```

Subir backup manualmente:
```powershell
.
\scripts\drive\backup-and-upload.ps1 -StopBackend
```

Restaurar en otro dispositivo:
```powershell
.
\scripts\drive\restore-latest.ps1 -StopBackend
```

Personalizaciones
------------------
- Puedes ajustar `-Keep` para retención en `backup-and-upload.ps1`.
- El lock remoto es simple; para flujos más seguros se podría implementar comprobación adicional o usar una small API para coordinar locks.

Task Scheduler (Windows) ejemplo
-------------------------------
1. Abrir "Task Scheduler".
2. Crear tarea básica que ejecute `powershell.exe` con argumentos:

```text
-ExecutionPolicy Bypass -File "C:\ruta\a\tu\repo\scripts\drive\backup-and-upload.ps1" -StopBackend
```

3. Programar la tarea a la frecuencia deseada (p. ej. cada 6 horas).

Nota: marca la tarea como "Run whether user is logged on or not" si quieres que corra en background.

Ejemplo de uso diario
--------------------
- Al finalizar tu trabajo en el PC, ejecuta: `.
	\scripts\drive\backup-and-upload.ps1 -StopBackend`
- Antes de empezar en otro dispositivo, ejecuta: `.
	\scripts\drive\restore-latest.ps1 -StopBackend`

Nota: anteriormente se añadieron scripts de ayuda para trabajar con Google Drive; si los eliminaste o no los deseas, ignora esa sección.
