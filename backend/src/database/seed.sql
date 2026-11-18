
-- DSO303 Assignment 2
-- Local examination testing data

BEGIN;

-- Create tutor
INSERT INTO users (full_name, email, role)
VALUES ('Demo Tutor', 'tutor@example.com', 'tutor')
ON CONFLICT (email) DO NOTHING;

-- Create student
INSERT INTO users (full_name, email, role)
VALUES ('Demo Student', 'student@example.com', 'student')
ON CONFLICT (email) DO NOTHING;

-- Create published examination
INSERT INTO exams (
    title,
    description,
    created_by,
    start_time,
    duration_minutes,
    status
)
SELECT
    'Cloud Computing Fundamentals',
    'Sample examination for DSO303 Assignment 2',
    id,
    NOW() - INTERVAL '1 minute',
    60,
    'published'
FROM users
WHERE email = 'tutor@example.com'
AND NOT EXISTS (
    SELECT 1 FROM exams
    WHERE title = 'Cloud Computing Fundamentals'
);

-- Create sample questions
INSERT INTO questions (
    exam_id,
    question_text,
    question_type,
    options,
    correct_answer,
    marks
)
SELECT
    e.id,
    'What does AWS stand for?',
    'mcq',
    '["Amazon Web Services", "Advanced Web System", "Automated Web Server"]'::jsonb,
    'Amazon Web Services',
    5
FROM exams e
WHERE e.title = 'Cloud Computing Fundamentals'
AND NOT EXISTS (
    SELECT 1 FROM questions q
    WHERE q.exam_id = e.id
    AND q.question_text = 'What does AWS stand for?'
);

INSERT INTO questions (
    exam_id,
    question_text,
    question_type,
    options,
    correct_answer,
    marks
)
SELECT
    e.id,
    'Explain the purpose of an AWS Availability Zone.',
    'short_answer',
    NULL,
    NULL,
    10
FROM exams e
WHERE e.title = 'Cloud Computing Fundamentals'
AND NOT EXISTS (
    SELECT 1 FROM questions q
    WHERE q.exam_id = e.id
    AND q.question_text =
        'Explain the purpose of an AWS Availability Zone.'
);

COMMIT;
