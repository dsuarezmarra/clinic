Este directorio contiene SQL de mantenimiento para la base de datos.

add_defaults.sql

- Añade DEFAULTs recomendados para columnas `id` (gen_random_uuid()) y
  timestamps (`createdAt`, `updatedAt`) en las tablas principales.

Cómo aplicar

- Usando psql:

```powershell
# En tu máquina (Windows PowerShell)
psql "postgresql://USER:PASSWORD@HOST:PORT/DATABASE" -f backend/db/sql/add_defaults.sql
```

- Usando el SQL editor de Supabase:
  1. Abre tu proyecto en app.supabase.com
  2. Ve a Database -> SQL Editor
  3. Pega el contenido de `backend/db/sql/add_defaults.sql` y ejecútalo

Precauciones

- Asegúrate de que la extensión `pgcrypto` está permitida en tu proyecto Supabase.
- Revisa el schema real (nombres de columnas) antes de ejecutar en producción.

\*\*\* Fin
