import { drizzle } from "drizzle-orm/node-postgres";
import Pool from "pg";
import * as schema from "../drizzle/schema";
import { eq, ilike, and, or, desc, asc, sql } from "drizzle-orm";
import type { InsertUser, InsertProperty, InsertBrokerProfile, InsertInquiry } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ USER QUERIES ============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(schema.users).values(values).onConflictDoUpdate({
      target: schema.users.openId,
      set: updateSet,
    });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(schema.users).where(eq(schema.users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ BROKER PROFILE ============

export async function getBrokerProfile() {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(schema.brokerProfile).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function upsertBrokerProfile(data: InsertBrokerProfile) {
  const db = await getDb();
  if (!db) return null;
  const existing = await getBrokerProfile();
  if (existing) {
    const [updated] = await db
      .update(schema.brokerProfile)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.brokerProfile.id, existing.id))
      .returning();
    return updated;
  }
  const [created] = await db.insert(schema.brokerProfile).values(data).returning();
  return created;
}

// ============ PROPERTIES ============

export async function getProperties(opts?: {
  listingType?: "sale" | "rent";
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  city?: string;
  search?: string;
  status?: string;
  featured?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: "price_asc" | "price_desc" | "newest" | "oldest";
}) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };

  const conditions: any[] = [];

  if (opts?.listingType) {
    conditions.push(eq(schema.properties.listingType, opts.listingType));
  }
  if (opts?.status) {
    conditions.push(eq(schema.properties.status, opts.status as any));
  } else {
    conditions.push(eq(schema.properties.status, "active"));
  }
  if (opts?.propertyType) {
    conditions.push(eq(schema.properties.propertyType, opts.propertyType as any));
  }
  if (opts?.minPrice) {
    conditions.push(sql`CAST(${schema.properties.price} AS NUMERIC) >= ${opts.minPrice}`);
  }
  if (opts?.maxPrice) {
    conditions.push(sql`CAST(${schema.properties.price} AS NUMERIC) <= ${opts.maxPrice}`);
  }
  if (opts?.bedrooms) {
    conditions.push(eq(schema.properties.bedrooms, opts.bedrooms));
  }
  if (opts?.bathrooms != null && opts.bathrooms > 0) {
    conditions.push(sql`COALESCE(${schema.properties.bathrooms}, 0) >= ${opts.bathrooms}`);
  }
  if (opts?.city) {
    conditions.push(ilike(schema.properties.city, `%${opts.city}%`));
  }
  if (opts?.featured) {
    conditions.push(eq(schema.properties.isFeatured, true));
  }
  if ((opts as { prestige?: boolean })?.prestige) {
    conditions.push(eq((schema.properties as any).isPrestige, true));
  }
  if ((opts as { secret?: boolean })?.secret) {
    conditions.push(eq((schema.properties as any).isSecret, true));
  }
  if (opts?.search) {
    const searchTerm = `%${opts.search}%`;
    conditions.push(
      or(
        ilike(schema.properties.title, searchTerm),
        ilike(schema.properties.address, searchTerm),
        ilike(schema.properties.neighborhood, searchTerm),
        ilike(schema.properties.city, searchTerm),
        ilike(schema.properties.description, searchTerm)
      )!
    );
  }

  let orderBy;
  switch (opts?.sortBy) {
    case "price_asc":
      orderBy = asc(sql`CAST(${schema.properties.price} AS NUMERIC)`);
      break;
    case "price_desc":
      orderBy = desc(sql`CAST(${schema.properties.price} AS NUMERIC)`);
      break;
    case "oldest":
      orderBy = asc(schema.properties.createdAt);
      break;
    case "newest":
    default:
      orderBy = desc(schema.properties.createdAt);
      break;
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [items, countResult] = await Promise.all([
    db
      .select()
      .from(schema.properties)
      .where(where)
      .orderBy(orderBy)
      .limit(opts?.limit || 20)
      .offset(opts?.offset || 0),
    db
      .select({ count: sql<number>`count(*)` })
      .from(schema.properties)
      .where(where),
  ]);

  return {
    items,
    total: Number(countResult[0]?.count || 0),
  };
}

export async function getPropertyBySlug(slug: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(schema.properties)
    .where(eq(schema.properties.slug, slug))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getPropertyById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(schema.properties)
    .where(eq(schema.properties.id, id))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getFeaturedProperties(limit = 4) {
  const db = await getDb();
  if (!db) return [];
  try {
    // Only real listings with extracted images (no mock/placeholder)
    // Rotate daily: order by md5(id||date) so the same set gets a fresh order each day
    const hasRealImage = sql`${schema.properties.mainImageUrl} IS NOT NULL AND ${schema.properties.mainImageUrl} != '' AND ${schema.properties.mainImageUrl} NOT LIKE '/placeholder%' AND (${schema.properties.mainImageUrl} LIKE 'http://%' OR ${schema.properties.mainImageUrl} LIKE 'https://%')`;
    const dailyOrder = sql`md5(concat(${schema.properties.id}::text, current_date::text))`;
    return await db
      .select()
      .from(schema.properties)
      .where(and(eq(schema.properties.status, "active"), hasRealImage))
      .orderBy(desc(schema.properties.isFeatured), dailyOrder)
      .limit(limit);
  } catch (err) {
    console.warn("[Database] getFeaturedProperties failed:", err);
    return [];
  }
}

export async function getAllPropertyLocations() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: schema.properties.id,
      slug: schema.properties.slug,
      title: schema.properties.title,
      address: schema.properties.address,
      price: schema.properties.price,
      priceLabel: schema.properties.priceLabel,
      latitude: schema.properties.latitude,
      longitude: schema.properties.longitude,
      bedrooms: schema.properties.bedrooms,
      bathrooms: schema.properties.bathrooms,
      mainImageUrl: schema.properties.mainImageUrl,
    })
    .from(schema.properties)
    .where(eq(schema.properties.status, "active"));
}

export async function insertProperty(data: InsertProperty) {
  const db = await getDb();
  if (!db) return null;
  const [created] = await db.insert(schema.properties).values(data).returning();
  return created;
}

// ============ INQUIRIES ============

export async function createInquiry(data: InsertInquiry) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [created] = await db.insert(schema.inquiries).values(data).returning();
  return created;
}

export async function getInquiries(opts?: { status?: string; limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions: any[] = [];
  if (opts?.status) {
    conditions.push(eq(schema.inquiries.status, opts.status as any));
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  return db
    .select()
    .from(schema.inquiries)
    .where(where)
    .orderBy(desc(schema.inquiries.createdAt))
    .limit(opts?.limit || 50)
    .offset(opts?.offset || 0);
}

export async function updateInquiryStatus(id: number, status: "new" | "read" | "replied" | "archived") {
  const db = await getDb();
  if (!db) return null;
  const [updated] = await db
    .update(schema.inquiries)
    .set({ status, updatedAt: new Date() })
    .where(eq(schema.inquiries.id, id))
    .returning();
  return updated;
}

// ============ SAVED PROPERTIES ============

export async function getSavedProperties(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      savedProperty: schema.savedProperties,
      property: schema.properties,
    })
    .from(schema.savedProperties)
    .innerJoin(schema.properties, eq(schema.savedProperties.propertyId, schema.properties.id))
    .where(eq(schema.savedProperties.userId, userId))
    .orderBy(desc(schema.savedProperties.createdAt));
}

// ============ TEAM ============

export async function getTeamMembers() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(schema.teamMembers)
    .orderBy(asc(schema.teamMembers.orderIndex), asc(schema.teamMembers.name));
}

// ============ CAREERS ============

export async function getCareers(activeOnly = true) {
  const db = await getDb();
  if (!db) return [];
  const conditions: any[] = [];
  if (activeOnly) {
    conditions.push(eq(schema.careers.isActive, true));
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  return db
    .select()
    .from(schema.careers)
    .where(where)
    .orderBy(desc(schema.careers.createdAt));
}

// ============ TESTIMONIALS ============

export async function getTestimonials(limit?: number) {
  const db = await getDb();
  if (!db) return [];
  let q = db
    .select()
    .from(schema.testimonials)
    .orderBy(asc(schema.testimonials.orderIndex), desc(schema.testimonials.createdAt));
  if (limit) {
    q = q.limit(limit) as any;
  }
  return q;
}

// ============ SECRET SIGNUPS ============

export async function createSecretSignup(email: string, name?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [created] = await db.insert(schema.secretSignups).values({ email, name }).returning();
  return created;
}

// ============ SAVED PROPERTIES ============

export async function toggleSavedProperty(userId: number, propertyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [existing] = await db
    .select()
    .from(schema.savedProperties)
    .where(
      and(
        eq(schema.savedProperties.userId, userId),
        eq(schema.savedProperties.propertyId, propertyId)
      )
    );

  if (existing) {
    await db.delete(schema.savedProperties).where(eq(schema.savedProperties.id, existing.id));
    return { saved: false };
  }

  await db.insert(schema.savedProperties).values({ userId, propertyId });
  return { saved: true };
}
