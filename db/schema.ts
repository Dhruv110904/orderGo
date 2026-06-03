import { pgTable, uuid, varchar, text, timestamp, boolean, numeric, check } from "drizzle-orm/pg-core";
import { sql, relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  role: varchar("role", { length: 20 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    roleCheck: check("role_check", sql`${table.role} IN ('admin', 'seller')`),
  };
});

export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  sku: varchar("sku", { length: 100 }).unique().notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  baseUnit: varchar("base_unit", { length: 10 }).notNull(), // 'g', 'mL', or 'unit'
  basePricePerUnit: numeric("base_price_per_unit", { precision: 20, scale: 6 }).notNull(),
  stockQuantity: numeric("stock_quantity", { precision: 20, scale: 6 }).default("0").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id),
  status: varchar("status", { length: 30 }).default("pending").notNull(),
  totalAmount: numeric("total_amount", { precision: 20, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    statusCheck: check("status_check", sql`${table.status} IN ('pending', 'confirmed', 'rejected', 'fulfilled')`),
  };
});

export const orderItems = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id").references(() => products.id),
  orderedUnit: varchar("ordered_unit", { length: 10 }).notNull(), // 'g', 'kg', 'mL', 'L', 'unit'
  orderedQuantity: numeric("ordered_quantity", { precision: 20, scale: 6 }).notNull(),
  baseQuantity: numeric("base_quantity", { precision: 20, scale: 6 }).notNull(),
  unitPriceInOrderedUnit: numeric("unit_price_in_ordered_unit", { precision: 20, scale: 6 }).notNull(),
  lineTotal: numeric("line_total", { precision: 20, scale: 2 }).notNull(),
});

// Relationships
export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
}));

export const productsRelations = relations(products, ({ many }) => ({
  orderItems: many(orderItems),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));
