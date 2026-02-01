// Grade calculation utilities shared across dashboards

export type Grade = 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' | 'AB' | '-';

export interface GradeInfo {
  grade: Grade;
  color: string;
  bgColor: string;
}

/**
 * Calculate grade based on percentage
 */
export function calculateGrade(percentage: number | null, isAbsent: boolean = false): Grade {
  if (isAbsent) return 'AB';
  if (percentage === null) return '-';
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D';
  return 'F';
}

/**
 * Get grade color classes for styling
 */
export function getGradeColors(grade: Grade): GradeInfo {
  switch (grade) {
    case 'A+':
      return { grade, color: 'text-green-600', bgColor: 'bg-green-100' };
    case 'A':
      return { grade, color: 'text-green-600', bgColor: 'bg-green-50' };
    case 'B':
      return { grade, color: 'text-blue-600', bgColor: 'bg-blue-50' };
    case 'C':
      return { grade, color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
    case 'D':
      return { grade, color: 'text-orange-600', bgColor: 'bg-orange-50' };
    case 'F':
      return { grade, color: 'text-red-600', bgColor: 'bg-red-50' };
    case 'AB':
      return { grade, color: 'text-gray-600', bgColor: 'bg-gray-100' };
    case '-':
    default:
      return { grade, color: 'text-gray-400', bgColor: 'bg-gray-50' };
  }
}

/**
 * Calculate percentage from marks
 */
export function calculatePercentage(obtained: number | null, max: number): number | null {
  if (obtained === null || max === 0) return null;
  return (obtained / max) * 100;
}

/**
 * Format percentage for display
 */
export function formatPercentage(percentage: number | null): string {
  if (percentage === null) return '-';
  return `${percentage.toFixed(1)}%`;
}

/**
 * Calculate totals for a list of results
 */
export function calculateResultTotals(
  results: Array<{ marksObtained: number | null; maxMarks: number; isAbsent: boolean }>
): { totalObtained: number; totalMax: number; percentage: number; grade: Grade } {
  const gradedResults = results.filter(r => r.marksObtained !== null && !r.isAbsent);

  if (gradedResults.length === 0) {
    return { totalObtained: 0, totalMax: 0, percentage: 0, grade: '-' };
  }

  const totalObtained = gradedResults.reduce((sum, r) => sum + (r.marksObtained || 0), 0);
  const totalMax = gradedResults.reduce((sum, r) => sum + r.maxMarks, 0);
  const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
  const grade = calculateGrade(percentage);

  return { totalObtained, totalMax, percentage, grade };
}

/**
 * Grading scale for display
 */
export const GRADING_SCALE = [
  { grade: 'A+', range: '90-100%', color: 'bg-green-100 text-green-700' },
  { grade: 'A', range: '80-89%', color: 'bg-green-50 text-green-600' },
  { grade: 'B', range: '70-79%', color: 'bg-blue-50 text-blue-600' },
  { grade: 'C', range: '60-69%', color: 'bg-yellow-50 text-yellow-600' },
  { grade: 'D', range: '50-59%', color: 'bg-orange-50 text-orange-600' },
  { grade: 'F', range: 'Below 50%', color: 'bg-red-50 text-red-600' },
] as const;
