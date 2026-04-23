"use client";

import { useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Printer, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";

interface ExportActionsProps {
  autoprint: boolean;
}

export function ExportActions({ autoprint }: ExportActionsProps) {
  const getMMDDYYYY = useCallback((d = new Date()) => {
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${mm}${dd}${yyyy}`;
  }, []);

  const handlePrint = useCallback(() => {
    try {
      const prevTitle = document.title;
      const date = getMMDDYYYY();
      document.title = `${prevTitle}-${date}`;
      window.print();
      setTimeout(() => {
        document.title = prevTitle;
      }, 700);
    } catch {
      window.print();
    }
  }, [getMMDDYYYY]);

  useEffect(() => {
    if (!autoprint) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      handlePrint();
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [autoprint, handlePrint]);

  return (
    <div className="export-toolbar sticky top-0 z-10 mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur print:hidden">
      <div>
        <p className="text-sm font-semibold text-stone-900">Songs PDF Export</p>
        <p className="text-sm text-stone-500">
          Use the print dialog and choose Save as PDF.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/admin/songs"
          className={buttonVariants({ variant: "outline" })}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Songs
        </Link>
        <Button type="button" onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Print / Save PDF
        </Button>
        <Button type="button" variant="ghost" onClick={() => window.close()}>
          <X className="mr-2 h-4 w-4" />
          Close
        </Button>
      </div>
    </div>
  );
}
