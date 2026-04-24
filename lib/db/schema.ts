import {
  pgTable,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  serial,
  unique,
  index,
  customType,
} from "drizzle-orm/pg-core";

// Custom tsvector type for full-text search
const tsvector = customType<{ data: string }>({
  dataType() {
    return "tsvector";
  },
});

// ─── Languages ───────────────────────────────────────────────
export const languages = pgTable("languages", {
  code: varchar("code", { length: 10 }).primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  nativeName: varchar("native_name", { length: 50 }).notNull(),
  fontStack: text("font_stack"),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Songs ───────────────────────────────────────────────────
export const songs = pgTable(
  "songs",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 255 }).unique().notNull(),
    category: varchar("category", { length: 100 }),
    defaultLang: varchar("default_lang", { length: 10 })
      .default("en")
      .references(() => languages.code),
    viewCount: integer("view_count").default(0),
    isPublished: boolean("is_published").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("idx_songs_slug").on(table.slug),
    index("idx_songs_category").on(table.category),
    index("idx_songs_view_count").on(table.viewCount),
  ]
);

// ─── Song Translations ──────────────────────────────────────
export const songTranslations = pgTable(
  "song_translations",
  {
    id: serial("id").primaryKey(),
    songId: integer("song_id")
      .notNull()
      .references(() => songs.id, { onDelete: "cascade" }),
    languageCode: varchar("language_code", { length: 10 })
      .notNull()
      .references(() => languages.code),
    title: text("title").notNull(),
    lyrics: text("lyrics").notNull(),
    englishMeaning: text("english_meaning"),
    audioUrl: text("audio_url"),
    youtubeUrl: text("youtube_url"),
    searchVector: tsvector("search_vector"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    unique("uq_song_lang").on(table.songId, table.languageCode),
    index("idx_song_translations_song_lang").on(
      table.songId,
      table.languageCode
    ),
    index("idx_song_translations_search").using(
      "gin",
      table.searchVector
    ),
  ]
);

// ─── User Favorites ─────────────────────────────────────────
export const userFavorites = pgTable(
  "user_favorites",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    songId: integer("song_id")
      .notNull()
      .references(() => songs.id, { onDelete: "cascade" }),
    addedAt: timestamp("added_at").defaultNow(),
  },
  (table) => [
    unique("uq_user_song").on(table.userId, table.songId),
  ]
);

// ─── App Settings ────────────────────────────────────────────
export const appSettings = pgTable("app_settings", {
  key: varchar("key", { length: 100 }).primaryKey(),
  boolValue: boolean("bool_value").notNull().default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Contact Messages
export const contactMessages = pgTable(
  "contact_messages",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 40 }).notNull(),
    email: varchar("email", { length: 60 }).notNull(),
    country: varchar("country", { length: 120 }),
    deviceType: varchar("device_type", { length: 20 }),
    requestType: varchar("request_type", { length: 50 }).notNull(),
    message: text("message").notNull(),
    consentToContact: boolean("consent_to_contact").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("idx_contact_messages_created_at").on(table.createdAt),
    index("idx_contact_messages_request_type").on(table.requestType),
    index("idx_contact_messages_email").on(table.email),
    index("idx_contact_messages_country").on(table.country),
    index("idx_contact_messages_device_type").on(table.deviceType),
  ]
);

// ─── Subscribers ─────────────────────────────────────────────
export const subscribers = pgTable("subscribers", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  token: varchar("token", { length: 128 }).notNull(),
  location: varchar("location", { length: 120 }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  unique("uq_subscribers_email").on(table.email),
  unique("uq_subscribers_token").on(table.token),
]);
