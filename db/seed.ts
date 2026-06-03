import bcrypt from "bcryptjs";
import { db } from "../lib/db";
import { users, products } from "./schema";

async function main() {
  console.log("Seeding database...");

  try {
    // 1. Seed Users
    console.log("Seeding users...");
    const adminPasswordHash = await bcrypt.hash("Admin@123", 10);
    const userPasswordHash = await bcrypt.hash("User@123", 10);

    const seededUsers = await db
      .insert(users)
      .values([
        {
          name: "System Admin",
          email: "admin@aasa.com",
          passwordHash: adminPasswordHash,
          role: "admin",
        },
        {
          name: "John User",
          email: "user@aasa.com",
          passwordHash: userPasswordHash,
          role: "user",
        },
      ])
      .onConflictDoNothing({ target: users.email })
      .returning();

    console.log(`Seeded ${seededUsers.length} users (any conflicts were skipped).`);

    // 2. Seed Products
    console.log("Seeding products...");
    const seededProducts = await db
      .insert(products)
      .values([
        {
          name: "Premium Basmati Rice",
          sku: "RICE001",
          description: "Long-grain aromatic basmati rice.",
          category: "Groceries",
          baseUnit: "g",
          basePricePerUnit: "0.060000", // ₹60 per kg (₹0.06 per g)
          stockQuantity: "150000.000000", // 150 kg in grams
          isActive: true,
        },
        {
          name: "Fresh Whole Milk",
          sku: "MILK001",
          description: "Pasteurized farm-fresh whole milk.",
          category: "Dairy",
          baseUnit: "mL",
          basePricePerUnit: "0.070000", // ₹70 per L (₹0.07 per mL)
          stockQuantity: "80000.000000", // 80 L in mL
          isActive: true,
        },
        {
          name: "Organic Brown Eggs",
          sku: "EGGS001",
          description: "Fresh organic free-range brown eggs.",
          category: "Poultry",
          baseUnit: "unit",
          basePricePerUnit: "6.500000", // ₹6.50 per unit
          stockQuantity: "300.000000", // 300 units
          isActive: true,
        },
        {
          name: "Whole Wheat Flour (Atta)",
          sku: "FLOUR001",
          description: "100% stone-ground whole wheat flour.",
          category: "Groceries",
          baseUnit: "g",
          basePricePerUnit: "0.040000", // ₹40 per kg (₹0.04 per g)
          stockQuantity: "200000.000000", // 200 kg in grams
          isActive: true,
        },
        {
          name: "Mineral Drinking Water",
          sku: "WATER001",
          description: "Purified natural mineral drinking water.",
          category: "Beverages",
          baseUnit: "mL",
          basePricePerUnit: "0.020000", // ₹20 per L (₹0.02 per mL)
          stockQuantity: "120000.000000", // 120 L in mL
          isActive: true,
        },
        {
          name: "Blue Ballpoint Pens (Box of 10)",
          sku: "PEN001",
          description: "Smooth-writing blue ink ballpoint pens.",
          category: "Stationery",
          baseUnit: "unit",
          basePricePerUnit: "80.000000", // ₹80 per box
          stockQuantity: "50.000000", // 50 boxes
          isActive: true,
        },
      ])
      .onConflictDoNothing({ target: products.sku })
      .returning();

    console.log(`Seeded ${seededProducts.length} products (any conflicts were skipped).`);
    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

main();
