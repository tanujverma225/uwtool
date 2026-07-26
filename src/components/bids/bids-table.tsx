"use client";

import Link from "next/link";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
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
import { BID_STATUSES, type BidStatus } from "@/db/schema";
import { formatEstDate } from "@/lib/dates";
import {
  PersonAvatar,
  SourceBadge,
  StatusBadge,
} from "@/components/bids/bid-badges";

export interface BidTableRow {
  id: string;
  job_title: string;
  url: string;
  status: BidStatus;
  date_est: string | null;
  shortlisted: boolean;
  similar_bid_id: string | null;
  profiles: {
    full_name: string;
    avatar_url: string | null;
  } | null;
  sources: {
    name: string;
    color: string;
  } | null;
}

interface BidsTableProps {
  data: BidTableRow[];
  showPerson?: boolean;
  detailPath?: string;
}

export function BidsTable({
  data,
  showPerson = true,
  detailPath = "/bids",
}: BidsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredData = useMemo(() => {
    if (statusFilter === "all") return data;
    return data.filter((row) => row.status === statusFilter);
  }, [data, statusFilter]);

  const columns = useMemo<ColumnDef<BidTableRow>[]>(
    () => [
      {
        accessorKey: "job_title",
        header: "Job Title",
        cell: ({ row }) => (
          <Link
            href={`${detailPath}/${row.original.id}`}
            className="font-medium hover:underline line-clamp-2 max-w-xs"
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
            className="inline-flex items-center gap-1 text-primary hover:underline text-xs"
          >
            Upwork <ExternalLink className="h-3 w-3" />
          </a>
        ),
      },
      {
        id: "similar_bid",
        header: "Similar Bid",
        cell: ({ row }) =>
          row.original.similar_bid_id ? (
            <Link
              href={`${detailPath}/${row.original.similar_bid_id}`}
              className="text-amber-600 text-xs hover:underline"
            >
              Duplicate
            </Link>
          ) : (
            <span className="text-muted-foreground text-xs">None</span>
          ),
      },
      {
        accessorKey: "date_est",
        header: "Date (EST)",
        cell: ({ row }) => formatEstDate(row.original.date_est),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      ...(showPerson
        ? [
            {
              id: "person",
              header: "Person",
              cell: ({ row }: { row: { original: BidTableRow } }) =>
                row.original.profiles ? (
                  <PersonAvatar
                    name={row.original.profiles.full_name}
                    avatarUrl={row.original.profiles.avatar_url}
                  />
                ) : (
                  "—"
                ),
            } as ColumnDef<BidTableRow>,
          ]
        : []),
      {
        id: "shortlisted",
        header: "Shortlist",
        cell: ({ row }) => (row.original.shortlisted ? "Yes" : "—"),
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
    ],
    [detailPath, showPerson]
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Search job titles..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {BID_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
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
                  No bids found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
