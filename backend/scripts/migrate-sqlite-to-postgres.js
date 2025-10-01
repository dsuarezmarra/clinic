#!/usr/bin/env node
/*
  LEGACY: migrate-sqlite-to-postgres.js

  Este script formaba parte del flujo antiguo que migraba datos desde un
  SQLite local (prisma) hacia Postgres. El repositorio actual elimina
  dependencias Prisma/SQLite y utiliza Supabase/Postgres.

  Si necesitas ejecutar una migración desde una copia antigua de clinic.db,
  restaura temporalmente las dependencias @prisma/client y sqlite3 en
  backend/package.json y revisa el historial de este archivo para recuperar
  la versión completa.
*/

console.log('migrate-sqlite-to-postgres.js es LEGACY. Consulte backend/README.md para instrucciones.');
process.exit(0);
