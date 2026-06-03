import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { orders, orderItems, products, users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";

const updateStatusSchema = z.object({
  status: z.enum(["pending", "confirmed", "rejected", "fulfilled"]),
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
    const [order] = await db
      .select({
        id: orders.id,
        status: orders.status,
        totalAmount: orders.totalAmount,
        notes: orders.notes,
        deliveryAddress: orders.deliveryAddress,
        paymentMethod: orders.paymentMethod,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        userId: orders.userId,
        userName: users.name,
        userEmail: users.email,
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .where(eq(orders.id, id))
      .limit(1);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Role guard: admin sees any order, user only sees their own
    if (session.user.role === "user" && order.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden: Access denied" }, { status: 403 });
    }

    const items = await db
      .select({
        id: orderItems.id,
        productId: orderItems.productId,
        orderedUnit: orderItems.orderedUnit,
        orderedQuantity: orderItems.orderedQuantity,
        baseQuantity: orderItems.baseQuantity,
        unitPriceInOrderedUnit: orderItems.unitPriceInOrderedUnit,
        lineTotal: orderItems.lineTotal,
        productName: products.name,
        productSku: products.sku,
        productBaseUnit: products.baseUnit,
        productStock: products.stockQuantity,
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, id));

    return NextResponse.json({ order, items });
  } catch (error: any) {
    console.error("GET order detail failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch order details", details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    const result = updateStatusSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation Error", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { status: newStatus } = result.data;

    // --- Step 1: Fetch current order ---
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const oldStatus = order.status;

    // No-op if the status hasn't changed
    if (oldStatus === newStatus) {
      return NextResponse.json(order);
    }

    // --- Step 2: Fetch order items ---
    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, id));

    const wasDeducted = oldStatus === "confirmed" || oldStatus === "fulfilled";
    const isDeductedNow = newStatus === "confirmed" || newStatus === "fulfilled";

    // --- Step 3: Stock deduction (pending → confirmed/fulfilled) ---
    if (!wasDeducted && isDeductedNow) {
      for (const item of items) {
        if (!item.productId) continue;

        const [product] = await db
          .select()
          .from(products)
          .where(eq(products.id, item.productId))
          .limit(1);

        if (!product) {
          return NextResponse.json(
            { error: `Product not found for order item ${item.id}` },
            { status: 400 }
          );
        }

        const stock = parseFloat(product.stockQuantity);
        const required = parseFloat(item.baseQuantity);

        if (stock < required) {
          return NextResponse.json(
            {
              error: `Insufficient stock for "${product.name}". Available: ${stock} ${product.baseUnit}, Required: ${required} ${product.baseUnit}.`,
            },
            { status: 400 }
          );
        }

        // Deduct stock using atomic SQL expression to avoid race conditions
        await db
          .update(products)
          .set({
            stockQuantity: sql`${products.stockQuantity} - ${required.toFixed(6)}`,
            updatedAt: new Date(),
          })
          .where(eq(products.id, item.productId));
      }
    }

    // --- Step 4: Stock restoration (confirmed/fulfilled → rejected/pending) ---
    if (wasDeducted && !isDeductedNow) {
      for (const item of items) {
        if (!item.productId) continue;

        const restored = parseFloat(item.baseQuantity);

        // Restore stock atomically
        await db
          .update(products)
          .set({
            stockQuantity: sql`${products.stockQuantity} + ${restored.toFixed(6)}`,
            updatedAt: new Date(),
          })
          .where(eq(products.id, item.productId));
      }
    }

    // --- Step 5: Update order status ---
    const [updatedOrder] = await db
      .update(orders)
      .set({
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();

    return NextResponse.json(updatedOrder);
  } catch (error: any) {
    console.error("PATCH order status failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update order status" },
      { status: 400 }
    );
  }
}
