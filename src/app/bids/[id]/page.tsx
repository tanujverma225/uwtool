import { notFound } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { BidDetailForm } from "@/components/bids/bid-detail-form";
import {
  getBid,
  getCurrentProfile,
  getSources,
} from "@/lib/actions/bids";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

interface BidDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function BidDetailPage({ params }: BidDetailPageProps) {
  const { id } = await params;
  const [bid, sources, profile] = await Promise.all([
    getBid(id).catch(() => null),
    getSources(),
    getCurrentProfile(),
  ]);

  if (!bid) notFound();

  const isManager =
    profile?.role === "manager" || profile?.role === "admin";

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/bids">
            <ChevronLeft className="h-4 w-4" />
            Back to Bids
          </Link>
        </Button>
        <BidDetailForm
          bid={bid}
          sources={sources ?? []}
          isManager={isManager}
        />
      </div>
    </AppShell>
  );
}
