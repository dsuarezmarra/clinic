-- =====================================================
-- 05-add-whatsapp-reminders-fields.sql
-- Añade campos para el sistema de recordatorios WhatsApp
-- =====================================================

-- Añadir campo whatsappReminders a la tabla de pacientes
-- Por defecto TRUE para que todos los pacientes reciban recordatorios
ALTER TABLE patients_masajecorporaldeportivo 
ADD COLUMN IF NOT EXISTS "whatsappReminders" BOOLEAN DEFAULT true;

-- Añadir campos de tracking a la tabla de citas
ALTER TABLE appointments_masajecorporaldeportivo 
ADD COLUMN IF NOT EXISTS "whatsappReminderSent" BOOLEAN DEFAULT false;

ALTER TABLE appointments_masajecorporaldeportivo 
ADD COLUMN IF NOT EXISTS "whatsappReminderSentAt" TIMESTAMP WITH TIME ZONE;

-- Crear índice para optimizar las consultas de recordatorios pendientes
CREATE INDEX IF NOT EXISTS idx_appointments_whatsapp_reminder 
ON appointments_masajecorporaldeportivo ("whatsappReminderSent", "date", "time")
WHERE "whatsappReminderSent" = false OR "whatsappReminderSent" IS NULL;

-- Comentarios para documentación
COMMENT ON COLUMN patients_masajecorporaldeportivo."whatsappReminders" IS 'Si el paciente quiere recibir recordatorios por WhatsApp';
COMMENT ON COLUMN appointments_masajecorporaldeportivo."whatsappReminderSent" IS 'Si ya se envió el recordatorio de WhatsApp para esta cita';
COMMENT ON COLUMN appointments_masajecorporaldeportivo."whatsappReminderSentAt" IS 'Fecha y hora en que se envió el recordatorio';

-- =====================================================
-- Para otros clientes, ejecutar lo mismo cambiando el sufijo:
-- 
-- ALTER TABLE patients_actifisio 
-- ADD COLUMN IF NOT EXISTS "whatsappReminders" BOOLEAN DEFAULT true;
-- 
-- ALTER TABLE appointments_actifisio 
-- ADD COLUMN IF NOT EXISTS "whatsappReminderSent" BOOLEAN DEFAULT false;
-- 
-- ALTER TABLE appointments_actifisio 
-- ADD COLUMN IF NOT EXISTS "whatsappReminderSentAt" TIMESTAMP WITH TIME ZONE;
-- =====================================================
