"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBid, fetchJobFromUrl } from "@/lib/actions/bids";
import { parseUpworkUrl } from "@/lib/upwork-url";
import { DuplicateUrlCheck } from "@/components/bids/duplicate-url-check";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface NewBidFormProps {
  sources: { id: string; name: string; color: string }[];
}

export function NewBidForm({ sources }: NewBidFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [url, setUrl] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [summary, setSummary] = useState("");
  const [questions, setQuestions] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fetchMessage, setFetchMessage] = useState<string | null>(null);

  const parsed = url ? parseUpworkUrl(url) : null;

  function handleFetchJob() {
    setFetchMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await fetchJobFromUrl(url);
      if (result.error) {
        setFetchMessage(result.error);
        return;
      }
      const data = result.data;
      if (!data?.fetched) {
        setFetchMessage(
          data?.warning ?? "Could not fetch job details. Enter manually."
        );
        return;
      }
      if (data.jobTitle) setJobTitle(data.jobTitle);
      if (data.summary) setSummary(data.summary);
      if (data.questions) setQuestions(data.questions);
      setFetchMessage("Job details loaded. Review before creating bid.");
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await createBid({
        url,
        jobTitle: jobTitle || undefined,
        sourceId: sourceId || undefined,
        summary: summary || undefined,
        questions: questions || undefined,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.data?.id) {
        router.push(`/bids/${result.data.id}`);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Paste Upwork Job URL</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">Upwork Job URL *</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://www.upwork.com/jobs/~..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onPaste={(e) => {
                const pasted = e.clipboardData.getData("text");
                if (pasted) setUrl(pasted.trim());
              }}
              required
              autoFocus
            />
            {parsed?.isValid && (
              <p className="text-sm text-muted-foreground">
                Job ID: {parsed.upworkJobId}
              </p>
            )}
          </div>

          <DuplicateUrlCheck url={url} />

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleFetchJob}
              disabled={isPending || !parsed?.isValid}
            >
              Fetch job details from URL
            </Button>
          </div>
          {fetchMessage && (
            <p className="text-sm text-muted-foreground">{fetchMessage}</p>
          )}

          <div className="space-y-2">
            <Label htmlFor="jobTitle">Job Title</Label>
            <Input
              id="jobTitle"
              placeholder="Auto-filled or enter manually"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Source</Label>
            <Select value={sourceId} onValueChange={setSourceId}>
              <SelectTrigger>
                <SelectValue placeholder="Select source (e.g. Colette)" />
              </SelectTrigger>
              <SelectContent>
                {sources.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary">Summary</Label>
            <Textarea
              id="summary"
              placeholder="Brief job description"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="questions">Screening Questions</Label>
            <Textarea
              id="questions"
              placeholder="Client screening questions"
              value={questions}
              onChange={(e) => setQuestions(e.target.value)}
              rows={3}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3">
            <Button type="submit" disabled={isPending || !parsed?.isValid}>
              {isPending ? "Creating..." : "Create Bid & Write Proposal"}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/bids">Cancel</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
