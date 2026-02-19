import { relations } from "drizzle-orm";
import { users, properties, inquiries, savedProperties } from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  savedProperties: many(savedProperties),
}));

export const propertiesRelations = relations(properties, ({ many }) => ({
  inquiries: many(inquiries),
  savedBy: many(savedProperties),
}));

export const inquiriesRelations = relations(inquiries, ({ one }) => ({
  property: one(properties, {
    fields: [inquiries.propertyId],
    references: [properties.id],
  }),
}));

export const savedPropertiesRelations = relations(savedProperties, ({ one }) => ({
  user: one(users, {
    fields: [savedProperties.userId],
    references: [users.id],
  }),
  property: one(properties, {
    fields: [savedProperties.propertyId],
    references: [properties.id],
  }),
}));
