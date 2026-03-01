import { pgTable, uuid, timestamp, varchar, jsonb } from "drizzle-orm/pg-core";

export const jobs = pgTable("jobs", {
  id: uuid("id").primaryKey(),
  assetId: uuid("asset_id").notNull(),
  status: varchar("status", { length: 32 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  result: jsonb("result"),
  errorMessage: varchar("error_message", { length: 1024 }),
});
