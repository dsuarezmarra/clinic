-- Example import SQL for patients (mapping historical -> createdAt, treatment -> notes)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

BEGIN;

-- Example 1: full data
INSERT INTO patients (id, dni, "firstName", "lastName", address, city, province, cp, phone, phone2, email, "birthDate", family_contact, notes, "createdAt")
VALUES (
  gen_random_uuid(),
  '12345678A',
  'Prueba',
  'Uno',
  'C/ Ejemplo 1',
  'Ciudad',
  'Provincia',
  '28000',
  '600111222',
  '600111333',
  'prueba1@example.com',
  '1980-05-10T00:00:00.000Z',
  'Nombre Familiar 1',
  'Tratamiento: fisioterapia lumbar',
  '2020-03-15T12:00:00.000Z'
) ON CONFLICT (dni) DO UPDATE SET
  "firstName" = EXCLUDED."firstName",
  "lastName" = EXCLUDED."lastName",
  address = EXCLUDED.address,
  city = EXCLUDED.city,
  province = EXCLUDED.province,
  cp = EXCLUDED.cp,
  phone = EXCLUDED.phone,
  phone2 = EXCLUDED.phone2,
  email = EXCLUDED.email,
  "birthDate" = EXCLUDED."birthDate",
  family_contact = EXCLUDED.family_contact,
  notes = EXCLUDED.notes,
  "createdAt" = COALESCE(patients."createdAt", EXCLUDED."createdAt");

-- Example 2: minimal data, historical present
INSERT INTO patients (id, dni, "firstName", "lastName", phone, family_contact, notes, "createdAt")
VALUES (
  gen_random_uuid(),
  '23456789B',
  'Prueba',
  'Dos',
  '611222333',
  NULL,
  'Tratamiento: recuperación de hombro',
  '2018-07-01T09:30:00.000Z'
) ON CONFLICT (dni) DO UPDATE SET
  "firstName" = EXCLUDED."firstName",
  "lastName" = EXCLUDED."lastName",
  phone = EXCLUDED.phone,
  family_contact = EXCLUDED.family_contact,
  notes = EXCLUDED.notes,
  "createdAt" = COALESCE(patients."createdAt", EXCLUDED."createdAt");

-- Example 3: treatment mapped to notes, historical missing -> use CURRENT_TIMESTAMP
INSERT INTO patients (id, dni, "firstName", "lastName", phone, notes, "createdAt")
VALUES (
  gen_random_uuid(),
  '34567890C',
  'Prueba',
  'Tres',
  '622333444',
  'Tratamiento: masaje deportivo',
  COALESCE(NULL, CURRENT_TIMESTAMP)
) ON CONFLICT (dni) DO UPDATE SET
  "firstName" = EXCLUDED."firstName",
  "lastName" = EXCLUDED."lastName",
  phone = EXCLUDED.phone,
  notes = EXCLUDED.notes,
  "createdAt" = COALESCE(patients."createdAt", EXCLUDED."createdAt");

COMMIT;
