-- Change years_experience column from INTEGER to TEXT
-- This allows storing values like "1-5" and ">5" instead of numeric values

-- First, update any existing integer values to text format before changing type
-- If value is 1-5, set to "1-5", if >5, set to ">5"
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN SELECT id, years_experience FROM profiles WHERE years_experience IS NOT NULL
  LOOP
    BEGIN
      IF rec.years_experience::text ~ '^[0-9]+$' THEN
        -- It's a numeric string, convert it
        IF rec.years_experience::integer <= 5 THEN
          UPDATE profiles SET years_experience = '1-5' WHERE id = rec.id;
        ELSE
          UPDATE profiles SET years_experience = '>5' WHERE id = rec.id;
        END IF;
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        -- Skip if conversion fails
        CONTINUE;
    END;
  END LOOP;
END $$;

-- Now change the column type to TEXT
ALTER TABLE profiles 
ALTER COLUMN years_experience TYPE TEXT USING years_experience::text;
