-- Migration: Add Exam Results Management System
-- This migration adds tables for teachers to create exams and assign marks to students

-- Create exam type enum
CREATE TYPE exam_type AS ENUM ('weekly_daily', 'monthly_midterm', 'semester_final');

-- Create exam_results table (stores exam/test definitions)
CREATE TABLE IF NOT EXISTS exam_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    exam_type exam_type NOT NULL DEFAULT 'weekly_daily',
    max_marks INTEGER NOT NULL CHECK (max_marks >= 1 AND max_marks <= 1000),
    exam_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create student_exam_marks table (stores individual student marks)
CREATE TABLE IF NOT EXISTS student_exam_marks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES exam_results(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    marks_obtained INTEGER,
    remarks TEXT,
    is_absent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Unique constraint: one entry per student per exam
    UNIQUE(exam_id, student_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_exam_results_school_id ON exam_results(school_id);
CREATE INDEX idx_exam_results_class_id ON exam_results(class_id);
CREATE INDEX idx_exam_results_teacher_id ON exam_results(teacher_id);
CREATE INDEX idx_exam_results_exam_type ON exam_results(exam_type);
CREATE INDEX idx_exam_results_exam_date ON exam_results(exam_date);
CREATE INDEX idx_student_exam_marks_exam_id ON student_exam_marks(exam_id);
CREATE INDEX idx_student_exam_marks_student_id ON student_exam_marks(student_id);

-- Trigger function to validate marks don't exceed max_marks
CREATE OR REPLACE FUNCTION validate_exam_marks()
RETURNS TRIGGER AS $$
DECLARE
    max_marks_value INTEGER;
BEGIN
    -- Skip validation if marks_obtained is NULL or student is absent
    IF NEW.marks_obtained IS NULL OR NEW.is_absent = TRUE THEN
        RETURN NEW;
    END IF;

    -- Get max_marks from the exam
    SELECT max_marks INTO max_marks_value
    FROM exam_results
    WHERE id = NEW.exam_id;

    IF NEW.marks_obtained < 0 OR NEW.marks_obtained > max_marks_value THEN
        RAISE EXCEPTION 'Marks obtained (%) must be between 0 and %', NEW.marks_obtained, max_marks_value;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for marks validation
CREATE TRIGGER trigger_validate_exam_marks
    BEFORE INSERT OR UPDATE ON student_exam_marks
    FOR EACH ROW
    EXECUTE FUNCTION validate_exam_marks();

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_exam_results_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for auto-updating timestamps
CREATE TRIGGER trigger_exam_results_updated_at
    BEFORE UPDATE ON exam_results
    FOR EACH ROW
    EXECUTE FUNCTION update_exam_results_timestamp();

CREATE TRIGGER trigger_student_exam_marks_updated_at
    BEFORE UPDATE ON student_exam_marks
    FOR EACH ROW
    EXECUTE FUNCTION update_exam_results_timestamp();

-- Enable RLS
ALTER TABLE exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_exam_marks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for exam_results

-- Teachers can view exams they created
CREATE POLICY "Teachers can view own exams"
    ON exam_results FOR SELECT
    USING (teacher_id = auth.uid());

-- Teachers can create exams
CREATE POLICY "Teachers can create exams"
    ON exam_results FOR INSERT
    WITH CHECK (teacher_id = auth.uid());

-- Teachers can update their own exams
CREATE POLICY "Teachers can update own exams"
    ON exam_results FOR UPDATE
    USING (teacher_id = auth.uid());

-- Teachers can delete their own exams
CREATE POLICY "Teachers can delete own exams"
    ON exam_results FOR DELETE
    USING (teacher_id = auth.uid());

-- Students can view exams for their class
CREATE POLICY "Students can view class exams"
    ON exam_results FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM students s
            WHERE s.user_id = auth.uid()
            AND s.class_id = exam_results.class_id
        )
    );

-- Parents can view exams for their children's classes
CREATE POLICY "Parents can view children class exams"
    ON exam_results FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM parent_students ps
            JOIN students s ON ps.student_id = s.id
            WHERE ps.parent_id = auth.uid()
            AND s.class_id = exam_results.class_id
        )
    );

-- RLS Policies for student_exam_marks

-- Teachers can view marks for exams they created
CREATE POLICY "Teachers can view marks for own exams"
    ON student_exam_marks FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM exam_results er
            WHERE er.id = student_exam_marks.exam_id
            AND er.teacher_id = auth.uid()
        )
    );

-- Teachers can insert marks for their exams
CREATE POLICY "Teachers can insert marks for own exams"
    ON student_exam_marks FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM exam_results er
            WHERE er.id = exam_id
            AND er.teacher_id = auth.uid()
        )
    );

-- Teachers can update marks for their exams
CREATE POLICY "Teachers can update marks for own exams"
    ON student_exam_marks FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM exam_results er
            WHERE er.id = student_exam_marks.exam_id
            AND er.teacher_id = auth.uid()
        )
    );

-- Teachers can delete marks for their exams
CREATE POLICY "Teachers can delete marks for own exams"
    ON student_exam_marks FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM exam_results er
            WHERE er.id = student_exam_marks.exam_id
            AND er.teacher_id = auth.uid()
        )
    );

-- Students can view their own marks
CREATE POLICY "Students can view own marks"
    ON student_exam_marks FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM students s
            WHERE s.user_id = auth.uid()
            AND s.id = student_exam_marks.student_id
        )
    );

-- Parents can view their children's marks
CREATE POLICY "Parents can view children marks"
    ON student_exam_marks FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM parent_students ps
            WHERE ps.parent_id = auth.uid()
            AND ps.student_id = student_exam_marks.student_id
        )
    );

-- Principals can view all exams in their school
CREATE POLICY "Principals can view school exams"
    ON exam_results FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'principal'
            AND ur.school_id = exam_results.school_id
            AND ur.is_active = true
        )
    );

-- Coordinators can view all exams in their school
CREATE POLICY "Coordinators can view school exams"
    ON exam_results FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'coordinator'
            AND ur.school_id = exam_results.school_id
            AND ur.is_active = true
        )
    );

-- Class teachers can view exams for their classes
CREATE POLICY "Class teachers can view class exams"
    ON exam_results FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM classes c
            WHERE c.id = exam_results.class_id
            AND c.class_teacher_id = auth.uid()
        )
    );

-- Principals can view all marks in their school
CREATE POLICY "Principals can view school marks"
    ON student_exam_marks FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM exam_results er
            JOIN user_roles ur ON ur.school_id = er.school_id
            WHERE er.id = student_exam_marks.exam_id
            AND ur.user_id = auth.uid()
            AND ur.role = 'principal'
            AND ur.is_active = true
        )
    );

-- Coordinators can view all marks in their school
CREATE POLICY "Coordinators can view school marks"
    ON student_exam_marks FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM exam_results er
            JOIN user_roles ur ON ur.school_id = er.school_id
            WHERE er.id = student_exam_marks.exam_id
            AND ur.user_id = auth.uid()
            AND ur.role = 'coordinator'
            AND ur.is_active = true
        )
    );

-- Class teachers can view marks for their classes
CREATE POLICY "Class teachers can view class marks"
    ON student_exam_marks FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM exam_results er
            JOIN classes c ON c.id = er.class_id
            WHERE er.id = student_exam_marks.exam_id
            AND c.class_teacher_id = auth.uid()
        )
    );

-- Add comment for documentation
COMMENT ON TABLE exam_results IS 'Stores exam/test definitions created by teachers';
COMMENT ON TABLE student_exam_marks IS 'Stores individual student marks for exams';
COMMENT ON TYPE exam_type IS 'Types: weekly_daily (Student/Parent only), monthly_midterm (+ Yearly Results), semester_final (+ Yearly Results)';
