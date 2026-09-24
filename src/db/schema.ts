import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  doublePrecision,
  date,
  time,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const tripMemberRoleEnum = pgEnum("trip_member_role", [
  "owner",
  "editor",
  "viewer",
]);

export const inviteStatusEnum = pgEnum("invite_status", [
  "pending",
  "accepted",
  "expired",
]);

export const trips = pgTable("trips", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  // Clerk user id of the creator
  ownerId: text("owner_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const tripMembers = pgTable(
  "trip_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tripId: uuid("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    // Clerk user id
    userId: text("user_id").notNull(),
    role: tripMemberRoleEnum("role").notNull().default("editor"),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("trip_members_trip_user_idx").on(table.tripId, table.userId)],
);

export const invites = pgTable("invites", {
  id: uuid("id").primaryKey().defaultRandom(),
  tripId: uuid("trip_id")
    .notNull()
    .references(() => trips.id, { onDelete: "cascade" }),
  role: tripMemberRoleEnum("role").notNull().default("editor"),
  // Clerk user id of the inviter
  invitedByUserId: text("invited_by_user_id").notNull(),
  token: text("token").notNull().unique(),
  status: inviteStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const spots = pgTable("spots", {
  id: uuid("id").primaryKey().defaultRandom(),
  tripId: uuid("trip_id")
    .notNull()
    .references(() => trips.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  address: text("address"),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  // Present when the spot was imported from Google Places; null for custom spots
  googlePlaceId: text("google_place_id"),
  notes: text("notes"),
  createdByUserId: text("created_by_user_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const itineraryDays = pgTable(
  "itinerary_days",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tripId: uuid("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    date: date("date"),
    // Display order among the trip's days, independent of `date`
    dayIndex: integer("day_index").notNull(),
  },
  (table) => [uniqueIndex("itinerary_days_trip_dayindex_idx").on(table.tripId, table.dayIndex)],
);

export const itineraryItems = pgTable(
  "itinerary_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    itineraryDayId: uuid("itinerary_day_id")
      .notNull()
      .references(() => itineraryDays.id, { onDelete: "cascade" }),
    spotId: uuid("spot_id")
      .notNull()
      .references(() => spots.id, { onDelete: "cascade" }),
    // Visit order within the day; pins/route on the map follow this order
    order: integer("order").notNull(),
    // Optional schedule info; independent of `order`, which stays the source
    // of truth for visit sequence and drag-and-drop.
    startTime: time("start_time"),
    durationMinutes: integer("duration_minutes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("itinerary_items_day_order_idx").on(table.itineraryDayId, table.order)],
);

export const tripsRelations = relations(trips, ({ many }) => ({
  members: many(tripMembers),
  invites: many(invites),
  spots: many(spots),
  days: many(itineraryDays),
}));

export const tripMembersRelations = relations(tripMembers, ({ one }) => ({
  trip: one(trips, { fields: [tripMembers.tripId], references: [trips.id] }),
}));

export const invitesRelations = relations(invites, ({ one }) => ({
  trip: one(trips, { fields: [invites.tripId], references: [trips.id] }),
}));

export const spotsRelations = relations(spots, ({ one, many }) => ({
  trip: one(trips, { fields: [spots.tripId], references: [trips.id] }),
  itineraryItems: many(itineraryItems),
}));

export const itineraryDaysRelations = relations(itineraryDays, ({ one, many }) => ({
  trip: one(trips, { fields: [itineraryDays.tripId], references: [trips.id] }),
  items: many(itineraryItems),
}));

export const itineraryItemsRelations = relations(itineraryItems, ({ one }) => ({
  day: one(itineraryDays, {
    fields: [itineraryItems.itineraryDayId],
    references: [itineraryDays.id],
  }),
  spot: one(spots, { fields: [itineraryItems.spotId], references: [spots.id] }),
}));
