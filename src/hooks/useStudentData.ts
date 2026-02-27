import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface StudentRecord {
  id: string;
  student_id: string;
  full_name: string;
  class_id: string;
  school_id: string;
  classes: { id: string; name: string; section: string } | null;
}

interface SchoolInfo {
  name?: string;
  address?: string;
  logo_url?: string;
}

export interface StudentData {
  id: string;
  studentId: string;
  name: string;
  className: string;
  classId: string;
  schoolId: string;
  schoolName?: string;
  schoolAddress?: string;
  schoolLogo?: string;
}

async function fetchStudentRecord(userId: string): Promise<StudentData | null> {
  const { data: student, error } = await supabase
    .from("students")
    .select(`
      id,
      student_id,
      full_name,
      class_id,
      school_id,
      classes (id, name, section)
    `)
    .eq("user_id", userId)
    .single();

  if (error || !student) return null;

  const s = student as unknown as StudentRecord;
  const classInfo = s.classes;

  let schoolInfo: SchoolInfo = {};
  if (s.school_id) {
    const { data: school } = await supabase
      .from("schools")
      .select("name, address, logo_url")
      .eq("id", s.school_id)
      .maybeSingle();
    if (school) schoolInfo = school;
  }

  return {
    id: s.id,
    studentId: s.student_id,
    name: s.full_name,
    className: classInfo ? `${classInfo.name}-${classInfo.section}` : "Not assigned",
    classId: s.class_id,
    schoolId: s.school_id,
    schoolName: schoolInfo.name,
    schoolAddress: schoolInfo.address,
    schoolLogo: schoolInfo.logo_url,
  };
}

/**
 * React Query hook for fetching student data with school info.
 * Requires authenticated user session.
 */
export function useStudentData(userId: string | undefined) {
  return useQuery({
    queryKey: ["student-data", userId],
    queryFn: () => fetchStudentRecord(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch attendance summary for a student.
 */
export function useStudentAttendance(studentId: string | undefined) {
  return useQuery({
    queryKey: ["student-attendance", studentId],
    queryFn: async () => {
      const { data: records } = await supabase
        .from("attendance")
        .select("date, is_present")
        .eq("student_id", studentId!)
        .order("date", { ascending: false })
        .limit(30);

      if (!records || records.length === 0) {
        return { present: 0, absent: 0, percentage: 0, recent: [] };
      }

      const present = records.filter(r => r.is_present).length;
      const absent = records.filter(r => !r.is_present).length;
      const total = present + absent;

      return {
        present,
        absent,
        percentage: total > 0 ? Math.round((present / total) * 100) : 0,
        recent: records.slice(0, 7).map(r => ({
          date: new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          day: new Date(r.date).toLocaleDateString("en-US", { weekday: "short" }),
          status: r.is_present ? "present" as const : "absent" as const,
        })),
      };
    },
    enabled: !!studentId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Fetch exam results for a student in a class.
 */
export function useExamResults(studentId: string | undefined, classId: string | undefined) {
  return useQuery({
    queryKey: ["exam-results", studentId, classId],
    queryFn: async () => {
      // Get all exam results for the class with subject info via JOIN
      const { data: exams } = await supabase
        .from("exam_results")
        .select("id, exam_type, max_marks, subject_id, subjects(name)")
        .eq("class_id", classId!);

      if (!exams || exams.length === 0) return [];

      const examIds = exams.map(e => e.id);

      // Get student marks for all exams in one query
      const { data: studentMarks } = await supabase
        .from("student_exam_marks")
        .select("exam_id, marks_obtained, is_absent, teacher_remarks")
        .eq("student_id", studentId!)
        .in("exam_id", examIds);

      const marksMap = new Map(
        (studentMarks || []).map(m => [m.exam_id, m])
      );

      return exams.map(exam => {
        const mark = marksMap.get(exam.id);
        const subjectData = exam.subjects as unknown as { name: string } | null;
        return {
          examId: exam.id,
          examType: exam.exam_type,
          subject: subjectData?.name || "Unknown",
          maxMarks: exam.max_marks,
          marksObtained: mark?.marks_obtained ?? null,
          isAbsent: mark?.is_absent ?? false,
          teacherRemarks: mark?.teacher_remarks ?? null,
        };
      });
    },
    enabled: !!studentId && !!classId,
    staleTime: 5 * 60 * 1000,
  });
}
