-- =============================================================
-- NextIntern.ai — V4 Seed: Applications, Saved & Events
-- Adds realistic demo data for the application flow.
-- =============================================================

-- ── Sample Applications ───────────────────────────────────
-- Priya (student 1) has applied to 4 internships
-- Arjun (student 2) has applied to 3 internships

INSERT INTO applications (id, student_id, internship_id, status, status_history, cover_note, applied_at) VALUES
  -- Priya → Full-Stack Web Dev (SHORTLISTED)
  ('aa000000-0000-0000-0000-000000000001',
   'e0000000-0000-0000-0000-000000000001',
   'f0000000-0000-0000-0000-000000000001',
   'SHORTLISTED',
   '[{"status":"APPLIED","timestamp":"2026-02-01T10:00:00Z"},{"status":"SHORTLISTED","timestamp":"2026-02-05T14:30:00Z"}]'::jsonb,
   'I am a final-year CS student with strong React and JavaScript skills. I have built several full-stack projects and am eager to contribute to your team.',
   '2026-02-01 10:00:00+05:30'),

  -- Priya → ML Research (APPLIED)
  ('aa000000-0000-0000-0000-000000000002',
   'e0000000-0000-0000-0000-000000000001',
   'f0000000-0000-0000-0000-000000000003',
   'APPLIED',
   '[{"status":"APPLIED","timestamp":"2026-02-03T09:00:00Z"}]'::jsonb,
   'My passion lies in machine learning. I have completed several Kaggle competitions and have hands-on experience with PyTorch and NLP.',
   '2026-02-03 09:00:00+05:30'),

  -- Priya → Data Science (HIRED)
  ('aa000000-0000-0000-0000-000000000003',
   'e0000000-0000-0000-0000-000000000001',
   'f0000000-0000-0000-0000-000000000004',
   'HIRED',
   '[{"status":"APPLIED","timestamp":"2026-01-20T11:00:00Z"},{"status":"SHORTLISTED","timestamp":"2026-01-25T16:00:00Z"},{"status":"HIRED","timestamp":"2026-02-10T10:00:00Z"}]'::jsonb,
   'I love working with data. Proficient in Python, Pandas, and SQL with experience in building predictive models.',
   '2026-01-20 11:00:00+05:30'),

  -- Priya → Frontend React (REJECTED)
  ('aa000000-0000-0000-0000-000000000004',
   'e0000000-0000-0000-0000-000000000001',
   'f0000000-0000-0000-0000-000000000007',
   'REJECTED',
   '[{"status":"APPLIED","timestamp":"2026-01-15T08:00:00Z"},{"status":"REJECTED","timestamp":"2026-01-22T12:00:00Z"}]'::jsonb,
   'Interested in frontend development with React and Next.js.',
   '2026-01-15 08:00:00+05:30'),

  -- Arjun → Backend Java (SHORTLISTED)
  ('aa000000-0000-0000-0000-000000000005',
   'e0000000-0000-0000-0000-000000000002',
   'f0000000-0000-0000-0000-000000000002',
   'SHORTLISTED',
   '[{"status":"APPLIED","timestamp":"2026-02-02T14:00:00Z"},{"status":"SHORTLISTED","timestamp":"2026-02-08T11:00:00Z"}]'::jsonb,
   'Spring Boot and Java are my primary stack. I have built microservices and REST APIs in production environments.',
   '2026-02-02 14:00:00+05:30'),

  -- Arjun → Cloud DevOps (APPLIED)
  ('aa000000-0000-0000-0000-000000000006',
   'e0000000-0000-0000-0000-000000000002',
   'f0000000-0000-0000-0000-000000000009',
   'APPLIED',
   '[{"status":"APPLIED","timestamp":"2026-02-05T16:00:00Z"}]'::jsonb,
   'Experienced with Docker, Kubernetes, and AWS. I manage CI/CD pipelines and infrastructure as code.',
   '2026-02-05 16:00:00+05:30'),

  -- Arjun → Cybersecurity (APPLIED)
  ('aa000000-0000-0000-0000-000000000007',
   'e0000000-0000-0000-0000-000000000002',
   'f0000000-0000-0000-0000-000000000010',
   'APPLIED',
   '[{"status":"APPLIED","timestamp":"2026-02-06T09:30:00Z"}]'::jsonb,
   'Interested in security engineering and penetration testing.',
   '2026-02-06 09:30:00+05:30')
ON CONFLICT (student_id, internship_id) DO NOTHING;


-- ── Saved Internships ─────────────────────────────────────
-- Students bookmark internships for later

INSERT INTO saved_internships (id, student_id, internship_id, saved_at) VALUES
  ('bb000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000005', '2026-02-01 12:00:00+05:30'),
  ('bb000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000006', '2026-02-02 15:00:00+05:30'),
  ('bb000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000009', '2026-02-04 10:00:00+05:30'),
  ('bb000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000001', '2026-02-01 09:00:00+05:30'),
  ('bb000000-0000-0000-0000-000000000005', 'e0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000003', '2026-02-03 11:00:00+05:30'),
  ('bb000000-0000-0000-0000-000000000006', 'e0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000005', '2026-02-05 18:00:00+05:30')
ON CONFLICT (student_id, internship_id) DO NOTHING;


-- ── Sample Events (user activity for recommendations) ─────
-- Using user_id (from users table), not student_profile_id

INSERT INTO events (idempotency_key, user_id, event_type, internship_id, metadata, created_at) VALUES
  -- Priya views and interacts with internships
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000001', 'view',   'f0000000-0000-0000-0000-000000000001', '{"source":"search"}'::jsonb, '2026-02-01 09:50:00+05:30'),
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000001', 'apply',  'f0000000-0000-0000-0000-000000000001', '{}'::jsonb,                   '2026-02-01 10:00:00+05:30'),
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000001', 'view',   'f0000000-0000-0000-0000-000000000003', '{"source":"recommendation"}'::jsonb, '2026-02-03 08:50:00+05:30'),
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000001', 'apply',  'f0000000-0000-0000-0000-000000000003', '{}'::jsonb,                   '2026-02-03 09:00:00+05:30'),
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000001', 'view',   'f0000000-0000-0000-0000-000000000005', '{"source":"search"}'::jsonb,  '2026-02-01 11:55:00+05:30'),
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000001', 'save',   'f0000000-0000-0000-0000-000000000005', '{}'::jsonb,                   '2026-02-01 12:00:00+05:30'),
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000001', 'view',   'f0000000-0000-0000-0000-000000000006', '{"source":"browse"}'::jsonb,  '2026-02-02 14:50:00+05:30'),
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000001', 'save',   'f0000000-0000-0000-0000-000000000006', '{}'::jsonb,                   '2026-02-02 15:00:00+05:30'),

  -- Arjun views and interacts
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000002', 'view',   'f0000000-0000-0000-0000-000000000002', '{"source":"search"}'::jsonb,  '2026-02-02 13:50:00+05:30'),
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000002', 'apply',  'f0000000-0000-0000-0000-000000000002', '{}'::jsonb,                   '2026-02-02 14:00:00+05:30'),
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000002', 'view',   'f0000000-0000-0000-0000-000000000009', '{"source":"recommendation"}'::jsonb, '2026-02-05 15:45:00+05:30'),
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000002', 'apply',  'f0000000-0000-0000-0000-000000000009', '{}'::jsonb,                   '2026-02-05 16:00:00+05:30'),
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000002', 'view',   'f0000000-0000-0000-0000-000000000001', '{"source":"browse"}'::jsonb,  '2026-02-01 08:50:00+05:30'),
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000002', 'save',   'f0000000-0000-0000-0000-000000000001', '{}'::jsonb,                   '2026-02-01 09:00:00+05:30'),
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000002', 'view',   'f0000000-0000-0000-0000-000000000005', '{"source":"search"}'::jsonb,  '2026-02-05 17:50:00+05:30'),
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000002', 'save',   'f0000000-0000-0000-0000-000000000005', '{}'::jsonb,                   '2026-02-05 18:00:00+05:30');


-- ── Sample Audit Log Entries ──────────────────────────────

INSERT INTO audit_log (actor_id, action, target_type, target_id, details, ip_address, created_at) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'USER_BAN',   'USER', 'b0000000-0000-0000-0000-000000000002', '{"reason":"Testing ban flow"}'::jsonb,   '127.0.0.1', '2026-02-10 10:00:00+05:30'),
  ('c0000000-0000-0000-0000-000000000001', 'USER_UNBAN', 'USER', 'b0000000-0000-0000-0000-000000000002', '{"reason":"Test complete"}'::jsonb,      '127.0.0.1', '2026-02-10 10:05:00+05:30'),
  ('c0000000-0000-0000-0000-000000000001', 'USER_BAN',   'USER', 'a0000000-0000-0000-0000-000000000004', '{"reason":"Unverified provider"}'::jsonb, '127.0.0.1', '2026-02-12 14:00:00+05:30');
