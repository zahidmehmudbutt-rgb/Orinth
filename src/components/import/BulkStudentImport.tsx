import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import Papa from "papaparse";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";

interface BulkStudentImportProps {
  classId: string;
  schoolId: string;
  onImportComplete?: () => void;
}

interface ParsedRow {
  full_name: string;
  student_id: string;
  email: string;
  phone: string;
}

interface ValidatedRow extends ParsedRow {
  rowIndex: number;
  errors: string[];
  isValid: boolean;
}

interface ImportResult {
  imported: number;
  failed: number;
  errors: string[];
}

export function BulkStudentImport({
  classId,
  schoolId,
  onImportComplete,
}: BulkStudentImportProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [parsedRows, setParsedRows] = useState<ValidatedRow[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const downloadTemplate = () => {
    const csvContent = "full_name,student_id,email,phone\nAhmed Ali,STU001,ahmed@example.com,03001234567\nFatima Khan,STU002,,\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "student_import_template.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const validateRows = (rows: ParsedRow[]): ValidatedRow[] => {
    const studentIdCounts = new Map<string, number>();
    rows.forEach((row) => {
      const id = row.student_id?.trim().toLowerCase();
      if (id) {
        studentIdCounts.set(id, (studentIdCounts.get(id) || 0) + 1);
      }
    });

    return rows.map((row, index) => {
      const errors: string[] = [];

      if (!row.full_name?.trim()) {
        errors.push(
          t("bulkImport.errorRequired", {
            field: t("bulkImport.columnName"),
          })
        );
      }

      if (!row.student_id?.trim()) {
        errors.push(
          t("bulkImport.errorRequired", {
            field: t("bulkImport.columnStudentId"),
          })
        );
      } else {
        const id = row.student_id.trim().toLowerCase();
        if ((studentIdCounts.get(id) || 0) > 1) {
          errors.push(t("bulkImport.errorDuplicate", { id: row.student_id.trim() }));
        }
      }

      return {
        ...row,
        rowIndex: index + 1,
        errors,
        isValid: errors.length === 0,
      };
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParseError(null);
    setImportResult(null);
    setParsedRows([]);

    Papa.parse<ParsedRow>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase(),
      complete: (results) => {
        if (results.errors.length > 0) {
          setParseError(
            t("bulkImport.parseError") + ": " + results.errors[0].message
          );
          return;
        }

        if (results.data.length === 0) {
          setParseError(t("bulkImport.noData"));
          return;
        }

        const validated = validateRows(results.data);
        setParsedRows(validated);
      },
      error: (error) => {
        setParseError(t("bulkImport.parseError") + ": " + error.message);
      },
    });

    // Reset file input so the same file can be re-selected
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImport = async () => {
    const validRows = parsedRows.filter((row) => row.isValid);
    if (validRows.length === 0) return;

    setIsImporting(true);
    setImportProgress(0);

    const result: ImportResult = { imported: 0, failed: 0, errors: [] };

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      try {
        const studentIdTrimmed = row.student_id.trim();
        const email =
          row.email?.trim() ||
          `${studentIdTrimmed.toLowerCase()}@school.local`;
        const password = `School@${studentIdTrimmed}`;

        // Check if student_id already exists in the school
        const { data: existing } = await supabase
          .from("students")
          .select("id")
          .eq("student_id", studentIdTrimmed)
          .eq("school_id", schoolId)
          .single();

        if (existing) {
          result.failed++;
          result.errors.push(
            `Row ${row.rowIndex}: ${t("bulkImport.errorDuplicate", { id: studentIdTrimmed })}`
          );
          setImportProgress(Math.round(((i + 1) / validRows.length) * 100));
          continue;
        }

        // Create auth user via edge function
        const response = await supabase.functions.invoke("create-school-user", {
          body: {
            email,
            password,
            fullName: row.full_name.trim(),
            role: "student",
            schoolId,
          },
        });

        if (response.error) {
          let errorData = null;
          try {
            errorData = response.error.context?.body
              ? JSON.parse(
                  new TextDecoder().decode(response.error.context.body)
                )
              : null;
          } catch {
            /* ignore parse errors */
          }
          const errorMessage =
            errorData?.error ||
            response.error.message ||
            "Failed to create account";
          throw new Error(errorMessage);
        }

        if (!response.data?.success) {
          throw new Error(
            response.data?.error || "Failed to create student account"
          );
        }

        const userId = response.data.userId;

        // Insert student record
        const { error: studentError } = await supabase
          .from("students")
          .insert({
            student_id: studentIdTrimmed,
            full_name: row.full_name.trim(),
            class_id: classId,
            school_id: schoolId,
            user_id: userId || null,
          });

        if (studentError) throw studentError;

        result.imported++;
      } catch (error) {
        result.failed++;
        result.errors.push(
          `Row ${row.rowIndex}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }

      setImportProgress(Math.round(((i + 1) / validRows.length) * 100));
    }

    setImportResult(result);
    setIsImporting(false);

    if (result.imported > 0) {
      toast({
        title: t("bulkImport.success"),
        description: t("bulkImport.successDesc", {
          count: result.imported,
        }),
      });
      onImportComplete?.();
    }

    if (result.failed > 0) {
      toast({
        variant: "destructive",
        title: t("bulkImport.errorTitle"),
        description: t("bulkImport.errorDesc", {
          count: result.failed,
        }),
      });
    }
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.filter((r) => !r.isValid).length;

  return (
    <Card className="border border-border shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <FileSpreadsheet className="w-5 h-5 text-role-class-teacher" />
          {t("bulkImport.title")}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {t("bulkImport.description")}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Actions row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            className="gap-2"
            onClick={downloadTemplate}
          >
            <Download className="w-4 h-4" />
            {t("bulkImport.downloadTemplate")}
          </Button>

          <div className="relative">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isImporting}
            />
            <Button variant="outline" className="gap-2 pointer-events-none w-full sm:w-auto">
              <Upload className="w-4 h-4" />
              {t("bulkImport.selectFile")}
            </Button>
          </div>
        </div>

        {/* Parse error */}
        {parseError && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {parseError}
          </div>
        )}

        {/* Preview table */}
        {parsedRows.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">
                {t("bulkImport.preview")}
              </h3>
              <div className="flex gap-2">
                <Badge variant="default" className="bg-success text-success-foreground">
                  {validCount} {t("bulkImport.valid")}
                </Badge>
                {invalidCount > 0 && (
                  <Badge variant="destructive">
                    {invalidCount} {t("bulkImport.invalid")}
                  </Badge>
                )}
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left p-3 font-medium text-muted-foreground">
                      #
                    </th>
                    <th className="text-left p-3 font-medium text-muted-foreground">
                      {t("bulkImport.columnName")}
                    </th>
                    <th className="text-left p-3 font-medium text-muted-foreground">
                      {t("bulkImport.columnStudentId")}
                    </th>
                    <th className="text-left p-3 font-medium text-muted-foreground">
                      {t("bulkImport.columnEmail")}
                    </th>
                    <th className="text-left p-3 font-medium text-muted-foreground">
                      {t("bulkImport.columnPhone")}
                    </th>
                    <th className="text-left p-3 font-medium text-muted-foreground">
                      {t("bulkImport.status")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.map((row) => (
                    <tr
                      key={row.rowIndex}
                      className={`border-t border-border ${
                        row.isValid
                          ? "bg-success/5"
                          : "bg-destructive/5"
                      }`}
                    >
                      <td className="p-3 text-muted-foreground">
                        {row.rowIndex}
                      </td>
                      <td className="p-3 text-foreground">
                        {row.full_name || "-"}
                      </td>
                      <td className="p-3 text-foreground">
                        {row.student_id || "-"}
                      </td>
                      <td className="p-3 text-foreground">
                        {row.email || "-"}
                      </td>
                      <td className="p-3 text-foreground">
                        {row.phone || "-"}
                      </td>
                      <td className="p-3">
                        {row.isValid ? (
                          <CheckCircle className="w-4 h-4 text-success" />
                        ) : (
                          <div className="flex items-start gap-1">
                            <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                            <span className="text-xs text-destructive">
                              {row.errors.join("; ")}
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Import button */}
            {!importResult && (
              <Button
                className="w-full bg-role-class-teacher text-primary-foreground hover:opacity-90 gap-2"
                onClick={handleImport}
                disabled={isImporting || validCount === 0}
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t("bulkImport.importing")} ({importProgress}%)
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    {t("bulkImport.import")} ({validCount})
                  </>
                )}
              </Button>
            )}

            {/* Progress bar */}
            {isImporting && (
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-role-class-teacher h-2 rounded-full transition-all duration-300"
                  style={{ width: `${importProgress}%` }}
                />
              </div>
            )}

            {/* Import results */}
            {importResult && (
              <div className="space-y-2 p-4 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1 text-success font-medium">
                    <CheckCircle className="w-4 h-4" />
                    {importResult.imported} {t("bulkImport.imported")}
                  </span>
                  {importResult.failed > 0 && (
                    <span className="flex items-center gap-1 text-destructive font-medium">
                      <AlertCircle className="w-4 h-4" />
                      {importResult.failed} {t("bulkImport.failed")}
                    </span>
                  )}
                </div>
                {importResult.errors.length > 0 && (
                  <div className="space-y-1 mt-2">
                    {importResult.errors.map((err, i) => (
                      <p key={i} className="text-xs text-destructive">
                        {err}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
