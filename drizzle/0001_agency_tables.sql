-- Add is_prestige and is_secret to properties
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "is_prestige" BOOLEAN DEFAULT false;
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "is_secret" BOOLEAN DEFAULT false;

-- Team members table
CREATE TABLE IF NOT EXISTS "team_members" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "photo_url" TEXT,
  "bio" TEXT,
  "email" VARCHAR(320),
  "phone" VARCHAR(50),
  "order_index" INTEGER DEFAULT 0,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Careers table
CREATE TABLE IF NOT EXISTS "careers" (
  "id" SERIAL PRIMARY KEY,
  "title" VARCHAR(255) NOT NULL,
  "department" VARCHAR(100),
  "location" VARCHAR(255),
  "description" TEXT,
  "is_active" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Testimonials table
CREATE TABLE IF NOT EXISTS "testimonials" (
  "id" SERIAL PRIMARY KEY,
  "quote" TEXT NOT NULL,
  "author" VARCHAR(255),
  "role" VARCHAR(255),
  "photo_url" TEXT,
  "order_index" INTEGER DEFAULT 0,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Secret signups table
CREATE TABLE IF NOT EXISTS "secret_signups" (
  "id" SERIAL PRIMARY KEY,
  "email" VARCHAR(320) NOT NULL,
  "name" VARCHAR(255),
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
);
