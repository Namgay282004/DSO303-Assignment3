
-- DSO303 Assignment 2
-- University Examination Database

-- 1. Users
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT,
    role VARCHAR(20) NOT NULL
        CHECK (role IN ('student', 'tutor', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Exams
CREATE TABLE IF NOT EXISTS exams (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_by INTEGER NOT NULL REFERENCES users(id),
    start_time TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL
        CHECK (duration_minutes > 0),
    status VARCHAR(20) DEFAULT 'draft'
        CHECK (status IN ('draft', 'published', 'closed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Questions
CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    exam_id INTEGER NOT NULL REFERENCES exams(id),
    question_text TEXT NOT NULL,
    question_type VARCHAR(20) NOT NULL
        CHECK (question_type IN ('mcq', 'short_answer')),
    options JSONB,
    correct_answer TEXT,
    marks INTEGER NOT NULL DEFAULT 1
        CHECK (marks > 0)
);

-- 4. Exam Attempts
CREATE TABLE IF NOT EXISTS exam_attempts (
    id SERIAL PRIMARY KEY,
    exam_id INTEGER NOT NULL REFERENCES exams(id),
    student_id INTEGER NOT NULL REFERENCES users(id),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'in_progress'
        CHECK (status IN ('in_progress', 'submitted')),
    UNIQUE (exam_id, student_id)
);

-- 5. Autosaved Answers
CREATE TABLE IF NOT EXISTS answers (
    id SERIAL PRIMARY KEY,
    attempt_id INTEGER NOT NULL REFERENCES exam_attempts(id),
    question_id INTEGER NOT NULL REFERENCES questions(id),
    answer_text TEXT,
    saved_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (attempt_id, question_id)
);

-- 6. Assignments
CREATE TABLE IF NOT EXISTS assignments (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_by INTEGER NOT NULL REFERENCES users(id),
    deadline TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Assignment Submissions
CREATE TABLE IF NOT EXISTS submissions (
    id SERIAL PRIMARY KEY,
    assignment_id INTEGER NOT NULL REFERENCES assignments(id),
    student_id INTEGER NOT NULL REFERENCES users(id),
    file_key TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL
        CHECK (file_size > 0 AND file_size <= 52428800),
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'submitted'
        CHECK (status IN ('submitted', 'processing', 'marked')),
    UNIQUE (assignment_id, student_id)
);

-- 8. Results
CREATE TABLE IF NOT EXISTS results (
    id SERIAL PRIMARY KEY,
    attempt_id INTEGER UNIQUE NOT NULL
        REFERENCES exam_attempts(id),
    total_marks NUMERIC(8,2) DEFAULT 0,
    obtained_marks NUMERIC(8,2) DEFAULT 0,
    released BOOLEAN DEFAULT FALSE,
    released_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_exams_start
    ON exams(start_time);

CREATE INDEX IF NOT EXISTS idx_answers_attempt
    ON answers(attempt_id);

CREATE INDEX IF NOT EXISTS idx_submissions_student
    ON submissions(student_id);

CREATE INDEX IF NOT EXISTS idx_attempts_student
    ON exam_attempts(student_id);
