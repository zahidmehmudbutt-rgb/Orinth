/**
 * Export data as a CSV file and trigger download
 */
export function exportToCSV(
  data: Record<string, unknown>[],
  fileName: string,
  columns?: { key: string; label: string }[]
): void {
  if (data.length === 0) return;

  const cols = columns || Object.keys(data[0]).map((key) => ({ key, label: key }));

  const header = cols.map((c) => `"${c.label}"`).join(",");
  const rows = data.map((row) =>
    cols
      .map((c) => {
        const value = row[c.key];
        if (value === null || value === undefined) return '""';
        const str = String(value).replace(/"/g, '""');
        return `"${str}"`;
      })
      .join(",")
  );

  const csvContent = [header, ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, `${fileName}.csv`);
}

/**
 * Export data as a styled PDF table
 */
export async function exportTableToPDF(
  data: Record<string, unknown>[],
  fileName: string,
  options: {
    title: string;
    subtitle?: string;
    columns: { key: string; label: string; width?: number }[];
    schoolName?: string;
    generatedDate?: string;
  }
): Promise<void> {
  if (data.length === 0) return;

  const { default: jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const usableWidth = pageWidth - margin * 2;

  let y = margin;

  // Header
  if (options.schoolName) {
    pdf.setFontSize(10);
    pdf.setTextColor(120, 120, 120);
    pdf.text(options.schoolName, margin, y);
    y += 6;
  }

  pdf.setFontSize(16);
  pdf.setTextColor(30, 30, 30);
  pdf.text(options.title, margin, y);
  y += 7;

  if (options.subtitle) {
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text(options.subtitle, margin, y);
    y += 5;
  }

  const dateStr = options.generatedDate || new Date().toLocaleDateString();
  pdf.setFontSize(8);
  pdf.setTextColor(150, 150, 150);
  pdf.text(`Generated: ${dateStr}`, margin, y);
  y += 8;

  // Separator line
  pdf.setDrawColor(220, 220, 220);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 5;

  // Table
  const cols = options.columns;
  const totalWeight = cols.reduce((sum, c) => sum + (c.width || 1), 0);
  const colWidths = cols.map((c) => ((c.width || 1) / totalWeight) * usableWidth);

  // Table header
  pdf.setFillColor(245, 247, 250);
  pdf.rect(margin, y, usableWidth, 8, "F");
  pdf.setFontSize(8);
  pdf.setTextColor(80, 80, 80);

  let x = margin;
  cols.forEach((col, i) => {
    pdf.text(col.label, x + 2, y + 5.5, { maxWidth: colWidths[i] - 4 });
    x += colWidths[i];
  });
  y += 10;

  // Table rows
  pdf.setTextColor(50, 50, 50);
  data.forEach((row, rowIndex) => {
    if (y > pageHeight - 20) {
      pdf.addPage();
      y = margin;
    }

    if (rowIndex % 2 === 0) {
      pdf.setFillColor(252, 252, 253);
      pdf.rect(margin, y - 2, usableWidth, 8, "F");
    }

    x = margin;
    cols.forEach((col, i) => {
      const value = row[col.key];
      const text = value === null || value === undefined ? "-" : String(value);
      pdf.setFontSize(7.5);
      pdf.text(text, x + 2, y + 3.5, { maxWidth: colWidths[i] - 4 });
      x += colWidths[i];
    });
    y += 8;
  });

  // Footer
  y += 5;
  pdf.setDrawColor(220, 220, 220);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 5;
  pdf.setFontSize(7);
  pdf.setTextColor(150, 150, 150);
  pdf.text(`Total Records: ${data.length}`, margin, y);
  pdf.text("School Smart Pakistan", pageWidth - margin, y, { align: "right" });

  pdf.save(`${fileName}.pdf`);
}

/**
 * Export attendance data as a formatted PDF report
 */
export async function exportAttendanceReport(
  data: {
    studentName: string;
    studentId: string;
    present: number;
    absent: number;
    total: number;
    percentage: number;
  }[],
  fileName: string,
  options: { className: string; schoolName?: string; dateRange?: string }
): Promise<void> {
  await exportTableToPDF(
    data.map((d) => ({
      ...d,
      percentage: `${d.percentage.toFixed(1)}%`,
      status: d.percentage >= 75 ? "Good" : d.percentage >= 50 ? "Warning" : "Critical",
    })),
    fileName,
    {
      title: `Attendance Report - ${options.className}`,
      subtitle: options.dateRange || "All Time",
      schoolName: options.schoolName,
      columns: [
        { key: "studentName", label: "Student Name", width: 3 },
        { key: "studentId", label: "ID", width: 1.5 },
        { key: "present", label: "Present", width: 1 },
        { key: "absent", label: "Absent", width: 1 },
        { key: "total", label: "Total", width: 1 },
        { key: "percentage", label: "Attendance %", width: 1.5 },
        { key: "status", label: "Status", width: 1 },
      ],
    }
  );
}

/**
 * Export student list as CSV/PDF
 */
export async function exportStudentList(
  students: { name: string; studentId: string; email?: string; class?: string; status?: string }[],
  fileName: string,
  format: "csv" | "pdf",
  schoolName?: string
): Promise<void> {
  const columns = [
    { key: "name", label: "Student Name", width: 3 },
    { key: "studentId", label: "Student ID", width: 2 },
    { key: "email", label: "Email", width: 3 },
    { key: "class", label: "Class", width: 1.5 },
    { key: "status", label: "Status", width: 1 },
  ];

  if (format === "csv") {
    exportToCSV(students, fileName, columns);
  } else {
    await exportTableToPDF(students, fileName, {
      title: "Student List",
      schoolName,
      columns,
    });
  }
}

/**
 * Export exam results as PDF
 */
export async function exportResultSheet(
  results: {
    studentName: string;
    studentId: string;
    marksObtained: number;
    maxMarks: number;
    percentage: number;
    grade: string;
  }[],
  fileName: string,
  options: { examTitle: string; subject: string; className: string; schoolName?: string }
): Promise<void> {
  await exportTableToPDF(
    results.map((r) => ({
      ...r,
      percentage: `${r.percentage.toFixed(1)}%`,
    })),
    fileName,
    {
      title: `Result Sheet - ${options.examTitle}`,
      subtitle: `${options.subject} | ${options.className}`,
      schoolName: options.schoolName,
      columns: [
        { key: "studentName", label: "Student Name", width: 3 },
        { key: "studentId", label: "ID", width: 1.5 },
        { key: "marksObtained", label: "Marks", width: 1 },
        { key: "maxMarks", label: "Total", width: 1 },
        { key: "percentage", label: "%", width: 1 },
        { key: "grade", label: "Grade", width: 1 },
      ],
    }
  );
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
