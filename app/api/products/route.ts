import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { products } from "@/db/schema";
import { eq, like, or, and, sql } from "drizzle-orm";
import { z } from "zod";

const createProductSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  sku: z.string().min(1, "SKU is required").max(100),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  baseUnit: z.enum(["g", "mL", "unit"]),
  basePricePerUnit: z.coerce.number().positive("Base price per unit must be greater than 0"),
  stockQuantity: z.coerce.number().nonnegative("Stock quantity cannot be negative"),
  isActive: z.boolean().optional().default(true),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query") || "";
  const category = searchParams.get("category") || "";
  const baseUnit = searchParams.get("baseUnit") || "";

  try {
    const conditions = [];

    // Filter by role: Users only see active products. Admins see all.
    if (session.user.role === "user") {
      conditions.push(eq(products.isActive, true));
    }

    if (query) {
      conditions.push(
        or(
          like(products.name, `%${query}%`),
          like(products.sku, `%${query}%`)
        )
      );
    }

    if (category) {
      conditions.push(eq(products.category, category));
    }

    if (baseUnit) {
      conditions.push(eq(products.baseUnit, baseUnit));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const allProducts = await db
      .select()
      .from(products)
      .where(whereClause)
      .orderBy(products.name);

    return NextResponse.json(allProducts);
  } catch (error: any) {
    console.error("GET products failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch products", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const result = createProductSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation Error", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, sku, description, category, baseUnit, basePricePerUnit, stockQuantity, isActive } = result.data;

    // Check if SKU already exists
    const [existingProduct] = await db
      .select()
      .from(products)
      .where(eq(products.sku, sku))
      .limit(1);

    if (existingProduct) {
      return NextResponse.json(
        { error: `SKU "${sku}" is already in use.` },
        { status: 409 }
      );
    }

    const [newProduct] = await db
      .insert(products)
      .values({
        name,
        sku,
        description,
        category,
        baseUnit,
        basePricePerUnit: basePricePerUnit.toFixed(6),
        stockQuantity: stockQuantity.toFixed(6),
        isActive,
      })
      .returning();

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error: any) {
    console.error("POST product failed:", error);
    return NextResponse.json(
      { error: "Failed to create product", details: error.message },
      { status: 500 }
    );
  }
}
