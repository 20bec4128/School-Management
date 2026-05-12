DO $$
DECLARE
    constraint_name text;
BEGIN
    FOR constraint_name IN
        SELECT con.conname
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        JOIN pg_attribute attr ON attr.attrelid = rel.oid
        JOIN unnest(con.conkey) WITH ORDINALITY AS cols(attnum, ordinality) ON cols.attnum = attr.attnum
        WHERE rel.relname = 'students'
          AND con.contype = 'u'
          AND attr.attname IN ('admission_no', 'username')
    LOOP
        EXECUTE format('ALTER TABLE students DROP CONSTRAINT IF EXISTS %I', constraint_name);
    END LOOP;
END $$;

DROP INDEX IF EXISTS ukmld7jr7tg6pbaehxih5dofgpr;

CREATE UNIQUE INDEX IF NOT EXISTS ux_students_admission_no_active
    ON students (admission_no)
    WHERE deleted = false;

CREATE UNIQUE INDEX IF NOT EXISTS ux_students_username_active
    ON students (username)
    WHERE deleted = false;
