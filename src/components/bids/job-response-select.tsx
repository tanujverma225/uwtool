"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateJobResponse } from "@/lib/actions/bids";
import { JOB_RESPONSES, type JobResponse } from "@/db/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface JobResponseSelectProps {
  bidId: string;
  value: JobResponse;
  disabled?: boolean;
}

export function JobResponseSelect({
  bidId,
  value,
  disabled,
}: JobResponseSelectProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleChange(next: JobResponse) {
    startTransition(async () => {
      await updateJobResponse(bidId, next);
      router.refresh();
    });
  }

  return (
    <Select
      value={value}
      onValueChange={(v) => handleChange(v as JobResponse)}
      disabled={disabled || isPending}
    >
      <SelectTrigger className="h-8 w-[140px] text-xs">
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
  );
}
