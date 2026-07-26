import { AppNav } from "@/components/layout/app-nav";
import { getCurrentProfile } from "@/lib/actions/bids";

import { isAdminRole } from "@/lib/auth";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  return (
    <div className="min-h-screen flex flex-col">
      <AppNav
        userName={profile?.full_name}
        isAdmin={isAdminRole(profile?.role)}
      />
      <main className="flex-1 container mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
