-- Tabla para almacenar backups en modo serverless
-- Esta tabla es global (no tiene sufijo de tenant)

CREATE TABLE IF NOT EXISTS backups_storage (
    id SERIAL PRIMARY KEY,
    filename TEXT NOT NULL,
    backup_type TEXT DEFAULT 'manual',
    tenant_slug TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    size_bytes INTEGER DEFAULT 0,
    tenants_count INTEGER DEFAULT 0,
    total_records INTEGER DEFAULT 0,
    data JSONB
);

-- Índices para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_backups_storage_tenant ON backups_storage(tenant_slug);
CREATE INDEX IF NOT EXISTS idx_backups_storage_created ON backups_storage(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backups_storage_type ON backups_storage(backup_type);

-- Comentarios
COMMENT ON TABLE backups_storage IS 'Almacena backups creados en modo serverless (Vercel)';
COMMENT ON COLUMN backups_storage.filename IS 'Nombre del archivo de backup';
COMMENT ON COLUMN backups_storage.backup_type IS 'Tipo: daily, weekly, manual';
COMMENT ON COLUMN backups_storage.tenant_slug IS 'Identificador del tenant (null para backups multi-tenant)';
COMMENT ON COLUMN backups_storage.data IS 'Datos del backup en formato JSON';
