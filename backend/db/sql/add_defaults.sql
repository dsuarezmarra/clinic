-- SQL: add_defaults.sql
-- Añade defaults recomendados para tablas principales según schema.prisma
-- Ejecutar en la base de datos Postgres (por ejemplo via psql o la SQL editor de Supabase)

-- Requiere la extensión pgcrypto para gen_random_uuid();
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Helper: safe ALTER COLUMN if column exists (handles camelCase names)
DO $$
BEGIN
	IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='patients' AND column_name='id') THEN
		EXECUTE 'ALTER TABLE public.patients ALTER COLUMN "id" SET DEFAULT gen_random_uuid()';
	END IF;
	IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='patients' AND column_name='"createdAt"') THEN
		-- unlikely case if stored with quotes in information_schema; fallthrough
	END IF;
	IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='patients' AND column_name='createdAt') THEN
		EXECUTE 'ALTER TABLE public.patients ALTER COLUMN "createdAt" SET DEFAULT now()';
	END IF;
	IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='patients' AND column_name='updatedAt') THEN
		EXECUTE 'ALTER TABLE public.patients ALTER COLUMN "updatedAt" SET DEFAULT now()';
	END IF;
END$$;

DO $$
BEGIN
	IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='appointments' AND column_name='id') THEN
		EXECUTE 'ALTER TABLE public.appointments ALTER COLUMN "id" SET DEFAULT gen_random_uuid()';
	END IF;
	IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='appointments' AND column_name='createdAt') THEN
		EXECUTE 'ALTER TABLE public.appointments ALTER COLUMN "createdAt" SET DEFAULT now()';
	END IF;
	IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='appointments' AND column_name='updatedAt') THEN
		EXECUTE 'ALTER TABLE public.appointments ALTER COLUMN "updatedAt" SET DEFAULT now()';
	END IF;
END$$;

DO $$
BEGIN
	IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='credit_packs' AND column_name='id') THEN
		EXECUTE 'ALTER TABLE public.credit_packs ALTER COLUMN "id" SET DEFAULT gen_random_uuid()';
	END IF;
	IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='credit_packs' AND column_name='createdAt') THEN
		EXECUTE 'ALTER TABLE public.credit_packs ALTER COLUMN "createdAt" SET DEFAULT now()';
	END IF;
END$$;

DO $$
BEGIN
	IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='credit_redemptions' AND column_name='id') THEN
		EXECUTE 'ALTER TABLE public.credit_redemptions ALTER COLUMN "id" SET DEFAULT gen_random_uuid()';
	END IF;
	IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='credit_redemptions' AND column_name='createdAt') THEN
		EXECUTE 'ALTER TABLE public.credit_redemptions ALTER COLUMN "createdAt" SET DEFAULT now()';
	END IF;
END$$;

DO $$
BEGIN
	IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='patient_files' AND column_name='id') THEN
		EXECUTE 'ALTER TABLE public.patient_files ALTER COLUMN "id" SET DEFAULT gen_random_uuid()';
	END IF;
	IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='patient_files' AND column_name='createdAt') THEN
		EXECUTE 'ALTER TABLE public.patient_files ALTER COLUMN "createdAt" SET DEFAULT now()';
	END IF;
END$$;

DO $$
BEGIN
	IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='invoices' AND column_name='id') THEN
		EXECUTE 'ALTER TABLE public.invoices ALTER COLUMN "id" SET DEFAULT gen_random_uuid()';
	END IF;
	IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='invoices' AND column_name='createdAt') THEN
		EXECUTE 'ALTER TABLE public.invoices ALTER COLUMN "createdAt" SET DEFAULT now()';
	END IF;
	IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='invoice_items' AND column_name='id') THEN
		EXECUTE 'ALTER TABLE public.invoice_items ALTER COLUMN "id" SET DEFAULT gen_random_uuid()';
	END IF;
END$$;

-- Nota: revisa permisos/roles antes de ejecutar en producción. Algunos campos pueden tener otros nombres en la BD real.
