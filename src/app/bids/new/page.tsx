import { AppShell } from "@/components/layout/app-shell";
import { NewBidForm } from "@/components/bids/new-bid-form";
import { getSources } from "@/lib/actions/bids";

export default async function NewBidPage() {
  const sources = await getSources();

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">New Bid</h1>
          <p className="text-muted-foreground">
            Paste an Upwork job URL to start. We&apos;ll check for duplicates automatically.
          </p>
        </div>
        <NewBidForm sources={sources ?? []} />
      </div>
    </AppShell>
  );
}
