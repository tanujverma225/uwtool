import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Bid Bot</h1>
        <p className="text-muted-foreground max-w-md">
          Manage Upwork proposals, check duplicates, track submissions, and
          view team stats — all in one place.
        </p>
      </div>
      <div className="flex gap-4">
        <Button asChild size="lg">
          <Link href="/login">Sign in</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/signup">Sign up</Link>
        </Button>
      </div>
    </div>
  );
}
