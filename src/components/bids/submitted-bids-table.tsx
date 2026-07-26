"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import Link from "next/link";
import { useMemo, useState, useCallback } from "react";
import { ExternalLink } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { JOB_RESPONSES, type BidStatus, type JobResponse } from "@/db/schema";
import { formatEstDate } from "@/lib/dates";
import {
  PersonAvatar,
  SourceBadge,
} from "@/components/bids/bid-badges";
import { JobResponseSelect } from "@/components/bids/job-response-select";
import { StatusSelect } from "@/components/bids/status-select";

export interface SubmittedBidRow {
  id: string;
  job_title: string;
  url: string;
  status: BidStatus;
  job_response: JobResponse | null;
  date_est: string | null;
  time_est: string | null;
  week_number: string | null;
  connects_used: number | null;
  country: string | null;
  client_viewed: boolean;
  client_responded: boolean;
  proposal_count_range: string | null;
  profiles: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  } | null;
  sources: {
    name: string;
    color: string;
  } | null;
}

interface SubmittedBidsTableProps {
  data: SubmittedBidRow[];
  profiles: { id: string; full_name: string }[];
  currentUserId?: string;
  isManager?: boolean;
}

export function SubmittedBidsTable({
  data,
  profiles,
  currentUserId,
  isManager = false,
}: SubmittedBidsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [personFilter, setPersonFilter] = useState("all");
  const [responseFilter, setResponseFilter] = useState("all");

  const filteredData = useMemo(() => {
    return data.filter((row) => {
      if (personFilter !== "all" && row.profiles?.id !== personFilter)
        return false;
      if (responseFilter !== "all" && row.job_response !== responseFilter)
        return false;
      return true;
    });
  }, [data, personFilter, responseFilter]);

  const canEditRow = useCallback(
    (bidderId: string | undefined) =>
      isManager || (currentUserId && bidderId === currentUserId),
    [currentUserId, isManager]
  );

  const columns = useMemo<ColumnDef<SubmittedBidRow>[]>(
    () => [
      {
        accessorKey: "job_title",
        header: "Job Title",
        cell: ({ row }) => (
          <Link
            href={`/bids/${row.original.id}`}
            className="font-medium hover:underline line-clamp-2 max-w-[200px]"
          >
            {row.original.job_title}
          </Link>
        ),
      },
      {
        accessorKey: "url",
        header: "URL",
        cell: ({ row }) => (
          <a
            href={row.original.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary text-xs hover:underline inline-flex items-center gap-1"
          >
            Link <ExternalLink className="h-3 w-3" />
          </a>
        ),
      },
      {
        id: "person",
        header: "Person",
        cell: ({ row }) =>
          row.original.profiles ? (
            <PersonAvatar
              name={row.original.profiles.full_name}
              avatarUrl={row.original.profiles.avatar_url}
            />
          ) : (
            "—"
          ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const editable = canEditRow(row.original.profiles?.id);
          if (editable) {
            return (
              <StatusSelect
                bidId={row.original.id}
                value={row.original.status}
              />
            );
          }
          return (
            <span className="text-xs capitalize">
              {row.original.status.replace(/_/g, " ")}
            </span>
          );
        },
      },
      {
        accessorKey: "date_est",
        header: "Date (EST)",
        cell: ({ row }) => formatEstDate(row.original.date_est),
      },
      {
        accessorKey: "time_est",
        header: "Time",
        cell: ({ row }) => row.original.time_est ?? "—",
      },
      {
        id: "job_response",
        header: "Job Response",
        cell: ({ row }) => {
          const response = row.original.job_response ?? "no_response";
          const editable = canEditRow(row.original.profiles?.id);
          if (editable) {
            return (
              <JobResponseSelect bidId={row.original.id} value={response} />
            );
          }
          const label =
            JOB_RESPONSES.find((r) => r.value === response)?.label ?? response;
          return <span className="text-xs">{label}</span>;
        },
      },
      {
        accessorKey: "connects_used",
        header: "Connects",
        cell: ({ row }) => row.original.connects_used ?? "—",
      },
      {
        accessorKey: "country",
        header: "Country",
        cell: ({ row }) => row.original.country ?? "—",
      },
      {
        id: "source",
        header: "Source",
        cell: ({ row }) =>
          row.original.sources ? (
            <SourceBadge
              name={row.original.sources.name}
              color={row.original.sources.color}
            />
          ) : (
            "—"
          ),
      },
      {
        accessorKey: "week_number",
        header: "Week",
        cell: ({ row }) => row.original.week_number ?? "—",
      },
    ],
    [canEditRow]
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row flex-wrap gap-3">
        <Input
          placeholder="Search..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        <Select value={personFilter} onValueChange={setPersonFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Person" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All people</SelectItem>
            {profiles.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={responseFilter} onValueChange={setResponseFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Job Response" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All responses</SelectItem>
            {JOB_RESPONSES.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No submitted bids found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
