"use client";

import { useState, useTransition } from "react";
import { Download } from "lucide-react";
import { exportBidsCsv } from "@/lib/actions/bids";
import { Button } from "@/components/ui/button";

interface ExportCsvButtonProps {
  submittedOnly?: boolean;
  label?: string;
}

export function ExportCsvButton({
  submittedOnly = false,
  label,
}: ExportCsvButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleExport() {
    setError(null);
    startTransition(async () => {
      const result = await exportBidsCsv(submittedOnly);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (!result.csv || !result.filename) return;

      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = result.filename;
      link.click();
      URL.revokeObjectURL(link.href);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="outline"
        size="sm"
        onClick={handleExport}
        disabled={isPending}
      >
        <Download className="h-4 w-4" />
        {isPending
          ? "Exporting..."
          : label ?? (submittedOnly ? "Export Submitted CSV" : "Export All CSV")}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
