"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import {
  createSource,
  updateSource,
  deleteSource,
} from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface SourcesManagerProps {
  sources: { id: string; name: string; color: string }[];
}

export function SourcesManager({ sources }: SourcesManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [color, setColor] = useState("#22c55e");
  const [message, setMessage] = useState<string | null>(null);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setMessage(null);
    startTransition(async () => {
      const result = await createSource(name.trim(), color);
      if (result.error) {
        setMessage(result.error);
      } else {
        setName("");
        setMessage("Source added.");
        router.refresh();
      }
    });
  }

  function handleUpdate(id: string, field: "name" | "color", value: string) {
    startTransition(async () => {
      await updateSource(id, { [field]: value });
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this source?")) return;
    startTransition(async () => {
      const result = await deleteSource(id);
      if (result.error) setMessage(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleCreate} className="flex flex-wrap gap-2">
        <Input
          placeholder="Source name (e.g. Colette)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="max-w-xs"
        />
        <Input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="w-16"
        />
        <Button type="submit" disabled={isPending}>
          Add Source
        </Button>
      </form>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Color</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sources.map((source) => (
              <TableRow key={source.id}>
                <TableCell>
                  <Input
                    defaultValue={source.name}
                    onBlur={(e) =>
                      e.target.value !== source.name &&
                      handleUpdate(source.id, "name", e.target.value)
                    }
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      defaultValue={source.color}
                      className="w-16"
                      onChange={(e) =>
                        handleUpdate(source.id, "color", e.target.value)
                      }
                    />
                    <span
                      className="inline-block h-6 w-6 rounded-full border"
                      style={{ backgroundColor: source.color }}
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(source.id)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}
