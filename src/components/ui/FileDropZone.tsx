import { useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Upload, X, FileText, Image, File as FileIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/LoadingButton";

interface FileDropZoneProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSizeMB?: number;
  loading?: boolean;
  loadingText?: string;
  disabled?: boolean;
  className?: string;
}

function getFileIcon(fileName: string) {
  const ext = fileName.toLowerCase().split(".").pop();
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "")) {
    return <Image className="w-8 h-8 text-blue-500" />;
  }
  if (["pdf"].includes(ext || "")) {
    return <FileText className="w-8 h-8 text-red-500" />;
  }
  if (["doc", "docx"].includes(ext || "")) {
    return <FileText className="w-8 h-8 text-blue-700" />;
  }
  return <FileIcon className="w-8 h-8 text-muted-foreground" />;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileDropZone({
  onFileSelect,
  accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif",
  maxSizeMB = 10,
  loading = false,
  loadingText,
  disabled = false,
  className,
}: FileDropZoneProps) {
  const { t } = useTranslation();
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !loading) setIsDragOver(true);
  }, [disabled, loading]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (disabled || loading) return;

    const file = e.dataTransfer.files[0];
    if (file) setSelectedFile(file);
  }, [disabled, loading]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const handleSubmit = useCallback(() => {
    if (selectedFile) {
      onFileSelect(selectedFile);
    }
  }, [selectedFile, onFileSelect]);

  const clearFile = useCallback(() => {
    setSelectedFile(null);
  }, []);

  const isOverSize = selectedFile ? selectedFile.size > maxSizeMB * 1024 * 1024 : false;

  return (
    <div className={cn("space-y-3", className)}>
      {!selectedFile ? (
        <div
          role="button"
          tabIndex={0}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && !loading && inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          className={cn(
            "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all",
            isDragOver
              ? "border-primary bg-primary/5 scale-[1.02]"
              : "border-border hover:border-primary/50 hover:bg-muted/30",
            (disabled || loading) && "opacity-50 cursor-not-allowed"
          )}
        >
          <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">
            {t("fileDropZone.dragDrop")}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {t("fileDropZone.maxSize", { size: maxSizeMB })}
          </p>
        </div>
      ) : (
        <div className={cn(
          "flex items-center gap-3 rounded-xl border p-4",
          isOverSize ? "border-destructive bg-destructive/5" : "border-border bg-muted/30"
        )}>
          {getFileIcon(selectedFile.name)}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{selectedFile.name}</p>
            <p className={cn("text-xs", isOverSize ? "text-destructive" : "text-muted-foreground")}>
              {formatFileSize(selectedFile.size)}
              {isOverSize && ` — ${t("fileDropZone.tooLarge")}`}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={clearFile}
            disabled={loading}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept}
        onChange={handleInputChange}
        disabled={disabled || loading}
      />

      {selectedFile && !isOverSize && (
        <LoadingButton
          className="w-full bg-gradient-primary text-primary-foreground shadow-button"
          onClick={handleSubmit}
          loading={loading}
          loadingText={loadingText || t("fileDropZone.uploading")}
          disabled={disabled}
        >
          <Upload className="w-4 h-4 mr-2" />
          {t("fileDropZone.submit")}
        </LoadingButton>
      )}
    </div>
  );
}
