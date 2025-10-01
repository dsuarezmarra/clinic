-- Script SQL para crear tablas faltantes en Supabase
-- Ejecutar en: https://supabase.com/dashboard/project/skukyfkrwqsfnkbxedty/editor

-- ============================================================
-- 1. TABLA DE CONFIGURACIÓN
-- ============================================================

CREATE TABLE IF NOT EXISTS public.app_config (
    id SERIAL PRIMARY KEY,
    "businessName" VARCHAR(255) DEFAULT 'Clínica',
    "appointmentDuration" INTEGER DEFAULT 30,
    "workingHours" JSONB DEFAULT '{
        "monday": {"start": "09:00", "end": "18:00", "enabled": true},
        "tuesday": {"start": "09:00", "end": "18:00", "enabled": true},
        "wednesday": {"start": "09:00", "end": "18:00", "enabled": true},
        "thursday": {"start": "09:00", "end": "18:00", "enabled": true},
        "friday": {"start": "09:00", "end": "18:00", "enabled": true},
        "saturday": {"start": "09:00", "end": "14:00", "enabled": false},
        "sunday": {"start": "09:00", "end": "14:00", "enabled": false}
    }'::jsonb,
    "prices" JSONB DEFAULT '{
        "session30min": 35,
        "session60min": 60,
        "creditPack5": 150,
        "creditPack10": 280
    }'::jsonb,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar configuración por defecto si no existe
INSERT INTO public.app_config (id, "businessName", "appointmentDuration")
SELECT 1, 'Clínica Masaje Corporal Deportivo', 30
WHERE NOT EXISTS (SELECT 1 FROM public.app_config WHERE id = 1);

-- ============================================================
-- 2. TABLA DE ARCHIVOS DE PACIENTES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.patient_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "patientId" UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    "fileName" VARCHAR(500) NOT NULL,
    "fileType" VARCHAR(100),
    "fileSize" INTEGER,
    "base64Data" TEXT,
    "uploadedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_patient_files_patient FOREIGN KEY ("patientId") REFERENCES public.patients(id) ON DELETE CASCADE
);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_patient_files_patient_id ON public.patient_files("patientId");
CREATE INDEX IF NOT EXISTS idx_patient_files_uploaded_at ON public.patient_files("uploadedAt");

-- ============================================================
-- 3. POLÍTICAS RLS (Row Level Security)
-- ============================================================

-- Habilitar RLS en las nuevas tablas
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_files ENABLE ROW LEVEL SECURITY;

-- Permitir acceso completo con service_role (backend)
CREATE POLICY "Enable all for service role - app_config"
    ON public.app_config
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable all for service role - patient_files"
    ON public.patient_files
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================
-- 4. COMENTARIOS EN TABLAS
-- ============================================================

COMMENT ON TABLE public.app_config IS 'Configuración global de la aplicación (horarios, precios, etc.)';
COMMENT ON TABLE public.patient_files IS 'Archivos adjuntos de pacientes (informes, imágenes, etc.)';

COMMENT ON COLUMN public.app_config."businessName" IS 'Nombre del negocio/clínica';
COMMENT ON COLUMN public.app_config."appointmentDuration" IS 'Duración por defecto de las citas en minutos';
COMMENT ON COLUMN public.app_config."workingHours" IS 'Horarios de trabajo por día de la semana (JSON)';
COMMENT ON COLUMN public.app_config."prices" IS 'Precios de sesiones y bonos (JSON)';

COMMENT ON COLUMN public.patient_files."patientId" IS 'ID del paciente propietario del archivo';
COMMENT ON COLUMN public.patient_files."fileName" IS 'Nombre original del archivo';
COMMENT ON COLUMN public.patient_files."fileType" IS 'Tipo MIME del archivo (image/png, application/pdf, etc.)';
COMMENT ON COLUMN public.patient_files."fileSize" IS 'Tamaño del archivo en bytes';
COMMENT ON COLUMN public.patient_files."base64Data" IS 'Contenido del archivo codificado en base64';

-- ============================================================
-- 5. VERIFICACIÓN
-- ============================================================

-- Verificar que las tablas se crearon correctamente
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
    AND table_name IN ('app_config', 'patient_files')
ORDER BY table_name;

-- Verificar políticas RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public' 
    AND tablename IN ('app_config', 'patient_files')
ORDER BY tablename, policyname;
