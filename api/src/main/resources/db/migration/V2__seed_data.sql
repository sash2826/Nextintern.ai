-- =============================================================
-- NextIntern.ai — V2 Seed Data
-- Demo users, skills, providers, and internships for development.
-- =============================================================

-- ── Skills Catalog ─────────────────────────────────────────

INSERT INTO skills (name, category) VALUES
  ('Python', 'Programming'),
  ('Java', 'Programming'),
  ('JavaScript', 'Programming'),
  ('TypeScript', 'Programming'),
  ('React', 'Frontend'),
  ('Next.js', 'Frontend'),
  ('Spring Boot', 'Backend'),
  ('FastAPI', 'Backend'),
  ('Node.js', 'Backend'),
  ('PostgreSQL', 'Database'),
  ('MongoDB', 'Database'),
  ('Redis', 'Database'),
  ('AWS', 'Cloud'),
  ('Docker', 'DevOps'),
  ('Kubernetes', 'DevOps'),
  ('Git', 'Tools'),
  ('GraphQL', 'API'),
  ('REST API', 'API'),
  ('Machine Learning', 'AI/ML'),
  ('Data Science', 'AI/ML'),
  ('TensorFlow', 'AI/ML'),
  ('PyTorch', 'AI/ML'),
  ('NLP', 'AI/ML'),
  ('Figma', 'Design'),
  ('UI/UX Design', 'Design'),
  ('Flutter', 'Mobile'),
  ('React Native', 'Mobile'),
  ('Kotlin', 'Programming'),
  ('Go', 'Programming'),
  ('Rust', 'Programming'),
  ('C++', 'Programming'),
  ('SQL', 'Database'),
  ('Tableau', 'Analytics'),
  ('Power BI', 'Analytics'),
  ('Blockchain', 'Web3'),
  ('Solidity', 'Web3'),
  ('Cybersecurity', 'Security'),
  ('Pandas', 'Data'),
  ('NumPy', 'Data'),
  ('Scikit-learn', 'AI/ML')
ON CONFLICT (name) DO NOTHING;

-- ── Demo Users ─────────────────────────────────────────────
-- Password for all demo users: "Demo@1234" (bcrypt hash below)

INSERT INTO users (id, email, password_hash, full_name, is_active, email_verified) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'provider@techcorp.com',  '$2a$12$LQv3c1yqBo9SkvXS7QTJPe.DVkS63ZWQV/Zq2w1JfnO2gP5gUFMrW', 'TechCorp Inc.',   TRUE, TRUE),
  ('a0000000-0000-0000-0000-000000000002', 'provider@innosoft.com',  '$2a$12$LQv3c1yqBo9SkvXS7QTJPe.DVkS63ZWQV/Zq2w1JfnO2gP5gUFMrW', 'InnoSoft Labs',   TRUE, TRUE),
  ('a0000000-0000-0000-0000-000000000003', 'provider@datawise.com',  '$2a$12$LQv3c1yqBo9SkvXS7QTJPe.DVkS63ZWQV/Zq2w1JfnO2gP5gUFMrW', 'DataWise AI',     TRUE, TRUE),
  ('a0000000-0000-0000-0000-000000000004', 'provider@greentech.com', '$2a$12$LQv3c1yqBo9SkvXS7QTJPe.DVkS63ZWQV/Zq2w1JfnO2gP5gUFMrW', 'GreenTech Sols',  TRUE, TRUE),
  ('a0000000-0000-0000-0000-000000000005', 'provider@cloudinc.com',  '$2a$12$LQv3c1yqBo9SkvXS7QTJPe.DVkS63ZWQV/Zq2w1JfnO2gP5gUFMrW', 'CloudInc',        TRUE, TRUE),
  ('b0000000-0000-0000-0000-000000000001', 'student@demo.com',       '$2a$12$LQv3c1yqBo9SkvXS7QTJPe.DVkS63ZWQV/Zq2w1JfnO2gP5gUFMrW', 'Priya Sharma',    TRUE, TRUE),
  ('b0000000-0000-0000-0000-000000000002', 'student2@demo.com',      '$2a$12$LQv3c1yqBo9SkvXS7QTJPe.DVkS63ZWQV/Zq2w1JfnO2gP5gUFMrW', 'Arjun Singh',     TRUE, TRUE),
  ('c0000000-0000-0000-0000-000000000001', 'admin@nextintern.ai',    '$2a$12$LQv3c1yqBo9SkvXS7QTJPe.DVkS63ZWQV/Zq2w1JfnO2gP5gUFMrW', 'Admin User',      TRUE, TRUE);

-- ── Assign Roles ───────────────────────────────────────────

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.email LIKE 'provider%' AND r.name = 'provider';

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.email LIKE 'student%' AND r.name = 'student';

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.email = 'admin@nextintern.ai' AND r.name = 'admin';

-- ── Providers ──────────────────────────────────────────────

INSERT INTO providers (id, user_id, company_name, website, verified, verified_at) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'TechCorp Inc.',   'https://techcorp.example.com',  TRUE, now()),
  ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'InnoSoft Labs',   'https://innosoft.example.com',  TRUE, now()),
  ('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 'DataWise AI',     'https://datawise.example.com',  TRUE, now()),
  ('d0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004', 'GreenTech Sols',  'https://greentech.example.com', FALSE, NULL),
  ('d0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000005', 'CloudInc',        'https://cloudinc.example.com',  TRUE, now());

-- ── Student Profiles ───────────────────────────────────────

INSERT INTO student_profiles (id, user_id, education_level, university, graduation_year, location_city, location_state, location_country, interests, bio) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'B.Tech', 'IIT Delhi', 2026, 'Delhi', 'Delhi', 'India', ARRAY['AI/ML', 'Web Development', 'Cloud Computing'], 'Final year CS student passionate about machine learning and web technologies.'),
  ('e0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'B.Tech', 'BITS Pilani', 2027, 'Bangalore', 'Karnataka', 'India', ARRAY['Backend', 'DevOps', 'System Design'], 'Pre-final year student interested in distributed systems and cloud infrastructure.');

-- ── Student Skills ─────────────────────────────────────────

INSERT INTO student_skills (student_profile_id, skill_id, proficiency)
SELECT 'e0000000-0000-0000-0000-000000000001', id, prof
FROM (VALUES ('Python', 5), ('JavaScript', 4), ('React', 4), ('Machine Learning', 3), ('Docker', 3), ('PostgreSQL', 3), ('AWS', 2), ('Git', 4)) AS v(sname, prof)
JOIN skills ON skills.name = v.sname;

INSERT INTO student_skills (student_profile_id, skill_id, proficiency)
SELECT 'e0000000-0000-0000-0000-000000000002', id, prof
FROM (VALUES ('Java', 4), ('Spring Boot', 4), ('Docker', 4), ('Kubernetes', 3), ('PostgreSQL', 4), ('AWS', 3), ('Go', 2), ('Git', 5)) AS v(sname, prof)
JOIN skills ON skills.name = v.sname;

-- ── Internships ────────────────────────────────────────────

INSERT INTO internships (id, provider_id, title, description, category, stipend_min, stipend_max, location_city, location_state, work_mode, duration_weeks, start_date, application_deadline, max_applicants, status) VALUES
  ('f0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001',
   'Full-Stack Web Developer Intern',
   'Join our engineering team to build modern web applications using React and Spring Boot. You will work on real projects serving thousands of users, participate in code reviews, and learn industry best practices.',
   'Web Development', 15000, 25000, 'Bangalore', 'Karnataka', 'hybrid', 12,
   '2026-04-01', '2026-03-15', 50, 'active'),

  ('f0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001',
   'Backend Engineering Intern — Java',
   'Work on our core API platform built with Spring Boot and PostgreSQL. Design RESTful APIs, write performant database queries, and contribute to our microservices architecture.',
   'Backend', 18000, 30000, 'Hyderabad', 'Telangana', 'onsite', 16,
   '2026-05-01', '2026-04-01', 30, 'active'),

  ('f0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000002',
   'Machine Learning Research Intern',
   'Research and implement state-of-the-art ML models for NLP and recommendation systems. Work with PyTorch, transformers, and large-scale data pipelines.',
   'AI/ML', 25000, 40000, NULL, NULL, 'remote', 24,
   '2026-04-15', '2026-03-31', 10, 'active'),

  ('f0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000002',
   'Data Science Intern',
   'Analyze large datasets, build predictive models, and create dashboards for business insights. Work with Python, Pandas, SQL, and Tableau.',
   'Data Science', 12000, 20000, 'Mumbai', 'Maharashtra', 'hybrid', 12,
   '2026-04-01', '2026-03-20', 25, 'active'),

  ('f0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000003',
   'AI/NLP Engineer Intern',
   'Develop NLP pipelines for document understanding and automated summarization. Experience with transformers and language models preferred.',
   'AI/ML', 20000, 35000, 'Bangalore', 'Karnataka', 'hybrid', 16,
   '2026-05-01', '2026-04-15', 15, 'active'),

  ('f0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000003',
   'Computer Vision Intern',
   'Build and optimize computer vision models for real-time object detection and image classification using PyTorch and ONNX.',
   'AI/ML', 22000, 35000, 'Pune', 'Maharashtra', 'onsite', 12,
   '2026-06-01', '2026-05-15', 8, 'active'),

  ('f0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000004',
   'Frontend Developer Intern — React',
   'Design and implement beautiful, accessible user interfaces with React, Next.js, and Tailwind CSS. Collaborate with designers and backend engineers.',
   'Frontend', 10000, 18000, 'Delhi', 'Delhi', 'remote', 8,
   '2026-04-01', '2026-03-20', 40, 'active'),

  ('f0000000-0000-0000-0000-000000000008', 'd0000000-0000-0000-0000-000000000004',
   'Mobile App Developer Intern',
   'Build cross-platform mobile applications using Flutter. Work on real features, performance optimization, and app store deployment.',
   'Mobile', 12000, 20000, 'Chennai', 'Tamil Nadu', 'hybrid', 12,
   '2026-05-01', '2026-04-10', 20, 'active'),

  ('f0000000-0000-0000-0000-000000000009', 'd0000000-0000-0000-0000-000000000005',
   'Cloud & DevOps Intern',
   'Set up CI/CD pipelines, manage Kubernetes clusters, and implement infrastructure as code with Terraform on AWS.',
   'DevOps', 20000, 30000, NULL, NULL, 'remote', 16,
   '2026-04-15', '2026-04-01', 12, 'active'),

  ('f0000000-0000-0000-0000-000000000010', 'd0000000-0000-0000-0000-000000000005',
   'Cybersecurity Analyst Intern',
   'Perform security assessments, vulnerability scanning, and penetration testing. Learn about threat modeling and security best practices.',
   'Security', 18000, 28000, 'Bangalore', 'Karnataka', 'onsite', 12,
   '2026-06-01', '2026-05-20', 10, 'active');

-- ── Internship Skills ──────────────────────────────────────

-- Full-Stack Web Dev
INSERT INTO internship_skills (internship_id, skill_id, importance)
SELECT 'f0000000-0000-0000-0000-000000000001', id, imp
FROM (VALUES ('React','required'), ('JavaScript','required'), ('Spring Boot','preferred'), ('TypeScript','preferred'), ('PostgreSQL','bonus'), ('Git','required')) AS v(sname, imp)
JOIN skills ON skills.name = v.sname;

-- Backend Java
INSERT INTO internship_skills (internship_id, skill_id, importance)
SELECT 'f0000000-0000-0000-0000-000000000002', id, imp
FROM (VALUES ('Java','required'), ('Spring Boot','required'), ('PostgreSQL','required'), ('REST API','preferred'), ('Docker','bonus'), ('Git','required')) AS v(sname, imp)
JOIN skills ON skills.name = v.sname;

-- ML Research
INSERT INTO internship_skills (internship_id, skill_id, importance)
SELECT 'f0000000-0000-0000-0000-000000000003', id, imp
FROM (VALUES ('Python','required'), ('PyTorch','required'), ('Machine Learning','required'), ('NLP','preferred'), ('NumPy','bonus'), ('Git','bonus')) AS v(sname, imp)
JOIN skills ON skills.name = v.sname;

-- Data Science
INSERT INTO internship_skills (internship_id, skill_id, importance)
SELECT 'f0000000-0000-0000-0000-000000000004', id, imp
FROM (VALUES ('Python','required'), ('Pandas','required'), ('SQL','required'), ('Tableau','preferred'), ('Machine Learning','bonus'), ('NumPy','bonus')) AS v(sname, imp)
JOIN skills ON skills.name = v.sname;

-- AI/NLP
INSERT INTO internship_skills (internship_id, skill_id, importance)
SELECT 'f0000000-0000-0000-0000-000000000005', id, imp
FROM (VALUES ('Python','required'), ('NLP','required'), ('Machine Learning','required'), ('PyTorch','preferred'), ('Docker','bonus')) AS v(sname, imp)
JOIN skills ON skills.name = v.sname;

-- Computer Vision
INSERT INTO internship_skills (internship_id, skill_id, importance)
SELECT 'f0000000-0000-0000-0000-000000000006', id, imp
FROM (VALUES ('Python','required'), ('PyTorch','required'), ('Machine Learning','required'), ('Docker','preferred'), ('C++','bonus')) AS v(sname, imp)
JOIN skills ON skills.name = v.sname;

-- Frontend React
INSERT INTO internship_skills (internship_id, skill_id, importance)
SELECT 'f0000000-0000-0000-0000-000000000007', id, imp
FROM (VALUES ('React','required'), ('JavaScript','required'), ('Next.js','preferred'), ('TypeScript','preferred'), ('Figma','bonus'), ('Git','required')) AS v(sname, imp)
JOIN skills ON skills.name = v.sname;

-- Mobile Flutter
INSERT INTO internship_skills (internship_id, skill_id, importance)
SELECT 'f0000000-0000-0000-0000-000000000008', id, imp
FROM (VALUES ('Flutter','required'), ('Kotlin','preferred'), ('Git','required'), ('UI/UX Design','bonus'), ('REST API','preferred')) AS v(sname, imp)
JOIN skills ON skills.name = v.sname;

-- Cloud DevOps
INSERT INTO internship_skills (internship_id, skill_id, importance)
SELECT 'f0000000-0000-0000-0000-000000000009', id, imp
FROM (VALUES ('AWS','required'), ('Docker','required'), ('Kubernetes','required'), ('Git','required'), ('Python','preferred'), ('Go','bonus')) AS v(sname, imp)
JOIN skills ON skills.name = v.sname;

-- Cybersecurity
INSERT INTO internship_skills (internship_id, skill_id, importance)
SELECT 'f0000000-0000-0000-0000-000000000010', id, imp
FROM (VALUES ('Cybersecurity','required'), ('Python','preferred'), ('Docker','bonus'), ('AWS','bonus'), ('Git','preferred')) AS v(sname, imp)
JOIN skills ON skills.name = v.sname;
