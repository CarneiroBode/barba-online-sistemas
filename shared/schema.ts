import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const companies = pgTable("companies", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  active: boolean("active").default(true),
});

export const urlValidations = pgTable("url_validations", {
  id: serial("id").primaryKey(),
  company_id: text("company_id").notNull().references(() => companies.id),
  whatsapp: text("whatsapp").notNull(),
  codigo: text("codigo").notNull(),
  created_at: timestamp("created_at").defaultNow(),
  expires_at: timestamp("expires_at"),
  used: boolean("used").default(false),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  company_id: text("company_id").references(() => companies.id),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertUrlValidationSchema = createInsertSchema(urlValidations).pick({
  company_id: true,
  whatsapp: true,
  codigo: true,
  expires_at: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Company = typeof companies.$inferSelect;
export type UrlValidation = typeof urlValidations.$inferSelect;
export type InsertUrlValidation = z.infer<typeof insertUrlValidationSchema>;