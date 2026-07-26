import { AppShell } from "@/components/layout/app-shell";
import { SubmittedBidsTable } from "@/components/bids/submitted-bids-table";
import { getBids, getProfiles } from "@/lib/actions/bids";
import { SUBMITTED_STATUSES } from "@/db/schema";

export default async function SubmittedPage() {
  const [bids, profiles] = await Promise.all([
    getBids({ status: [...SUBMITTED_STATUSES] }),
    getProfiles(),
  ]);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Submitted Bids</h1>
          <p className="text-muted-foreground">
            Track all submitted proposals, client responses, and connects used
          </p>
        </div>
        <SubmittedBidsTable
          data={bids ?? []}
          profiles={profiles ?? []}
        />
      </div>
    </AppShell>
  );
}
