import { relations } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const rooms = pgTable("rooms", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  status: text("status", { enum: ["waiting", "racing", "finished"] })
    .notNull()
    .default("waiting"),
  // bez klucza obcego, bo rooms i players wskazywalyby na siebie nawzajem
  hostPlayerId: uuid("host_player_id"),
  raceText: text("race_text"),
  maxPlayers: integer("max_players").notNull().default(8),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  startedAt: timestamp("started_at", { withTimezone: true }),
});

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

export type Room = typeof rooms.$inferSelect;
export type Player = typeof players.$inferSelect;
export type RoomStatus = Room["status"];
