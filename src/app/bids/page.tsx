import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { BidsTable } from "@/components/bids/bids-table";
import { Button } from "@/components/ui/button";
import { getBids } from "@/lib/actions/bids";
import { Plus } from "lucide-react";

export default async function BidsPage() {
  const bids = await getBids({
    status: ["draft", "ready"],
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Bids</h1>
            <p className="text-muted-foreground">
              Intake queue — paste Upwork links, check duplicates, write proposals
            </p>
          </div>
          <Button asChild>
            <Link href="/bids/new">
              <Plus className="h-4 w-4" />
              New Bid
            </Link>
          </Button>
        </div>
        <BidsTable data={bids ?? []} />
      </div>
    </AppShell>
  );
}
