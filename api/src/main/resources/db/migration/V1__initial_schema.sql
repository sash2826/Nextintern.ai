-- =============================================================
-- NextIntern.ai — V1 Database Schema
-- Implements the v3 corrected plan schema.
-- =============================================================

-- ── Roles (replaces ENUM) ──────────────────────────────────

CREATE TABLE roles (
    id   SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO roles (name) VALUES ('student'), ('provider'), ('admin');


-- ── Users ──────────────────────────────────────────────────

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255),
    full_name       VARCHAR(255) NOT NULL,
    locale          VARCHAR(10)  NOT NULL DEFAULT 'en',
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    email_verified  BOOLEAN      NOT NULL DEFAULT FALSE,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_active_verified ON users (is_active, email_verified);


-- ── User Roles (many-to-many) ──────────────────────────────

CREATE TABLE user_roles (
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    role_id INT  NOT NULL REFERENCES roles (id),
    PRIMARY KEY (user_id, role_id)
);


-- ── Student Profiles ───────────────────────────────────────

CREATE TABLE student_profiles (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
    education_level   VARCHAR(100),
    university        VARCHAR(255),
    graduation_year   INT CHECK (graduation_year BETWEEN 2020 AND 2035),
    location_city     VARCHAR(100),
    location_state    VARCHAR(100),
    location_country  VARCHAR(100) NOT NULL DEFAULT 'India',
    interests         TEXT[],
    resume_url        VARCHAR(512),
    bio               TEXT
);

CREATE INDEX idx_student_profiles_interests ON student_profiles USING GIN (interests);
CREATE INDEX idx_student_profiles_location ON student_profiles (location_state, location_city);


-- ── Skills ─────────────────────────────────────────────────

CREATE TABLE skills (
    id       SERIAL PRIMARY KEY,
    name     VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(100),
    aliases  TEXT[]
);


-- ── Student Skills ─────────────────────────────────────────

CREATE TABLE student_skills (
    student_profile_id UUID    NOT NULL REFERENCES student_profiles (id) ON DELETE CASCADE,
    skill_id           INT     NOT NULL REFERENCES skills (id),
    proficiency        SMALLINT NOT NULL CHECK (proficiency BETWEEN 1 AND 5),
    PRIMARY KEY (student_profile_id, skill_id)
);

CREATE INDEX idx_student_skills_skill ON student_skills (skill_id);


-- ── Providers ──────────────────────────────────────────────

CREATE TABLE providers (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    logo_url     VARCHAR(512),
    website      VARCHAR(512),
    verified     BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at  TIMESTAMPTZ,
    verified_by  UUID REFERENCES users (id)
);


-- ── Internships ────────────────────────────────────────────

CREATE TABLE internships (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id           UUID NOT NULL REFERENCES providers (id),
    title                 VARCHAR(255) NOT NULL,
    description           TEXT,
    category              VARCHAR(100),
    stipend_min           INT CHECK (stipend_min >= 0),
    stipend_max           INT,
    location_city         VARCHAR(100),
    location_state        VARCHAR(100),
    location_country      VARCHAR(100) NOT NULL DEFAULT 'India',
    work_mode             VARCHAR(20) NOT NULL CHECK (work_mode IN ('remote', 'onsite', 'hybrid')),
    eligibility           TEXT,
    duration_weeks        INT CHECK (duration_weeks BETWEEN 1 AND 52),
    start_date            DATE,
    application_deadline  DATE,
    max_applicants        INT,
    status                VARCHAR(20) NOT NULL DEFAULT 'draft'
                          CHECK (status IN ('draft', 'active', 'closed', 'archived')),
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_stipend CHECK (stipend_max IS NULL OR stipend_max >= stipend_min),
    CONSTRAINT chk_deadline CHECK (
        application_deadline IS NULL
        OR created_at IS NULL
        OR application_deadline >= created_at::date
    )
);

CREATE INDEX idx_internships_provider       ON internships (provider_id);
CREATE INDEX idx_internships_status_deadline ON internships (status, application_deadline);
CREATE INDEX idx_internships_location       ON internships (location_state, location_city);
CREATE INDEX idx_internships_category       ON internships (category, status);
CREATE INDEX idx_internships_created        ON internships (created_at DESC);


-- ── Internship Skills ──────────────────────────────────────

CREATE TABLE internship_skills (
    internship_id UUID NOT NULL REFERENCES internships (id) ON DELETE CASCADE,
    skill_id      INT  NOT NULL REFERENCES skills (id),
    importance    VARCHAR(20) NOT NULL CHECK (importance IN ('required', 'preferred', 'bonus')),
    PRIMARY KEY (internship_id, skill_id)
);

CREATE INDEX idx_internship_skills_lookup ON internship_skills (skill_id, importance);


-- ── Saved Internships ──────────────────────────────────────

CREATE TABLE saved_internships (
    student_id    UUID NOT NULL REFERENCES student_profiles (id) ON DELETE CASCADE,
    internship_id UUID NOT NULL REFERENCES internships (id) ON DELETE CASCADE,
    saved_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (student_id, internship_id)
);

CREATE INDEX idx_saved_internship ON saved_internships (internship_id);


-- ── Applications ───────────────────────────────────────────

CREATE TABLE applications (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id     UUID NOT NULL REFERENCES student_profiles (id),
    internship_id  UUID NOT NULL REFERENCES internships (id),
    status         VARCHAR(20) NOT NULL DEFAULT 'APPLIED'
                   CHECK (status IN ('APPLIED', 'SHORTLISTED', 'HIRED', 'REJECTED', 'WITHDRAWN')),
    status_history JSONB NOT NULL DEFAULT '[]'::jsonb,
    cover_note     TEXT,
    applied_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_application UNIQUE (student_id, internship_id)
);

CREATE INDEX idx_applications_internship ON applications (internship_id, status);
CREATE INDEX idx_applications_student    ON applications (student_id, status);


-- ── Events (partitioned — no FK for write throughput) ──────
-- Design note: No FK constraints on events — intentional for write
-- throughput on partitioned table. Referential integrity validated
-- at application layer. Orphaned references in old events are
-- harmless for training data.

CREATE TABLE events (
    id              BIGINT GENERATED ALWAYS AS IDENTITY,
    idempotency_key UUID NOT NULL,
    user_id         UUID NOT NULL,
    event_type      VARCHAR(30) NOT NULL
                    CHECK (event_type IN ('view', 'save', 'unsave', 'apply', 'click_explain', 'rec_impression')),
    internship_id   UUID,
    metadata        JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
) PARTITION BY RANGE (created_at);

-- Create initial monthly partitions
CREATE TABLE events_2026_01 PARTITION OF events
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE events_2026_02 PARTITION OF events
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE events_2026_03 PARTITION OF events
    FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE TABLE events_2026_04 PARTITION OF events
    FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE events_2026_05 PARTITION OF events
    FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE events_2026_06 PARTITION OF events
    FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');

-- Indexes per partition (applied to parent, inherited by children)
CREATE INDEX idx_events_user_created     ON events (user_id, created_at);
CREATE INDEX idx_events_internship_type  ON events (internship_id, event_type, created_at);
CREATE UNIQUE INDEX idx_events_dedup     ON events (idempotency_key, created_at);


-- ── Recommendation Cache ───────────────────────────────────

CREATE TABLE recommendation_cache (
    user_id        UUID PRIMARY KEY,
    internship_ids UUID[] NOT NULL,
    explanations   JSONB NOT NULL,
    model_version  VARCHAR(50) NOT NULL,
    generated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at     TIMESTAMPTZ NOT NULL
);


-- ── Recommendation Log (immutable, partitioned) ────────────

CREATE TABLE recommendation_log (
    id               BIGINT GENERATED ALWAYS AS IDENTITY,
    user_id          UUID NOT NULL,
    model_version    VARCHAR(50) NOT NULL,
    experiment_id    VARCHAR(50),
    internship_ids   UUID[] NOT NULL,
    scores           FLOAT[] NOT NULL,
    explanations     JSONB,
    fairness_metrics JSONB,
    latency_ms       INT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
) PARTITION BY RANGE (created_at);

CREATE TABLE recommendation_log_2026_q1 PARTITION OF recommendation_log
    FOR VALUES FROM ('2026-01-01') TO ('2026-04-01');
CREATE TABLE recommendation_log_2026_q2 PARTITION OF recommendation_log
    FOR VALUES FROM ('2026-04-01') TO ('2026-07-01');

CREATE INDEX idx_reclog_user_created ON recommendation_log (user_id, created_at);


-- ── Model Artifacts ────────────────────────────────────────

CREATE TABLE model_artifacts (
    id                  SERIAL PRIMARY KEY,
    version             VARCHAR(50) NOT NULL UNIQUE,
    s3_path             VARCHAR(512) NOT NULL,
    metrics             JSONB,
    training_data_range TSTZRANGE,
    trained_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    activated_at        TIMESTAMPTZ,
    active              BOOLEAN NOT NULL DEFAULT FALSE
);

-- Postgres enforces: at most one row where active=true
CREATE UNIQUE INDEX idx_one_active_model ON model_artifacts (active) WHERE active = true;


-- ── Audit Log (immutable, append-only, partitioned) ────────

CREATE TABLE audit_log (
    id          BIGINT GENERATED ALWAYS AS IDENTITY,
    actor_id    UUID NOT NULL,
    action      VARCHAR(100) NOT NULL,
    target_type VARCHAR(50),
    target_id   UUID,
    details     JSONB,
    ip_address  INET,
    request_id  VARCHAR(100),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
) PARTITION BY RANGE (created_at);

CREATE TABLE audit_log_2026_q1 PARTITION OF audit_log
    FOR VALUES FROM ('2026-01-01') TO ('2026-04-01');
CREATE TABLE audit_log_2026_q2 PARTITION OF audit_log
    FOR VALUES FROM ('2026-04-01') TO ('2026-07-01');

CREATE INDEX idx_audit_actor     ON audit_log (actor_id, created_at);
CREATE INDEX idx_audit_target    ON audit_log (target_type, target_id, created_at);
CREATE INDEX idx_audit_action    ON audit_log (action, created_at);


-- ── Update Timestamp Trigger ───────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_internships_updated_at
    BEFORE UPDATE ON internships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_applications_updated_at
    BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ── Grant read access to recs_readonly ─────────────────────
-- (Complements the default privileges set in 01-init-roles.sql)

GRANT SELECT ON ALL TABLES IN SCHEMA public TO recs_readonly;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO recs_readonly;
