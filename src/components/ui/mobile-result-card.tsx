import { memo } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

interface ResultRow {
  subject: string;
  examTitle: string;
  maxMarks: number;
  obtainedMarks: number | null;
  percentage: number | null;
  grade: string;
  isAbsent?: boolean;
}

interface MobileResultCardProps {
  results: ResultRow[];
  type: "semester" | "monthly";
  totalObtained: number;
  totalMax: number;
  overallPercentage: number;
  overallGrade: string;
}

function getGradeColor(grade: string) {
  switch (grade) {
    case "A+":
    case "A":
      return { bg: "bg-green-100", text: "text-green-700", border: "border-green-200" };
    case "B":
      return { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200" };
    case "C":
      return { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-200" };
    case "D":
      return { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200" };
    case "F":
      return { bg: "bg-red-100", text: "text-red-700", border: "border-red-200" };
    case "Absent":
      return { bg: "bg-gray-100", text: "text-gray-500", border: "border-gray-200" };
    default:
      return { bg: "bg-gray-100", text: "text-gray-500", border: "border-gray-200" };
  }
}

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" as const },
  },
};

function OverallGradeBadge({ grade }: { grade: string }) {
  const color = getGradeColor(grade);
  return (
    <span className={`${color.bg} ${color.text} ${color.border} border text-sm font-bold px-3 py-1.5 rounded-full`}>
      {grade}
    </span>
  );
}

export const MobileResultCards = memo(function MobileResultCards({ results, type, totalObtained, totalMax, overallPercentage, overallGrade }: MobileResultCardProps) {
  const { t } = useTranslation();
  const headerColor = type === "semester"
    ? "from-indigo-500 to-purple-500"
    : "from-amber-500 to-orange-500";

  const headerLabel = type === "semester" ? t("resultCard.semesterExams") : t("resultCard.monthlyTests");

  return (
    <div className="md:hidden">
      {/* Section header */}
      <div className={`bg-gradient-to-r ${headerColor} rounded-t-xl px-4 py-3 mb-0`}>
        <h4 className="text-white font-semibold text-sm">{headerLabel}</h4>
      </div>

      {/* Result cards */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="space-y-2 bg-white rounded-b-xl p-3 border border-t-0 border-slate-200"
      >
        {results.map((row) => {
          const gradeColor = getGradeColor(row.grade);
          return (
            <motion.div
              key={`${row.subject}-${row.examTitle}`}
              variants={staggerItem}
              className="bg-slate-50 rounded-lg p-3 border border-slate-100 card-pressable"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 text-sm truncate">{row.subject}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{row.examTitle}</p>
                </div>
                <span className={`${gradeColor.bg} ${gradeColor.text} ${gradeColor.border} border text-xs font-bold px-2.5 py-1 rounded-full ml-2 shrink-0`}>
                  {row.grade}
                </span>
              </div>

              {row.isAbsent ? (
                <p className="text-gray-400 text-xs italic">{t("resultCard.absent")}</p>
              ) : (
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">{t("resultCard.score")}</span>
                    <span className="font-semibold text-slate-700">
                      {row.obtainedMarks ?? 0}/{row.maxMarks}
                    </span>
                  </div>
                  <div
                    className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden"
                    role="progressbar"
                    aria-valuenow={Math.round(row.percentage ?? 0)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${row.subject} score: ${(row.percentage ?? 0).toFixed(1)}%`}
                  >
                    <div
                      className={`h-full rounded-full transition-all ${
                        (row.percentage ?? 0) >= 80
                          ? "bg-green-500"
                          : (row.percentage ?? 0) >= 60
                            ? "bg-blue-500"
                            : (row.percentage ?? 0) >= 50
                              ? "bg-yellow-500"
                              : "bg-red-500"
                      }`}
                      style={{ width: `${Math.min(row.percentage ?? 0, 100)}%` }}
                    />
                  </div>
                  <span className="font-semibold text-slate-600 shrink-0">
                    {(row.percentage ?? 0).toFixed(1)}%
                  </span>
                </div>
              )}
            </motion.div>
          );
        })}

        {/* Totals footer */}
        <motion.div
          variants={staggerItem}
          className={`bg-gradient-to-r ${type === "semester" ? "from-indigo-50 to-purple-50 border-indigo-200" : "from-amber-50 to-orange-50 border-amber-200"} rounded-lg p-3 border mt-1`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">{t("resultCard.overallTotal")}</p>
              <p className="font-bold text-slate-800 text-lg">{totalObtained}/{totalMax}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 font-medium">{t("resultCard.percentage")}</p>
              <p className="font-bold text-slate-800 text-lg">{overallPercentage.toFixed(1)}%</p>
            </div>
            <OverallGradeBadge grade={overallGrade} />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
});
