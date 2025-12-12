-- ============================================================
-- SCRIPT: Configurar Autenticacion con Supabase Auth
-- ============================================================
-- Este script crea la tabla de perfiles de usuario y configura
-- la integracion con Supabase Auth.
--
-- IMPORTANTE: Supabase Auth ya incluye la tabla auth.users
-- Este script solo crea una tabla de perfil adicional para
-- almacenar datos especificos del tenant.
--
-- Ejecutar en: Supabase SQL Editor
-- ============================================================

-- ============================================================
-- TABLA: user_profiles
-- ============================================================
-- Almacena informacion adicional del usuario vinculada al tenant.
-- Se vincula con auth.users mediante el id de Supabase Auth.

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  tenant_slug TEXT NOT NULL,
  display_name TEXT,
  role TEXT DEFAULT 'owner', -- 'owner' para el fisio/dueno
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_user_profiles_tenant ON user_profiles(tenant_slug);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_active ON user_profiles(active);

-- RLS (Row Level Security)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Politica: Los usuarios solo pueden ver su propio perfil
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Politica: Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Politica: Service role tiene acceso completo
CREATE POLICY "Service role full access" ON user_profiles
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Comentarios
COMMENT ON TABLE user_profiles IS 'Perfiles de usuario vinculados a tenants';
COMMENT ON COLUMN user_profiles.tenant_slug IS 'Slug del tenant al que pertenece el usuario';
COMMENT ON COLUMN user_profiles.role IS 'Rol del usuario: owner (dueno/fisio)';

-- ============================================================
-- FUNCION: Crear perfil automaticamente al registrar usuario
-- ============================================================
-- Esta funcion se ejecuta automaticamente cuando se crea un
-- usuario en Supabase Auth, creando su perfil asociado.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, tenant_slug, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'tenant_slug', 'masajecorporaldeportivo'),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil al registrar usuario
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- CREAR USUARIO INICIAL PARA MASAJE CORPORAL DEPORTIVO
-- ============================================================
-- IMPORTANTE: Este bloque crea un usuario de prueba.
-- En produccion, cambiar el email y la contrasena.
--
-- Opcion 1: Crear usuario desde el Dashboard de Supabase
--   1. Ir a Authentication > Users
--   2. Click "Add User"
--   3. Email: fisio@masajecorporaldeportivo.com
--   4. Password: (tu contrasena segura)
--   5. Marcar "Auto Confirm User"
--   6. En User Metadata agregar: {"tenant_slug": "masajecorporaldeportivo", "display_name": "Fisioterapeuta"}
--
-- Opcion 2: Usar la API de Supabase Auth desde el backend
--   Ver script backend/scripts/create-auth-user.js

-- ============================================================
-- VERIFICACION
-- ============================================================

-- Verificar que la tabla se creo correctamente
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- Verificar politicas RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'user_profiles';

-- ============================================================
-- NOTAS ADICIONALES
-- ============================================================
-- 
-- Para crear un usuario desde el backend:
-- 
-- const { data, error } = await supabase.auth.admin.createUser({
--   email: 'fisio@clinica.com',
--   password: 'password_seguro',
--   email_confirm: true,
--   user_metadata: {
--     tenant_slug: 'masajecorporaldeportivo',
--     display_name: 'Fisioterapeuta'
--   }
-- });
--
-- Para recuperar contrasena:
-- - El usuario usa la opcion "Olvide mi contrasena" en el login
-- - Supabase envia un email con un link para restablecer
-- - El link redirige a /reset-password en el frontend
-- - El usuario escribe su nueva contrasena
--
-- ============================================================
