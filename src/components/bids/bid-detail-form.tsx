"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ExternalLink, Sparkles, Trash2 } from "lucide-react";
import {
  updateBid,
  submitBid,
  markClientViewed,
  markClientResponded,
  deleteBid,
  fetchJobFromUrl,
} from "@/lib/actions/bids";
import { generateProposal } from "@/lib/actions/proposal";
import type { FieldOptions } from "@/lib/actions/admin";
import { BID_STATUSES, JOB_RESPONSES, type BidStatus, type JobResponse } from "@/db/schema";
import { formatEstDate, formatEstDateTime } from "@/lib/dates";
import { ProposalEditor } from "@/components/bids/proposal-editor";
import {
  PersonAvatar,
  SourceBadge,
  StatusBadge,
} from "@/components/bids/bid-badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

interface BidDetailFormProps {
  bid: {
    id: string;
    job_title: string;
    url: string;
    status: BidStatus;
    job_response: JobResponse | null;
    proposal: string | null;
    questions: string | null;
    summary: string | null;
    country: string | null;
    connects_used: number | null;
    proposal_count_range: string | null;
    meghna_remarks: string | null;
    shortlisted: boolean;
    client_viewed: boolean;
    client_responded: boolean;
    similar_bid_id: string | null;
    source_id: string | null;
    date_est: string | null;
    bid_submitted_at: string | null;
    profiles: { full_name: string; avatar_url: string | null } | null;
    sources: { name: string; color: string } | null;
    similar_bid: { id: string; job_title: string } | null;
  };
  sources: { id: string; name: string; color: string }[];
  isManager: boolean;
  fieldOptions?: FieldOptions;
}

export function BidDetailForm({ bid, sources, isManager, fieldOptions }: BidDetailFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [proposal, setProposal] = useState(bid.proposal ?? "");
  const [jobTitle, setJobTitle] = useState(bid.job_title);
  const [summary, setSummary] = useState(bid.summary ?? "");
  const [questions, setQuestions] = useState(bid.questions ?? "");
  const [sourceId, setSourceId] = useState(bid.source_id ?? "");
  const [status, setStatus] = useState<BidStatus>(bid.status);
  const [jobResponse, setJobResponse] = useState<JobResponse>(
    bid.job_response ?? "no_response"
  );
  const [connectsUsed, setConnectsUsed] = useState(
    bid.connects_used?.toString() ?? ""
  );
  const [country, setCountry] = useState(bid.country ?? "");
  const [proposalCountRange, setProposalCountRange] = useState(
    bid.proposal_count_range ?? ""
  );
  const [meghnaRemarks, setMeghnaRemarks] = useState(bid.meghna_remarks ?? "");
  const [shortlisted, setShortlisted] = useState(bid.shortlisted);
  const [clientViewed, setClientViewed] = useState(bid.client_viewed);
  const [clientResponded, setClientResponded] = useState(bid.client_responded);
  const [message, setMessage] = useState<string | null>(null);

  function save(updates: Parameters<typeof updateBid>[1]) {
    startTransition(async () => {
      const result = await updateBid(bid.id, updates);
      if (result.error) {
        setMessage(result.error);
      } else {
        setMessage("Saved successfully.");
        router.refresh();
      }
    });
  }

  function handleSaveAll() {
    save({
      jobTitle,
      proposal,
      summary: summary || undefined,
      questions: questions || undefined,
      sourceId: sourceId || null,
      status,
      jobResponse,
      connectsUsed: connectsUsed ? parseInt(connectsUsed, 10) : undefined,
      country: country || undefined,
      proposalCountRange: proposalCountRange || undefined,
      meghnaRemarks: meghnaRemarks || undefined,
      shortlisted,
      clientViewed,
      clientResponded,
    });
  }

  function handleFetchJob() {
    setMessage(null);
    startTransition(async () => {
      const result = await fetchJobFromUrl(bid.url);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      const data = result.data;
      if (!data?.fetched) {
        setMessage(data?.warning ?? "Could not fetch job details.");
        return;
      }
      if (data.jobTitle) setJobTitle(data.jobTitle);
      if (data.summary) setSummary(data.summary);
      if (data.questions) setQuestions(data.questions);
      setMessage("Job details fetched. Review and save.");
    });
  }

  function handleGenerateProposal() {
    setMessage(null);
    startTransition(async () => {
      const result = await generateProposal(bid.id);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      if (result.proposal) setProposal(result.proposal);
      setMessage("Proposal generated. Review and edit before submitting.");
      router.refresh();
    });
  }

  function handleDelete() {
    if (!confirm("Delete this bid permanently? This cannot be undone.")) return;
    startTransition(async () => {
      const result = await deleteBid(bid.id);
      if (result.error) {
        setMessage(result.error);
      } else {
        router.push("/bids");
        router.refresh();
      }
    });
  }

  function handleSubmit() {
    startTransition(async () => {
      const result = await submitBid(bid.id);
      if (result.error) {
        setMessage(result.error);
      } else {
        setStatus("submitted");
        setMessage("Bid marked as submitted!");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      {bid.similar_bid && (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Similar bid exists</AlertTitle>
          <AlertDescription>
            This job may be a duplicate of{" "}
            <Link
              href={`/bids/${bid.similar_bid.id}`}
              className="underline font-medium"
            >
              {bid.similar_bid.job_title}
            </Link>
            . Review before submitting.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <StatusBadge status={status} />
            {bid.sources && (
              <SourceBadge
                name={bid.sources.name}
                color={bid.sources.color}
              />
            )}
          </div>
          {bid.profiles && (
            <PersonAvatar
              name={bid.profiles.full_name}
              avatarUrl={bid.profiles.avatar_url}
            />
          )}
          <p className="text-sm text-muted-foreground mt-2">
            Created: {formatEstDate(bid.date_est)}
            {bid.bid_submitted_at &&
              ` · Submitted: ${formatEstDateTime(bid.bid_submitted_at)}`}
          </p>
        </div>
        <a
          href={bid.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-primary hover:underline text-sm"
        >
          Open on Upwork <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleFetchJob}
              disabled={isPending}
            >
              Fetch from Upwork URL
            </Button>
          </div>
          <div className="space-y-2">
            <Label htmlFor="jobTitle">Job Title</Label>
            <Input
              id="jobTitle"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Source</Label>
            <Select value={sourceId} onValueChange={setSourceId}>
              <SelectTrigger>
                <SelectValue placeholder="Select source" />
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
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={4}
              placeholder="Job description"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="questions">Screening Questions</Label>
            <Textarea
              id="questions"
              value={questions}
              onChange={(e) => setQuestions(e.target.value)}
              rows={4}
              placeholder="Client screening questions"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Proposal</CardTitle>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleGenerateProposal}
            disabled={isPending}
          >
            <Sparkles className="h-4 w-4" />
            Generate with Claude
          </Button>
        </CardHeader>
        <CardContent>
          <ProposalEditor content={proposal} onChange={setProposal} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status & Tracking</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as BidStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BID_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Job Response</Label>
              <Select
                value={jobResponse}
                onValueChange={(v) => setJobResponse(v as JobResponse)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {JOB_RESPONSES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="connects">Connects Used</Label>
              <Input
                id="connects"
                type="number"
                min={0}
                value={connectsUsed}
                onChange={(e) => setConnectsUsed(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              {fieldOptions?.countries?.length ? (
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger id="country">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {fieldOptions.countries.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="country"
                  placeholder="USA, Worldwide"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="proposalCount">Proposal Count Range</Label>
              {fieldOptions?.proposal_count_ranges?.length ? (
                <Select
                  value={proposalCountRange}
                  onValueChange={setProposalCountRange}
                >
                  <SelectTrigger id="proposalCount">
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    {fieldOptions.proposal_count_ranges.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="proposalCount"
                  placeholder="20 to 50"
                  value={proposalCountRange}
                  onChange={(e) => setProposalCountRange(e.target.value)}
                />
              )}
            </div>
          </div>

          <Separator />

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={shortlisted}
                onCheckedChange={(c) => setShortlisted(c === true)}
              />
              <span className="text-sm">Shortlist Bid</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={clientViewed}
                onCheckedChange={(c) => {
                  const viewed = c === true;
                  setClientViewed(viewed);
                  markClientViewed(bid.id, viewed);
                }}
              />
              <span className="text-sm">Client Viewed</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={clientResponded}
                onCheckedChange={(c) => {
                  const responded = c === true;
                  setClientResponded(responded);
                  markClientResponded(bid.id, responded);
                }}
              />
              <span className="text-sm">Client Responded</span>
            </label>
          </div>

          {isManager && (
            <div className="space-y-2">
              <Label htmlFor="remarks">Meghna Remarks</Label>
              <Textarea
                id="remarks"
                value={meghnaRemarks}
                onChange={(e) => setMeghnaRemarks(e.target.value)}
                rows={3}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {message && (
        <p className="text-sm text-muted-foreground">{message}</p>
      )}

      <div className="flex flex-wrap gap-3">
        <Button onClick={handleSaveAll} disabled={isPending} variant="outline">
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
        {status !== "submitted" &&
          !["hired", "lost", "canceled"].includes(status) && (
            <Button onClick={handleSubmit} disabled={isPending}>
              Mark as Submitted
            </Button>
          )}
        {isManager && (
          <Button
            onClick={handleDelete}
            disabled={isPending}
            variant="destructive"
          >
            <Trash2 className="h-4 w-4" />
            Delete Bid
          </Button>
        )}
      </div>
    </div>
  );
}
