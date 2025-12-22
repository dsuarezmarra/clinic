-- =========================================================
-- FIX: Renombrar columnas de snake_case a camelCase
-- Ejecutar en Supabase Personal DESPUÉS del schema inicial
-- =========================================================

-- PATIENTS tables
ALTER TABLE public.patients_actifisio RENAME COLUMN "birthDate" TO "birthdate" IF EXISTS;
ALTER TABLE public.patients_masajecorporaldeportivo RENAME COLUMN "birthDate" TO "birthdate" IF EXISTS;

-- Verificar que las columnas existen con nombres correctos
-- Si el schema se creó con camelCase, no hay nada que hacer
-- Si hay errores de "column not found", las columnas ya tienen el nombre correcto

-- =========================================================
-- SOLUCIÓN: Verificar el schema actual y añadir columnas faltantes
-- =========================================================

-- Añadir columnas que pueden faltar en patients
DO $$ 
BEGIN
    -- patients_actifisio
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patients_actifisio' AND column_name='birthDate') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patients_actifisio' AND column_name='birthdate') THEN
            ALTER TABLE public.patients_actifisio ADD COLUMN "birthDate" timestamp without time zone;
        END IF;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patients_actifisio' AND column_name='createdAt') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patients_actifisio' AND column_name='createdat') THEN
            ALTER TABLE public.patients_actifisio ADD COLUMN "createdAt" timestamp without time zone DEFAULT now();
        END IF;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patients_actifisio' AND column_name='updatedAt') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patients_actifisio' AND column_name='updatedat') THEN
            ALTER TABLE public.patients_actifisio ADD COLUMN "updatedAt" timestamp without time zone DEFAULT now();
        END IF;
    END IF;
    
    -- patients_masajecorporaldeportivo
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patients_masajecorporaldeportivo' AND column_name='birthDate') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patients_masajecorporaldeportivo' AND column_name='birthdate') THEN
            ALTER TABLE public.patients_masajecorporaldeportivo ADD COLUMN "birthDate" timestamp without time zone;
        END IF;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patients_masajecorporaldeportivo' AND column_name='createdAt') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patients_masajecorporaldeportivo' AND column_name='createdat') THEN
            ALTER TABLE public.patients_masajecorporaldeportivo ADD COLUMN "createdAt" timestamp without time zone DEFAULT now();
        END IF;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patients_masajecorporaldeportivo' AND column_name='updatedAt') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patients_masajecorporaldeportivo' AND column_name='updatedat') THEN
            ALTER TABLE public.patients_masajecorporaldeportivo ADD COLUMN "updatedAt" timestamp without time zone DEFAULT now();
        END IF;
    END IF;
END $$;

-- =========================================================
-- Listar las columnas actuales para diagnóstico
-- =========================================================
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('patients_masajecorporaldeportivo', 'appointments_masajecorporaldeportivo')
ORDER BY table_name, ordinal_position;
