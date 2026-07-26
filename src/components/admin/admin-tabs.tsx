"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface AdminTabsProps {
  tabs: { id: string; label: string; content: React.ReactNode }[];
}

export function AdminTabs({ tabs }: AdminTabsProps) {
  const [active, setActive] = useState(tabs[0]?.id);

  const current = tabs.find((t) => t.id === active);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 border-b pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
            className={cn(
              "rounded-md px-4 py-2 text-sm font-medium transition-colors",
              active === tab.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>{current?.content}</div>
    </div>
  );
}
