import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-bold">Not found</h1>
      <p className="text-muted-foreground">This bid or page does not exist.</p>
      <Button asChild>
        <Link href="/bids">Back to Bids</Link>
      </Button>
    </div>
  );
}
