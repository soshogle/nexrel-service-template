import { pgTable, pgEnum, serial, text, timestamp, varchar, decimal, integer, boolean, jsonb } from "drizzle-orm/pg-core";

// PostgreSQL enums
export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const propertyTypeEnum = pgEnum("property_type", [
  "apartment", "condo", "house", "townhouse", "duplex", "triplex", "commercial", "land"
]);
export const listingStatusEnum = pgEnum("listing_status", [
  "active", "sold", "rented", "pending", "expired"
]);
export const listingTypeEnum = pgEnum("listing_type", [
  "sale", "rent"
]);
export const inquiryStatusEnum = pgEnum("inquiry_status", [
  "new", "read", "replied", "archived"
]);

/**
 * Core user table backing auth flow.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("open_id", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("login_method", { length: 64 }),
  role: userRoleEnum("role").default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastSignedIn: timestamp("last_signed_in").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Broker profile information
 */
export const brokerProfile = pgTable("broker_profile", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  agency: varchar("agency", { length: 255 }).notNull(),
  agencyAddress: text("agency_address"),
  phone: varchar("phone", { length: 50 }),
  fax: varchar("fax", { length: 50 }),
  email: varchar("email", { length: 320 }),
  bio: text("bio"),
  photoUrl: text("photo_url"),
  languages: jsonb("languages").$type<string[]>(),
  certifications: jsonb("certifications").$type<string[]>(),
  socialLinks: jsonb("social_links").$type<{
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    twitter?: string;
  }>(),
  tagline: varchar("tagline", { length: 500 }),
  remaxProfileUrl: text("remax_profile_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type BrokerProfile = typeof brokerProfile.$inferSelect;
export type InsertBrokerProfile = typeof brokerProfile.$inferInsert;

/**
 * Property listings
 */
export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  mlsNumber: varchar("mls_number", { length: 50 }).notNull().unique(),
  title: varchar("title", { length: 500 }).notNull(),
  slug: varchar("slug", { length: 500 }).notNull().unique(),
  propertyType: propertyTypeEnum("property_type").default("apartment").notNull(),
  listingType: listingTypeEnum("listing_type").default("rent").notNull(),
  status: listingStatusEnum("status").default("active").notNull(),
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  priceLabel: varchar("price_label", { length: 50 }),
  address: varchar("address", { length: 500 }).notNull(),
  neighborhood: varchar("neighborhood", { length: 255 }),
  city: varchar("city", { length: 255 }).notNull(),
  province: varchar("province", { length: 100 }),
  postalCode: varchar("postal_code", { length: 20 }),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  bedrooms: integer("bedrooms"),
  bathrooms: integer("bathrooms"),
  rooms: integer("rooms"),
  area: varchar("area", { length: 100 }),
  areaUnit: varchar("area_unit", { length: 20 }),
  lotArea: varchar("lot_area", { length: 100 }),
  yearBuilt: integer("year_built"),
  description: text("description"),
  addendum: text("addendum"),
  mainImageUrl: text("main_image_url"),
  galleryImages: jsonb("gallery_images").$type<string[]>(),
  features: jsonb("features").$type<{
    heating?: string;
    heatingEnergy?: string;
    waterSupply?: string;
    sewageSystem?: string;
    amenities?: string[];
    proximity?: string[];
    inclusions?: string[];
  }>(),
  roomDetails: jsonb("room_details").$type<Array<{
    name: string;
    level: string;
    dimensions: string;
    flooring?: string;
    details?: string;
  }>>(),
  isNew: boolean("is_new").default(false),
  isFeatured: boolean("is_featured").default(false),
  isPrestige: boolean("is_prestige").default(false),
  isSecret: boolean("is_secret").default(false),
  originalUrl: text("original_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Property = typeof properties.$inferSelect;
export type InsertProperty = typeof properties.$inferInsert;

/**
 * Contact form inquiries
 */
export const inquiries = pgTable("inquiries", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id"),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  message: text("message").notNull(),
  status: inquiryStatusEnum("status").default("new").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Inquiry = typeof inquiries.$inferSelect;
export type InsertInquiry = typeof inquiries.$inferInsert;

/**
 * Saved/favorited properties by users
 */
export const savedProperties = pgTable("saved_properties", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  propertyId: integer("property_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type SavedProperty = typeof savedProperties.$inferSelect;
export type InsertSavedProperty = typeof savedProperties.$inferInsert;

/**
 * Team members (for full agency)
 */
export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  photoUrl: text("photo_url"),
  bio: text("bio"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  orderIndex: integer("order_index").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = typeof teamMembers.$inferInsert;

/**
 * Career/job postings
 */
export const careers = pgTable("careers", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  department: varchar("department", { length: 100 }),
  location: varchar("location", { length: 255 }),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Career = typeof careers.$inferSelect;
export type InsertCareer = typeof careers.$inferInsert;

/**
 * Testimonials
 */
export const testimonials = pgTable("testimonials", {
  id: serial("id").primaryKey(),
  quote: text("quote").notNull(),
  author: varchar("author", { length: 255 }),
  role: varchar("role", { length: 255 }),
  photoUrl: text("photo_url"),
  orderIndex: integer("order_index").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Testimonial = typeof testimonials.$inferSelect;
export type InsertTestimonial = typeof testimonials.$inferInsert;

/**
 * Secret property signups
 */
export const secretSignups = pgTable("secret_signups", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  name: varchar("name", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type SecretSignup = typeof secretSignups.$inferSelect;
export type InsertSecretSignup = typeof secretSignups.$inferInsert;
