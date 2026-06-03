import { db } from "@/lib/db";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import ProductFormClient from "../../ProductFormClient";

interface EditProductPageProps {
  params: {
    id: string;
  };
}

export const revalidate = 0; // live product data

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = params;

  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);

  if (!product) {
    notFound();
  }

  return <ProductFormClient initialProduct={product} />;
}
