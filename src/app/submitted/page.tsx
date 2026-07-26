import { AppShell } from "@/components/layout/app-shell";
import { SubmittedBidsTable } from "@/components/bids/submitted-bids-table";
import { ExportCsvButton } from "@/components/bids/export-csv-button";
import { getBids, getProfiles, getCurrentProfile } from "@/lib/actions/bids";
import { SUBMITTED_STATUSES } from "@/db/schema";
import { isAdminRole } from "@/lib/auth";

export default async function SubmittedPage() {
  const [bids, profiles, profile] = await Promise.all([
    getBids({ status: [...SUBMITTED_STATUSES] }),
    getProfiles(),
    getCurrentProfile(),
  ]);

  const isAdmin = isAdminRole(profile?.role);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Submitted Bids</h1>
            <p className="text-muted-foreground">
              Track all submitted proposals, client responses, and connects used
            </p>
          </div>
          {isAdmin && <ExportCsvButton submittedOnly />}
        </div>
        <SubmittedBidsTable
          data={bids ?? []}
          profiles={profiles ?? []}
        />
      </div>
    </AppShell>
  );
}
