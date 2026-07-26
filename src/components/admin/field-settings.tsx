"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateFieldOptions, type FieldOptions } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FieldSettingsProps {
  options: FieldOptions;
}

function toLines(values: string[]) {
  return values.join("\n");
}

function fromLines(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function FieldSettings({ options }: FieldSettingsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [countries, setCountries] = useState(toLines(options.countries));
  const [proposalRanges, setProposalRanges] = useState(
    toLines(options.proposal_count_ranges)
  );
  const [message, setMessage] = useState<string | null>(null);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const result = await updateFieldOptions({
        countries: fromLines(countries),
        proposal_count_ranges: fromLines(proposalRanges),
      });
      if (result.error) {
        setMessage(result.error);
      } else {
        setMessage("Field options saved.");
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Country dropdown options</CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="countries">One country per line</Label>
          <Textarea
            id="countries"
            value={countries}
            onChange={(e) => setCountries(e.target.value)}
            rows={6}
            className="mt-2 font-mono text-sm"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Proposal count range options
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="ranges">One range per line</Label>
          <Textarea
            id="ranges"
            value={proposalRanges}
            onChange={(e) => setProposalRanges(e.target.value)}
            rows={6}
            className="mt-2 font-mono text-sm"
          />
        </CardContent>
      </Card>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save Field Options"}
      </Button>
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </form>
  );
}
