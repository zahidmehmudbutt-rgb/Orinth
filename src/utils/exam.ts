// Exam utility functions shared across dashboards

import type { ExamType, ExamResult } from '@/types/exam';

/**
 * Get badge color classes for exam type
 */
export function getExamTypeBadgeColor(type: ExamType): string {
  switch (type) {
    case 'weekly_daily':
      return 'bg-blue-100 text-blue-800';
    case 'monthly_midterm':
      return 'bg-amber-100 text-amber-800';
    case 'semester_final':
      return 'bg-purple-100 text-purple-800';
  }
}

/**
 * Get short label for exam type
 */
export function getExamTypeShortLabel(type: ExamType): string {
  switch (type) {
    case 'weekly_daily':
      return 'Weekly';
    case 'monthly_midterm':
      return 'Monthly';
    case 'semester_final':
      return 'Semester';
  }
}

/**
 * Filter results for yearly tab (only monthly and semester exams)
 */
export function filterYearlyResults(results: ExamResult[]): ExamResult[] {
  return results.filter(
    e => e.examType === 'monthly_midterm' || e.examType === 'semester_final'
  );
}

/**
 * Group results by exam type
 */
export function groupResultsByType(results: ExamResult[]): {
  semester: ExamResult[];
  monthly: ExamResult[];
  weekly: ExamResult[];
} {
  return {
    semester: results.filter(e => e.examType === 'semester_final'),
    monthly: results.filter(e => e.examType === 'monthly_midterm'),
    weekly: results.filter(e => e.examType === 'weekly_daily'),
  };
}

/**
 * Format date for display
 */
export function formatExamDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Check if exam type should appear in yearly results
 */
export function isYearlyExamType(type: ExamType): boolean {
  return type === 'monthly_midterm' || type === 'semester_final';
}
