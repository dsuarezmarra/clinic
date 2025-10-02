-- Tabla para almacenar backups
CREATE TABLE IF NOT EXISTS backups (
    id BIGSERIAL PRIMARY KEY,
    file_name TEXT NOT NULL UNIQUE,
    data JSONB NOT NULL,
    size_bytes BIGINT DEFAULT 0,
    created TIMESTAMPTZ DEFAULT NOW(),
    
    -- Índices para mejorar el rendimiento
    CONSTRAINT backups_file_name_key UNIQUE (file_name)
);

-- Índice para ordenar por fecha
CREATE INDEX IF NOT EXISTS idx_backups_created ON backups(created DESC);

-- Comentarios para documentación
COMMENT ON TABLE backups IS 'Almacena los backups manuales creados por el usuario';
COMMENT ON COLUMN backups.file_name IS 'Nombre del archivo de backup';
COMMENT ON COLUMN backups.data IS 'Datos del backup en formato JSON';
COMMENT ON COLUMN backups.size_bytes IS 'Tamaño del backup en bytes';
COMMENT ON COLUMN backups.created IS 'Fecha y hora de creación del backup';

-- Habilitar RLS (Row Level Security)
ALTER TABLE backups ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas las operaciones (sin autenticación)
CREATE POLICY "Allow all operations on backups" ON backups
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Grant permisos
GRANT ALL ON backups TO anon;
GRANT ALL ON backups TO authenticated;
GRANT ALL ON backups TO service_role;
GRANT USAGE, SELECT ON SEQUENCE backups_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE backups_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE backups_id_seq TO service_role;
