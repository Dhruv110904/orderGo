import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { orders, orderItems, products, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { toBaseUnit, pricePerOrderedUnit } from "@/lib/units";
import { z } from "zod";

const createOrderSchema = z.object({
  notes: z.string().optional().nullable(),
  deliveryAddress: z.string().min(10, "Please provide a full delivery address (min 10 characters)"),
  paymentMethod: z.literal("cod").default("cod"),
  items: z.array(
    z.object({
      productId: z.string().uuid("Invalid product ID"),
      orderedUnit: z.string().min(1, "Ordered unit is required"),
      orderedQuantity: z.coerce.number().positive("Quantity must be positive"),
    })
  ).min(1, "Order must have at least one item"),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "";

  try {
    let orderQuery;

    if (session.user.role === "admin") {
      orderQuery = db
        .select({
          id: orders.id,
          status: orders.status,
          totalAmount: orders.totalAmount,
          notes: orders.notes,
          deliveryAddress: orders.deliveryAddress,
          paymentMethod: orders.paymentMethod,
          createdAt: orders.createdAt,
          updatedAt: orders.updatedAt,
          userName: users.name,
          userEmail: users.email,
        })
        .from(orders)
        .leftJoin(users, eq(orders.userId, users.id));
    } else {
      orderQuery = db
        .select({
          id: orders.id,
          status: orders.status,
          totalAmount: orders.totalAmount,
          notes: orders.notes,
          deliveryAddress: orders.deliveryAddress,
          paymentMethod: orders.paymentMethod,
          createdAt: orders.createdAt,
          updatedAt: orders.updatedAt,
          userName: users.name,
          userEmail: users.email,
        })
        .from(orders)
        .leftJoin(users, eq(orders.userId, users.id))
        .where(eq(orders.userId, session.user.id));
    }

    const fetchedOrders = await orderQuery.orderBy(desc(orders.createdAt));

    const filteredOrders = status
      ? fetchedOrders.filter((o) => o.status === status)
      : fetchedOrders;

    return NextResponse.json(filteredOrders);
  } catch (error: any) {
    console.error("GET orders failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const result = createOrderSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation Error", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { notes, deliveryAddress, paymentMethod, items } = result.data;

    // --- Step 1: Validate all products and compute totals ---
    let orderTotal = 0;
    const orderItemInserts: any[] = [];

    for (const item of items) {
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, item.productId))
        .limit(1);

      if (!product) {
        return NextResponse.json(
          { error: `Product with ID ${item.productId} not found.` },
          { status: 400 }
        );
      }

      if (!product.isActive) {
        return NextResponse.json(
          { error: `Product "${product.name}" is no longer active and cannot be ordered.` },
          { status: 400 }
        );
      }

      const baseQty = toBaseUnit(item.orderedQuantity, item.orderedUnit);
      const basePrice = parseFloat(product.basePricePerUnit);
      const orderedPrice = pricePerOrderedUnit(basePrice, item.orderedUnit);
      const lineTotal = parseFloat((item.orderedQuantity * orderedPrice).toFixed(2));

      orderTotal += lineTotal;

      orderItemInserts.push({
        productId: item.productId,
        orderedUnit: item.orderedUnit,
        orderedQuantity: item.orderedQuantity.toString(),
        baseQuantity: baseQty.toString(),
        unitPriceInOrderedUnit: orderedPrice.toString(),
        lineTotal: lineTotal.toString(),
      });
    }

    // --- Step 2: Insert the order ---
    const [newOrder] = await db
      .insert(orders)
      .values({
        userId: session.user.id,
        status: "pending",
        totalAmount: orderTotal.toFixed(2),
        notes,
        deliveryAddress,
        paymentMethod,
      })
      .returning();

    // --- Step 3: Insert order items ---
    for (const orderItem of orderItemInserts) {
      await db.insert(orderItems).values({
        orderId: newOrder.id,
        productId: orderItem.productId,
        orderedUnit: orderItem.orderedUnit,
        orderedQuantity: orderItem.orderedQuantity,
        baseQuantity: orderItem.baseQuantity,
        unitPriceInOrderedUnit: orderItem.unitPriceInOrderedUnit,
        lineTotal: orderItem.lineTotal,
      });
    }

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error: any) {
    console.error("POST order failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to place order" },
      { status: 400 }
    );
  }
}
