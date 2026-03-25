-- Extended PostgreSQL Database Schema for Student ERP System

-- Connect to the database
\c student_results;

-- 1. Create students table (modified)
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    regd_no VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    cgpa DECIMAL(3,2),
    sgpa DECIMAL(3,2),
    semester INTEGER,
    branch VARCHAR(100),
    counsellor VARCHAR(255),
    total_tuition_fee DECIMAL(12,2),
    scholarship_applied DECIMAL(12,2),
    net_payable_amount DECIMAL(12,2),
    amount_paid DECIMAL(12,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Detailed Marks Table (replaces old subject_results)
CREATE TABLE IF NOT EXISTS detailed_marks (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    subject_name VARCHAR(255) NOT NULL,
    grade VARCHAR(10),
    m1 DECIMAL(5,2),          -- out of 20
    pre_t1 DECIMAL(5,2),      -- out of 10
    t2 DECIMAL(5,2),          -- out of 5
    t3 DECIMAL(5,2),          -- out of 5
    t4 DECIMAL(5,2),          -- out of 20
    t5_1 DECIMAL(5,2),        -- T5 internal 1 out of 20
    t5_2 DECIMAL(5,2),        -- T5 internal 2 out of 20
    t5_3 DECIMAL(5,2),        -- T5 internal 3 out of 20
    t5_4 DECIMAL(5,2),        -- T5 internal 4 out of 20
    t5_avg DECIMAL(5,2),      -- Average of T5 1-4 (out of 20)
    final_total DECIMAL(6,2), -- Total marks
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    semester INTEGER NOT NULL,
    subject_name VARCHAR(255) NOT NULL,
    total_classes INTEGER DEFAULT 0,
    attended_classes INTEGER DEFAULT 0,
    attendance_percentage DECIMAL(5,2),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Academic Status Table
CREATE TABLE IF NOT EXISTS academic_status (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    active_backlogs INTEGER DEFAULT 0,
    cleared_backlogs INTEGER DEFAULT 0,
    repeated_subjects TEXT, -- Comma separated or JSON string
    incomplete_subjects TEXT,
    course_completion_status VARCHAR(100) DEFAULT 'In Progress',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. CGPA History Table
CREATE TABLE IF NOT EXISTS cgpa_history (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    semester INTEGER NOT NULL,
    sgpa DECIMAL(3,2) NOT NULL,
    cumulative_cgpa DECIMAL(3,2) NOT NULL,
    academic_year VARCHAR(20)
);

-- 6. Notifications Table (Global or Student-specific)
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'General', -- Notice, Exam, Alert, Meeting
    target_role VARCHAR(50) DEFAULT 'All', -- All, parent, student, faculty
    target_student_id INTEGER REFERENCES students(id) ON DELETE CASCADE NULL, -- NULL means global
    posted_by VARCHAR(100) DEFAULT 'Admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL
);

-- 7. Faculty Contacts Table
CREATE TABLE IF NOT EXISTS faculty_contacts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL, -- HOD, Class Advisor, Subject Teacher
    email VARCHAR(255),
    mobile VARCHAR(20),
    office_location VARCHAR(100),
    department VARCHAR(100)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_students_regd_no ON students(regd_no);
CREATE INDEX IF NOT EXISTS idx_students_mobile ON students(mobile);
CREATE INDEX IF NOT EXISTS idx_detailed_marks_student ON detailed_marks(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_target ON notifications(target_student_id);

-- Insert sample Faculty
INSERT INTO faculty_contacts (name, role, email, mobile, department) VALUES 
('Dr. A. Sharma', 'HOD', 'hod.cse@university.edu', '9876543210', 'CSE'),
('Prof. R. Kumar', 'Class Advisor - 2nd Year', 'rkumar@university.edu', '9876543211', 'CSE'),
('Academic Office', 'Admin Support', 'academic@university.edu', '1800123456', 'Administration');

-- Insert initial Global Notices
INSERT INTO notifications (title, message, type, posted_by) VALUES 
('Mid-Semester Exams Scheduled', 'The Pre-T1 and T2 examinations will commence from next Monday. Please clear any pending fee dues to download hall tickets.', 'Exam', 'Admin'),
('Codefest 2026 Registration', 'Annual technical symposium registrations are open. Students are encouraged to participate in large numbers.', 'Notice', 'Dr. A. Sharma');
