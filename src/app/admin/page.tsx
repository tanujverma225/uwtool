import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { UsersTable } from "@/components/admin/users-table";
import { SourcesManager } from "@/components/admin/sources-manager";
import { FieldSettings } from "@/components/admin/field-settings";
import { ExportCsvButton } from "@/components/bids/export-csv-button";
import { getProfiles, getSources } from "@/lib/actions/bids";
import { getFieldOptions } from "@/lib/actions/admin";
import { requireAdmin } from "@/lib/auth";
import type { UserRole } from "@/db/schema";

export default async function AdminPage() {
  const { error } = await requireAdmin();
  if (error) redirect("/bids");

  const [users, sources, fieldOptions] = await Promise.all([
    getProfiles(),
    getSources(),
    getFieldOptions(),
  ]);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Admin Panel</h1>
            <p className="text-muted-foreground">
              Manage users, sources, field options, and data exports
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ExportCsvButton submittedOnly label="Export Submitted" />
            <ExportCsvButton label="Export All Bids" />
          </div>
        </div>

        <AdminTabs
          tabs={[
            {
              id: "users",
              label: "Users",
              content: (
                <UsersTable
                  users={(users ?? []).map((u) => ({
                    ...u,
                    role: u.role as UserRole,
                  }))}
                />
              ),
            },
            {
              id: "sources",
              label: "Sources",
              content: <SourcesManager sources={sources ?? []} />,
            },
            {
              id: "fields",
              label: "Field Options",
              content: <FieldSettings options={fieldOptions} />,
            },
          ]}
        />
      </div>
    </AppShell>
  );
}
