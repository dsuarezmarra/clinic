-- Tabla para almacenar backups en modo serverless
-- Esta tabla es global (no tiene sufijo de tenant)

create table if not exists backups_storage (
   id            serial primary key,
   filename      text not null,
   backup_type   text default 'manual',
   tenant_slug   text,
   created_at    timestamptz default now(),
   size_bytes    integer default 0,
   tenants_count integer default 0,
   total_records integer default 0,
   data          jsonb
);

-- Índices para búsquedas eficientes
create index if not exists idx_backups_storage_tenant on
   backups_storage (
      tenant_slug
   );
create index if not exists idx_backups_storage_created on
   backups_storage (
      created_at
   desc );
create index if not exists idx_backups_storage_type on
   backups_storage (
      backup_type
   );

-- Comentarios
comment on table backups_storage is
   'Almacena backups creados en modo serverless (Vercel)';
comment on column backups_storage.filename is
   'Nombre del archivo de backup';
comment on column backups_storage.backup_type is
   'Tipo: daily, weekly, manual';
comment on column backups_storage.tenant_slug is
   'Identificador del tenant (null para backups multi-tenant)';
comment on column backups_storage.data is
   'Datos del backup en formato JSON';