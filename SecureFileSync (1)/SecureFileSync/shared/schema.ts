import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from 'drizzle-orm';
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Encrypted file schema
export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  size: integer("size").notNull(),
  encryptionKey: text("encryption_key").notNull(),
  data: text("data").notNull(), // Store as base64 or binary
  password: text("password"),
  shared: boolean("shared").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"),
});

// Share token schema
export const shareTokens = pgTable("share_tokens", {
  id: serial("id").primaryKey(),
  fileId: integer("file_id").notNull(),
  shareToken: text("share_token").notNull().unique(),
  password: text("password"),
  email: text("email"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"),
  accessCount: integer("access_count").notNull().default(0),
});

// Activity log schema
export const logs = pgTable("logs", {
  id: serial("id").primaryKey(),
  fileId: integer("file_id").notNull(),
  fileName: text("file_name").notNull(),
  action: text("action").notNull(), // upload, download, share, access, etc.
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  details: text("details"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// Define relations after all tables are defined
export const userRelations = relations(users, ({ many }) => ({
  files: many(files),
}));

export const filesRelations = relations(files, ({ many }) => ({
  shareTokens: many(shareTokens),
  logs: many(logs),
}));

export const shareTokensRelations = relations(shareTokens, ({ one }) => ({
  file: one(files, {
    fields: [shareTokens.fileId],
    references: [files.id],
  }),
}));

export const logsRelations = relations(logs, ({ one }) => ({
  file: one(files, {
    fields: [logs.fileId],
    references: [files.id],
  }),
}));

// Create schemas
export const userSchema = createInsertSchema(users);
export const insertUserSchema = userSchema.omit({ id: true, createdAt: true });

export const fileSchema = createInsertSchema(files);
export const insertFileSchema = fileSchema.omit({ id: true, createdAt: true, shared: true });

export const shareTokenSchema = createInsertSchema(shareTokens);
export const insertShareTokenSchema = shareTokenSchema.omit({ id: true, createdAt: true, accessCount: true });

export const logSchema = createInsertSchema(logs);
export const insertLogSchema = logSchema.omit({ id: true });

// Export type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type EncryptedFile = typeof files.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;

export type ShareToken = typeof shareTokens.$inferSelect;
export type InsertShareToken = z.infer<typeof insertShareTokenSchema>;

export type Log = typeof logs.$inferSelect;
export type InsertLog = z.infer<typeof insertLogSchema>;
