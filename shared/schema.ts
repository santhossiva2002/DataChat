import { pgTable, text, serial, integer, boolean, json, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table (keeping from original schema)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Dataset table
export const datasets = pgTable("datasets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  originalFilename: text("originalFilename").notNull(),
  fileType: text("fileType").notNull(), // csv, json, sql
  uploadedAt: timestamp("uploadedAt").defaultNow(),
  rowCount: integer("rowCount").notNull(),
  columnCount: integer("columnCount").notNull(),
  tableName: text("tableName").notNull(),
  schema: json("schema").notNull(), // JSON representation of the table schema
});

export const insertDatasetSchema = createInsertSchema(datasets).omit({
  id: true,
  uploadedAt: true,
});

export type InsertDataset = z.infer<typeof insertDatasetSchema>;
export type Dataset = typeof datasets.$inferSelect;

// ChatMessage table
export const chatMessages = pgTable("chatMessages", {
  id: serial("id").primaryKey(),
  datasetId: integer("datasetId").notNull(),
  role: text("role").notNull(), // user or system
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  sql: text("sql"), // Optional SQL query (only for system messages)
  resultData: json("resultData"), // Optional result data (only for system messages)
  chartData: json("chartData"), // Optional chart data (only for system messages)
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  timestamp: true,
});

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
