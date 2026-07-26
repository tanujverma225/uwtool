"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateBidStatus } from "@/lib/actions/bids";
import { BID_STATUSES, type BidStatus } from "@/db/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface StatusSelectProps {
  bidId: string;
  value: BidStatus;
  disabled?: boolean;
}

export function StatusSelect({ bidId, value, disabled }: StatusSelectProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleChange(next: BidStatus) {
    startTransition(async () => {
      await updateBidStatus(bidId, next);
      router.refresh();
    });
  }

  return (
    <Select
      value={value}
      onValueChange={(v) => handleChange(v as BidStatus)}
      disabled={disabled || isPending}
    >
      <SelectTrigger className="h-8 w-[130px] text-xs">
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
  );
}
