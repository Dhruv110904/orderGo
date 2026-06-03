import { db } from "@/lib/db";
import { products } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import SellerProductsClient from "./SellerProductsClient";

export const revalidate = 0; // live catalog updates

export default async function SellerProductsPage() {
  // Sellers only browse active products
  const activeProducts = await db
    .select()
    .from(products)
    .where(eq(products.isActive, true))
    .orderBy(products.name);

  // Fetch unique categories
  const categoryResults = await db
    .selectDistinct({ category: products.category })
    .from(products)
    .where(
      and(
        eq(products.isActive, true),
        sql`${products.category} IS NOT NULL AND ${products.category} != ''`
      )
    );

  // Helper helper to handle optional queries in local scope
  function and(...conditions: any[]) {
    const active = conditions.filter(Boolean);
    return sql`(${sql.join(active, sql` AND `)})`;
  }

  const categories = categoryResults
    .map((c) => c.category)
    .filter(Boolean) as string[];

  return (
    <div className="space-y-6">
      <SellerProductsClient initialProducts={activeProducts} categories={categories} />
    </div>
  );
}
