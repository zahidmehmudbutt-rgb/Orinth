import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal, Award, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface LeaderboardEntry {
  studentName: string;
  studentId: string;
  averagePercentage: number;
  examCount: number;
}

interface LeaderboardProps {
  classId: string;
  currentStudentId?: string;
  className?: string;
}

const RANK_ICONS = [
  <Trophy className="w-5 h-5 text-yellow-500" />,
  <Medal className="w-5 h-5 text-muted-foreground" />,
  <Award className="w-5 h-5 text-amber-700" />,
];

export function Leaderboard({ classId, currentStudentId, className }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    if (!classId) return;
    fetchLeaderboard();
  }, [classId]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      // Get all exams for this class
      const { data: exams } = await supabase
        .from("exam_results")
        .select("id, max_marks")
        .eq("class_id", classId);

      if (!exams || exams.length === 0) {
        setEntries([]);
        setLoading(false);
        return;
      }

      const examIds = exams.map(e => e.id);
      const examMaxMap = new Map(exams.map(e => [e.id, e.max_marks]));

      // Get all student marks for those exams
      const { data: marks } = await supabase
        .from("student_exam_marks")
        .select("student_id, exam_id, marks_obtained, is_absent")
        .in("exam_id", examIds);

      if (!marks || marks.length === 0) {
        setEntries([]);
        setLoading(false);
        return;
      }

      // Get students in this class
      const { data: students } = await supabase
        .from("students")
        .select("id, full_name, student_id")
        .eq("class_id", classId);

      if (!students) {
        setEntries([]);
        setLoading(false);
        return;
      }

      const studentMap = new Map(students.map(s => [s.id, { name: s.full_name, sid: s.student_id }]));

      // Calculate average percentage per student
      const studentScores = new Map<string, { total: number; max: number; count: number }>();

      marks.forEach(m => {
        if (m.is_absent || m.marks_obtained === null) return;
        const maxMarks = examMaxMap.get(m.exam_id) || 0;
        if (maxMarks === 0) return;

        const existing = studentScores.get(m.student_id) || { total: 0, max: 0, count: 0 };
        existing.total += m.marks_obtained;
        existing.max += maxMarks;
        existing.count += 1;
        studentScores.set(m.student_id, existing);
      });

      const leaderboard: LeaderboardEntry[] = [];
      studentScores.forEach((scores, studentId) => {
        const student = studentMap.get(studentId);
        if (!student || scores.count === 0) return;
        leaderboard.push({
          studentName: student.name,
          studentId: student.sid,
          averagePercentage: Math.round((scores.total / scores.max) * 100),
          examCount: scores.count,
        });
      });

      leaderboard.sort((a, b) => b.averagePercentage - a.averagePercentage);
      setEntries(leaderboard.slice(0, 10));
    } catch (error) {
      if (import.meta.env.DEV) console.error("Leaderboard error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (entries.length === 0) return null;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          {t("leaderboard.title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {entries.map((entry, index) => {
            const isCurrentStudent = entry.studentId === currentStudentId;
            return (
              <div
                key={entry.studentId}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  isCurrentStudent
                    ? "bg-primary/10 border border-primary/20"
                    : index < 3
                    ? "bg-muted/50"
                    : ""
                }`}
              >
                <div className="w-8 text-center flex-shrink-0">
                  {index < 3 ? (
                    RANK_ICONS[index]
                  ) : (
                    <span className="text-sm font-semibold text-muted-foreground">#{index + 1}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isCurrentStudent ? "text-primary" : "text-foreground"}`}>
                    {entry.studentName}
                    {isCurrentStudent && <span className="text-xs ml-1">{t("leaderboard.you")}</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">{t("leaderboard.exams", { count: entry.examCount })}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className={`text-sm font-bold ${
                    entry.averagePercentage >= 80 ? "text-success" :
                    entry.averagePercentage >= 60 ? "text-warning" : "text-destructive"
                  }`}>
                    {entry.averagePercentage}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
