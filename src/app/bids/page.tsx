import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { BidsTable } from "@/components/bids/bids-table";
import { Button } from "@/components/ui/button";
import { getBids, getCurrentProfile } from "@/lib/actions/bids";
import { isAdminRole } from "@/lib/auth";
import { Plus } from "lucide-react";

export default async function BidsPage() {
  const [bids, profile] = await Promise.all([
    getBids({ status: ["draft", "ready"] }),
    getCurrentProfile(),
  ]);

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
        <BidsTable
          data={bids ?? []}
          currentUserId={profile?.id}
          isManager={isAdminRole(profile?.role)}
        />
      </div>
    </AppShell>
  );
}
