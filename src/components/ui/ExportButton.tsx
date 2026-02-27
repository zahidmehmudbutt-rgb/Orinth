import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exportToCSV, exportTableToPDF } from "@/lib/utils/data-export";

interface ExportColumn {
  key: string;
  label: string;
  width?: number;
}

interface ExportButtonProps {
  data: Record<string, unknown>[];
  fileName: string;
  columns: ExportColumn[];
  pdfTitle: string;
  schoolName?: string;
}

export function ExportButton({
  data,
  fileName,
  columns,
  pdfTitle,
  schoolName,
}: ExportButtonProps) {
  const handleExportCSV = () => {
    if (data.length === 0) {
      toast.error("No data to export");
      return;
    }

    exportToCSV(data, fileName, columns);
    toast.success("CSV exported successfully");
  };

  const handleExportPDF = () => {
    if (data.length === 0) {
      toast.error("No data to export");
      return;
    }

    exportTableToPDF(data, fileName, {
      title: pdfTitle,
      columns,
      schoolName,
    });
    toast.success("PDF exported successfully");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportCSV}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportPDF}>
          <FileText className="mr-2 h-4 w-4" />
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
