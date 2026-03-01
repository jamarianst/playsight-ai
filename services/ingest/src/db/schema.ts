import { pgTable, uuid, timestamp, varchar, jsonb, integer } from "drizzle-orm/pg-core";

export const assets = pgTable("assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  storageKey: varchar("storage_key", { length: 512 }).notNull(),
  status: varchar("status", { length: 32 }).default("pending").notNull(),
  durationSeconds: integer("duration_seconds"),
  sport: varchar("sport", { length: 32 }).default("soccer"),
});

export const jobs = pgTable("jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  assetId: uuid("asset_id").notNull().references(() => assets.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 32 }).default("pending").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  result: jsonb("result"),
  errorMessage: varchar("error_message", { length: 1024 }),
});

export type Asset = typeof assets.$inferSelect;
export type NewAsset = typeof assets.$inferInsert;
export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
