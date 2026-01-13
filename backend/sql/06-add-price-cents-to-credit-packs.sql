-- =====================================================
-- MIGRACIÓN: Añadir columna price_cents a credit_packs
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- 1. Añadir la columna price_cents (permite NULL temporalmente para datos existentes)
ALTER TABLE credit_packs_masajecorporaldeportivo 
ADD COLUMN IF NOT EXISTS price_cents INTEGER DEFAULT 0;

-- 2. Actualizar packs existentes con precios estimados basados en su tipo
-- Obtener precios de la configuración (o usar defaults)
DO $$
DECLARE
    v_session_30 INTEGER := 3500;  -- Se actualizará desde config
    v_session_60 INTEGER := 6500;
    v_bono_30 INTEGER := 15500;
    v_bono_60 INTEGER := 29000;
    v_config_value TEXT;
BEGIN
    -- Intentar obtener precios de configuración
    SELECT value INTO v_config_value FROM configurations_masajecorporaldeportivo WHERE key = 'sessionPrice30';
    IF v_config_value IS NOT NULL THEN v_session_30 := (v_config_value::NUMERIC * 100)::INTEGER; END IF;
    
    SELECT value INTO v_config_value FROM configurations_masajecorporaldeportivo WHERE key = 'sessionPrice60';
    IF v_config_value IS NOT NULL THEN v_session_60 := (v_config_value::NUMERIC * 100)::INTEGER; END IF;
    
    SELECT value INTO v_config_value FROM configurations_masajecorporaldeportivo WHERE key = 'bonoPrice30';
    IF v_config_value IS NOT NULL THEN v_bono_30 := (v_config_value::NUMERIC * 100)::INTEGER; END IF;
    
    SELECT value INTO v_config_value FROM configurations_masajecorporaldeportivo WHERE key = 'bonoPrice60';
    IF v_config_value IS NOT NULL THEN v_bono_60 := (v_config_value::NUMERIC * 100)::INTEGER; END IF;

    -- Actualizar sesiones de 30min (columna es "unitMinutes" en camelCase)
    UPDATE credit_packs_masajecorporaldeportivo 
    SET price_cents = v_session_30 
    WHERE label LIKE 'Sesión%' AND "unitMinutes" = 30 AND (price_cents IS NULL OR price_cents = 0);

    -- Actualizar sesiones de 60min
    UPDATE credit_packs_masajecorporaldeportivo 
    SET price_cents = v_session_60 
    WHERE label LIKE 'Sesión%' AND "unitMinutes" = 60 AND (price_cents IS NULL OR price_cents = 0);

    -- Actualizar bonos de 30min (5 unidades)
    UPDATE credit_packs_masajecorporaldeportivo 
    SET price_cents = v_bono_30 
    WHERE label LIKE 'Bono%' AND "unitsTotal" = 5 AND (price_cents IS NULL OR price_cents = 0);

    -- Actualizar bonos de 60min (10 unidades)
    UPDATE credit_packs_masajecorporaldeportivo 
    SET price_cents = v_bono_60 
    WHERE label LIKE 'Bono%' AND "unitsTotal" = 10 AND (price_cents IS NULL OR price_cents = 0);
    
    RAISE NOTICE 'Precios usados: Sesión 30m=%, Sesión 60m=%, Bono 30m=%, Bono 60m=%', 
                 v_session_30, v_session_60, v_bono_30, v_bono_60;
END $$;

-- 3. Verificar resultados
SELECT id, label, "unitsTotal", "unitMinutes", price_cents, paid 
FROM credit_packs_masajecorporaldeportivo 
ORDER BY "createdAt" DESC 
LIMIT 20;
