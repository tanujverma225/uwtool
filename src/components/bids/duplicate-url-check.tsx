"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { checkDuplicateByUrl, type DuplicateBidInfo } from "@/lib/actions/bids";
import { parseUpworkUrl } from "@/lib/upwork-url";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface DuplicateUrlCheckProps {
  url: string;
}

export function DuplicateUrlCheck({ url }: DuplicateUrlCheckProps) {
  const [checking, setChecking] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateBidInfo[]>([]);
  const [checked, setChecked] = useState(false);

  const parsed = parseUpworkUrl(url);

  useEffect(() => {
    if (!parsed.isValid || !parsed.upworkJobId) {
      setDuplicates([]);
      setChecked(false);
      setChecking(false);
      return;
    }

    setChecking(true);
    setChecked(false);

    const timer = setTimeout(async () => {
      const result = await checkDuplicateByUrl(url);
      if (result.valid) {
        setDuplicates(result.duplicates);
      } else {
        setDuplicates([]);
      }
      setChecking(false);
      setChecked(true);
    }, 400);

    return () => clearTimeout(timer);
  }, [url, parsed.isValid, parsed.upworkJobId]);

  if (!url || url.length < 10) return null;

  if (!parsed.isValid) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Invalid URL</AlertTitle>
        <AlertDescription>
          Paste a valid Upwork job link (must contain a job ID like ~02208126...).
        </AlertDescription>
      </Alert>
    );
  }

  if (checking) {
    return (
      <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Checking for duplicates...
      </div>
    );
  }

  if (!checked) return null;

  if (duplicates.length === 0) {
    return (
      <Alert className="border-green-200 bg-green-50 text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-100">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertTitle>No duplicate found</AlertTitle>
        <AlertDescription>
          Job ID <strong>{parsed.upworkJobId}</strong> is not in the system yet.
          You can proceed with this bid.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="warning">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>
        Duplicate detected — {duplicates.length} existing bid
        {duplicates.length > 1 ? "s" : ""}
      </AlertTitle>
      <AlertDescription>
        <ul className="mt-2 space-y-2">
          {duplicates.map((dup) => (
            <li
              key={dup.id}
              className="flex flex-wrap items-center gap-2 text-sm"
            >
              <Link
                href={`/bids/${dup.id}`}
                className="font-medium underline hover:no-underline"
              >
                {dup.jobTitle}
              </Link>
              <Badge variant="outline">{dup.status}</Badge>
              <span className="text-muted-foreground">by {dup.bidderName}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm">
          This job may already be covered. Consider skipping unless you have a
          different angle.
        </p>
      </AlertDescription>
    </Alert>
  );
}
