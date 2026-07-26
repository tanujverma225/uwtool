import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["bidder", "manager", "admin"]);
export const bidStatusEnum = pgEnum("bid_status", [
  "draft",
  "ready",
  "submitted",
  "viewed",
  "responded",
  "hired",
  "lost",
  "canceled",
  "no_response",
]);
export const jobResponseEnum = pgEnum("job_response", [
  "no_response",
  "replied",
  "hired",
  "canceled",
]);

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull(),
  fullName: text("full_name").notNull(),
  role: userRoleEnum("role").notNull().default("bidder"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const sources = pgTable("sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  color: text("color").notNull().default("#22c55e"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const bids = pgTable("bids", {
  id: uuid("id").primaryKey().defaultRandom(),
  jobTitle: text("job_title").notNull(),
  url: text("url").notNull(),
  upworkJobId: text("upwork_job_id").notNull(),
  similarBidId: uuid("similar_bid_id"),
  proposal: text("proposal"),
  questions: text("questions"),
  summary: text("summary"),
  country: text("country"),
  status: bidStatusEnum("status").notNull().default("draft"),
  jobResponse: jobResponseEnum("job_response").default("no_response"),
  shortlisted: boolean("shortlisted").notNull().default(false),
  clientViewed: boolean("client_viewed").notNull().default(false),
  clientResponded: boolean("client_responded").notNull().default(false),
  isPrivateListing: boolean("is_private_listing").notNull().default(false),
  connectsUsed: integer("connects_used"),
  proposalCountRange: text("proposal_count_range"),
  meghnaRemarks: text("meghna_remarks"),
  bidderId: uuid("bidder_id")
    .notNull()
    .references(() => profiles.id),
  sourceId: uuid("source_id").references(() => sources.id),
  dateEst: timestamp("date_est", { withTimezone: true }),
  timeEst: text("time_est"),
  weekNumber: text("week_number"),
  jobPostedAt: timestamp("job_posted_at", { withTimezone: true }),
  bidSubmittedAt: timestamp("bid_submitted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Profile = typeof profiles.$inferSelect;
export type Source = typeof sources.$inferSelect;
export type Bid = typeof bids.$inferSelect;
export type NewBid = typeof bids.$inferInsert;

export type BidStatus =
  | "draft"
  | "ready"
  | "submitted"
  | "viewed"
  | "responded"
  | "hired"
  | "lost"
  | "canceled"
  | "no_response";

export type JobResponse = "no_response" | "replied" | "hired" | "canceled";

export type UserRole = "bidder" | "manager" | "admin";

export const BID_STATUSES: { value: BidStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "ready", label: "Ready" },
  { value: "submitted", label: "Submitted" },
  { value: "viewed", label: "Viewed" },
  { value: "responded", label: "Responded" },
  { value: "hired", label: "Hired" },
  { value: "lost", label: "Lost" },
  { value: "canceled", label: "Canceled" },
  { value: "no_response", label: "No Response" },
];

export const JOB_RESPONSES: { value: JobResponse; label: string }[] = [
  { value: "no_response", label: "No Response" },
  { value: "replied", label: "Replied" },
  { value: "hired", label: "Hired" },
  { value: "canceled", label: "Canceled" },
];

export const SUBMITTED_STATUSES: BidStatus[] = [
  "submitted",
  "viewed",
  "responded",
  "hired",
  "lost",
  "canceled",
  "no_response",
];
