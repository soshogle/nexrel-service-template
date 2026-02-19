CREATE TYPE "public"."inquiry_status" AS ENUM('new', 'read', 'replied', 'archived');--> statement-breakpoint
CREATE TYPE "public"."listing_status" AS ENUM('active', 'sold', 'rented', 'pending', 'expired');--> statement-breakpoint
CREATE TYPE "public"."listing_type" AS ENUM('sale', 'rent');--> statement-breakpoint
CREATE TYPE "public"."property_type" AS ENUM('apartment', 'condo', 'house', 'townhouse', 'duplex', 'triplex', 'commercial', 'land');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "broker_profile" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"agency" varchar(255) NOT NULL,
	"agency_address" text,
	"phone" varchar(50),
	"fax" varchar(50),
	"email" varchar(320),
	"bio" text,
	"photo_url" text,
	"languages" jsonb,
	"certifications" jsonb,
	"social_links" jsonb,
	"tagline" varchar(500),
	"remax_profile_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inquiries" (
	"id" serial PRIMARY KEY NOT NULL,
	"property_id" integer,
	"name" varchar(255) NOT NULL,
	"email" varchar(320) NOT NULL,
	"phone" varchar(50),
	"message" text NOT NULL,
	"status" "inquiry_status" DEFAULT 'new' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "properties" (
	"id" serial PRIMARY KEY NOT NULL,
	"mls_number" varchar(50) NOT NULL,
	"title" varchar(500) NOT NULL,
	"slug" varchar(500) NOT NULL,
	"property_type" "property_type" DEFAULT 'apartment' NOT NULL,
	"listing_type" "listing_type" DEFAULT 'rent' NOT NULL,
	"status" "listing_status" DEFAULT 'active' NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"price_label" varchar(50),
	"address" varchar(500) NOT NULL,
	"neighborhood" varchar(255),
	"city" varchar(255) NOT NULL,
	"province" varchar(100),
	"postal_code" varchar(20),
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"bedrooms" integer,
	"bathrooms" integer,
	"rooms" integer,
	"area" varchar(100),
	"area_unit" varchar(20),
	"lot_area" varchar(100),
	"year_built" integer,
	"description" text,
	"addendum" text,
	"main_image_url" text,
	"gallery_images" jsonb,
	"features" jsonb,
	"room_details" jsonb,
	"is_new" boolean DEFAULT false,
	"is_featured" boolean DEFAULT false,
	"original_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "properties_mls_number_unique" UNIQUE("mls_number"),
	CONSTRAINT "properties_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "saved_properties" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"property_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"open_id" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"login_method" varchar(64),
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_signed_in" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_open_id_unique" UNIQUE("open_id")
);
