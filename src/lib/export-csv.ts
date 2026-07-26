export type CsvRow = Record<string, string | number | boolean | null | undefined>;

function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function rowsToCsv(rows: CsvRow[], columns: { key: string; label: string }[]): string {
  const header = columns.map((c) => escapeCsvValue(c.label)).join(",");
  const body = rows
    .map((row) =>
      columns.map((c) => escapeCsvValue(row[c.key])).join(",")
    )
    .join("\n");
  return `${header}\n${body}`;
}

export const BID_EXPORT_COLUMNS = [
  { key: "job_title", label: "Job Title" },
  { key: "url", label: "URL" },
  { key: "status", label: "Status" },
  { key: "job_response", label: "Job Response" },
  { key: "bidder_name", label: "Bidder" },
  { key: "bidder_email", label: "Bidder Email" },
  { key: "source_name", label: "Source" },
  { key: "date_est", label: "Date (EST)" },
  { key: "time_est", label: "Time (EST)" },
  { key: "week_number", label: "Week" },
  { key: "connects_used", label: "Connects" },
  { key: "country", label: "Country" },
  { key: "client_viewed", label: "Client Viewed" },
  { key: "client_responded", label: "Client Responded" },
  { key: "shortlisted", label: "Shortlisted" },
  { key: "proposal_count_range", label: "Proposal Count" },
  { key: "meghna_remarks", label: "Remarks" },
  { key: "summary", label: "Summary" },
  { key: "questions", label: "Questions" },
  { key: "proposal", label: "Proposal" },
  { key: "bid_submitted_at", label: "Submitted At" },
  { key: "created_at", label: "Created At" },
] as const;
