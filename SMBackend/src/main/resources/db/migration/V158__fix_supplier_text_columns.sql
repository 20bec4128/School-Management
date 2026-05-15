DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'suppliers'
          AND column_name = 'supplier_name'
          AND data_type = 'bytea'
    ) THEN
        EXECUTE 'ALTER TABLE suppliers ALTER COLUMN supplier_name TYPE TEXT USING convert_from(supplier_name, ''UTF8'')';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'suppliers'
          AND column_name = 'contact_name'
          AND data_type = 'bytea'
    ) THEN
        EXECUTE 'ALTER TABLE suppliers ALTER COLUMN contact_name TYPE TEXT USING convert_from(contact_name, ''UTF8'')';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'suppliers'
          AND column_name = 'email'
          AND data_type = 'bytea'
    ) THEN
        EXECUTE 'ALTER TABLE suppliers ALTER COLUMN email TYPE TEXT USING convert_from(email, ''UTF8'')';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'suppliers'
          AND column_name = 'phone'
          AND data_type = 'bytea'
    ) THEN
        EXECUTE 'ALTER TABLE suppliers ALTER COLUMN phone TYPE TEXT USING convert_from(phone, ''UTF8'')';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'suppliers'
          AND column_name = 'address'
          AND data_type = 'bytea'
    ) THEN
        EXECUTE 'ALTER TABLE suppliers ALTER COLUMN address TYPE TEXT USING convert_from(address, ''UTF8'')';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'suppliers'
          AND column_name = 'note'
          AND data_type = 'bytea'
    ) THEN
        EXECUTE 'ALTER TABLE suppliers ALTER COLUMN note TYPE TEXT USING convert_from(note, ''UTF8'')';
    END IF;
END $$;
