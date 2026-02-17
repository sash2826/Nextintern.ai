-- Add ID column
ALTER TABLE saved_internships ADD COLUMN id UUID DEFAULT gen_random_uuid();
UPDATE saved_internships SET id = gen_random_uuid() WHERE id IS NULL;
ALTER TABLE saved_internships ALTER COLUMN id SET NOT NULL;

-- Drop old PK and add new PK
ALTER TABLE saved_internships DROP CONSTRAINT saved_internships_pkey;
ALTER TABLE saved_internships ADD PRIMARY KEY (id);

-- Deduplicate before adding constraint
DELETE FROM saved_internships
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY student_id, internship_id
                   ORDER BY saved_at DESC
               ) as rnum
        FROM saved_internships
    ) t
    WHERE t.rnum > 1
);

-- Ensure uniqueness of student-internship pair
ALTER TABLE saved_internships ADD CONSTRAINT uq_saved_internships_student_internship UNIQUE (student_id, internship_id);
