"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateUserRole, updateUserProfile } from "@/lib/actions/admin";
import type { UserRole } from "@/db/schema";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface UsersTableProps {
  users: {
    id: string;
    full_name: string;
    email: string;
    role: UserRole;
  }[];
}

const ROLES: { value: UserRole; label: string }[] = [
  { value: "bidder", label: "Bidder" },
  { value: "manager", label: "Manager" },
  { value: "admin", label: "Admin" },
];

export function UsersTable({ users }: UsersTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  function handleRoleChange(userId: string, role: UserRole) {
    setMessage(null);
    startTransition(async () => {
      const result = await updateUserRole(userId, role);
      if (result.error) {
        setMessage(result.error);
      } else {
        setMessage("Role updated.");
        router.refresh();
      }
    });
  }

  function startEdit(user: UsersTableProps["users"][0]) {
    setEditingId(user.id);
    setEditName(user.full_name);
  }

  function saveName(userId: string) {
    setMessage(null);
    startTransition(async () => {
      const result = await updateUserProfile(userId, { fullName: editName });
      if (result.error) {
        setMessage(result.error);
      } else {
        setEditingId(null);
        setMessage("User updated.");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  {editingId === user.id ? (
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-8"
                    />
                  ) : (
                    <span className="font-medium">{user.full_name}</span>
                  )}
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Select
                    value={user.role}
                    onValueChange={(v) =>
                      handleRoleChange(user.id, v as UserRole)
                    }
                    disabled={isPending}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  {editingId === user.id ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => saveName(user.id)}
                      disabled={isPending}
                    >
                      Save
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startEdit(user)}
                    >
                      Edit
                    </Button>
                  )}
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
