import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateProductSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  sku: z.string().min(1, "SKU is required").max(100),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  baseUnit: z.enum(["g", "mL", "unit"]),
  basePricePerUnit: z.coerce.number().positive("Base price per unit must be greater than 0"),
  stockQuantity: z.coerce.number().nonnegative("Stock quantity cannot be negative"),
  isActive: z.boolean().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  try {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error: any) {
    console.error("GET product detail failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch product details", details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  const { id } = params;

  try {
    const body = await req.json();
    const result = updateProductSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation Error", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, sku, description, category, baseUnit, basePricePerUnit, stockQuantity, isActive } = result.data;

    // Check SKU conflicts on other products
    const [existingSKU] = await db
      .select()
      .from(products)
      .where(eq(products.sku, sku))
      .limit(1);

    if (existingSKU && existingSKU.id !== id) {
      return NextResponse.json(
        { error: `SKU "${sku}" is already in use by another product.` },
        { status: 409 }
      );
    }

    const [updatedProduct] = await db
      .update(products)
      .set({
        name,
        sku,
        description,
        category,
        baseUnit,
        basePricePerUnit: basePricePerUnit.toFixed(6),
        stockQuantity: stockQuantity.toFixed(6),
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    if (!updatedProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(updatedProduct);
  } catch (error: any) {
    console.error("PUT product update failed:", error);
    return NextResponse.json(
      { error: "Failed to update product", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  const { id } = params;

  try {
    const [deletedProduct] = await db
      .delete(products)
      .where(eq(products.id, id))
      .returning();

    if (!deletedProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Product deleted successfully", product: deletedProduct });
  } catch (error: any) {
    console.error("DELETE product failed:", error);
    
    // Check for foreign key constraint violation
    if (error.code === "23503" || error.message.includes("violates foreign key constraint")) {
      return NextResponse.json(
        { 
          error: "Cannot delete product because it has associated order items.",
          details: "Try turning off the product's 'Active' status to hide it from users instead."
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete product", details: error.message },
      { status: 500 }
    );
  }
}
