import { db } from "@/lib/db";
import { products } from "@/db/schema";
import { desc, sql } from "drizzle-orm";
import ProductsListClient from "./ProductsListClient";

export const revalidate = 0; // live product data

export default async function AdminProductsPage() {
  // Fetch products sorted by name
  const allProducts = await db
    .select()
    .from(products)
    .orderBy(products.name);

  // Fetch unique categories for filtering
  const categoryResults = await db
    .selectDistinct({ category: products.category })
    .from(products)
    .where(sql`${products.category} IS NOT NULL AND ${products.category} != ''`);

  const categories = categoryResults
    .map((c) => c.category)
    .filter(Boolean) as string[];

  return (
    <div className="space-y-6">
      <ProductsListClient initialProducts={allProducts} categories={categories} />
    </div>
  );
}
