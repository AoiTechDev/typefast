import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

export const rooms = pgTable("rooms", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  status: text("status", { enum: ["waiting", "racing", "finished"] })
    .notNull()
    .default("waiting"),
  hostPlayerId: uuid("host_player_id"),
  raceText: text("race_text"),
  maxPlayers: integer("max_players").notNull().default(8),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  startedAt: timestamp("started_at", { withTimezone: true }),
});
export const results = pgTable(
  "results",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    durationMs: integer("duration_ms").notNull(),
    wpm: integer("wpm").notNull(),
    accuracy: integer("accuracy").notNull(),
    finishedAt: timestamp("finished_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("results_room_player_unique").on(table.roomId, table.playerId),
    index("results_room_id_idx").on(table.roomId),
  ],
);
export const players = pgTable(
  "players",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    nick: text("nick").notNull(),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    isReady: boolean("is_ready").notNull().default(false),

  },
  (table) => [index("players_room_id_idx").on(table.roomId)],
);

export const roomsRelations = relations(rooms, ({ many }) => ({
  players: many(players),
}));

export const playersRelations = relations(players, ({ one }) => ({
  room: one(rooms, {
    fields: [players.roomId],
    references: [rooms.id],
  }),
}));

export const resultsRelations = relations(results, ({ one }) => ({
  room: one(rooms, { fields: [results.roomId], references: [rooms.id] }),
  player: one(players, { fields: [results.playerId], references: [players.id] }),
}));

export type Room = typeof rooms.$inferSelect;
export type Player = typeof players.$inferSelect;
export type RoomStatus = Room["status"];
