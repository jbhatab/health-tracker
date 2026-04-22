import { pgTable, serial, text, integer, jsonb, timestamp } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  color: text('color').notNull(),
})

export const healthFactorGroups = pgTable('health_factor_groups', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  ownerUserId: integer('owner_user_id').references(() => users.id),
})

export const healthFactors = pgTable('health_factors', {
  id: serial('id').primaryKey(),
  groupId: integer('group_id').notNull().references(() => healthFactorGroups.id),
  name: text('name').notNull(),
  unit: text('unit', { enum: ['time', 'lbs', 'reps_weight'] }).notNull(),
  description: text('description'),
  sortOrder: integer('sort_order').default(0),
})

export const entries = pgTable('entries', {
  id: serial('id').primaryKey(),
  date: text('date').notNull(),
  rawText: text('raw_text'),
  scores: jsonb('scores').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  ownedGroups: many(healthFactorGroups),
}))

export const healthFactorGroupsRelations = relations(healthFactorGroups, ({ one, many }) => ({
  owner: one(users, {
    fields: [healthFactorGroups.ownerUserId],
    references: [users.id],
  }),
  factors: many(healthFactors),
}))

export const healthFactorsRelations = relations(healthFactors, ({ one }) => ({
  group: one(healthFactorGroups, {
    fields: [healthFactors.groupId],
    references: [healthFactorGroups.id],
  }),
}))

// Types
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export type HealthFactorGroup = typeof healthFactorGroups.$inferSelect
export type NewHealthFactorGroup = typeof healthFactorGroups.$inferInsert

export type HealthFactor = typeof healthFactors.$inferSelect
export type NewHealthFactor = typeof healthFactors.$inferInsert

export type Entry = typeof entries.$inferSelect
export type NewEntry = typeof entries.$inferInsert

export type UnitType = 'time' | 'lbs' | 'reps_weight'
export type ScoresData = Record<string, Record<string, string>>