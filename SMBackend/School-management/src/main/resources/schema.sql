ALTER TABLE IF EXISTS public.schools
ALTER COLUMN registration_date TYPE DATE
USING (
    CASE
        WHEN registration_date IS NULL THEN NULL
        WHEN btrim(registration_date::text) = '' THEN NULL
        WHEN registration_date::text ~ '^\d{4}-\d{2}-\d{2}$' THEN registration_date::date
        WHEN registration_date::text ~ '^\d{2}/\d{2}/\d{4}$' THEN to_date(registration_date::text, 'DD/MM/YYYY')
        WHEN registration_date::text ~ '^\d{2}-\d{2}-\d{4}$' THEN to_date(registration_date::text, 'DD-MM-YYYY')
        ELSE NULL
    END
);
