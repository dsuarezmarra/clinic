-- Script para deshabilitar RLS temporalmente para testing
-- Ejecutar en SQL Editor de Supabase

-- 1. Verificar que las tablas existen
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('patients', 'appointments', 'credit_packs', 'credit_redemptions')
ORDER BY table_name;

-- 2. DESHABILITAR RLS temporalmente para testing
ALTER TABLE public.patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_packs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_redemptions DISABLE ROW LEVEL SECURITY;

-- 3. Insertar datos de prueba
INSERT INTO public.patients (firstName, lastName, phone, email) 
VALUES ('Test', 'User', '123456789', 'test@example.com');

-- 4. Verificar inserción
SELECT id, firstName, lastName, phone FROM public.patients WHERE firstName = 'Test';

-- 5. Contar registros
SELECT COUNT(*) as total_patients FROM public.patients;

-- NOTA: Después de probar, ejecutar este comando para RE-HABILITAR RLS:
-- ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;  
-- ALTER TABLE public.credit_packs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.credit_redemptions ENABLE ROW LEVEL SECURITY;