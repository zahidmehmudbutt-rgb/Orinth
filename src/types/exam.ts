// Shared exam types used across Teacher, Student, and Parent dashboards

export type ExamType = 'weekly_daily' | 'monthly_midterm' | 'semester_final';

export interface ExamResult {
  id: string;
  examId: string;
  title: string;
  subject: string;
  examType: ExamType;
  examDate: string;
  marksObtained: number | null;
  maxMarks: number;
  remarks: string | null;
  isAbsent: boolean;
}

export interface ExamItem {
  id: string;
  title: string;
  subject: string;
  examType: ExamType;
  maxMarks: number;
  examDate: string;
  rawExamDate: string;
  className: string;
  classId: string;
  markedCount: number;
  totalStudents: number;
}

export interface StudentMarkEntry {
  studentId: string;
  studentName: string;
  studentCode: string;
  marksObtained: number | null;
  remarks: string | null;
  isAbsent: boolean;
  markId: string | null;
}

export const EXAM_TYPE_LABELS: Record<ExamType, string> = {
  weekly_daily: 'Weekly / Daily Test',
  monthly_midterm: 'Monthly Test / Midterms',
  semester_final: 'Semester / Final Exams',
};

export const EXAM_TYPE_SHORT_LABELS: Record<ExamType, string> = {
  weekly_daily: 'Weekly',
  monthly_midterm: 'Monthly',
  semester_final: 'Semester',
};
