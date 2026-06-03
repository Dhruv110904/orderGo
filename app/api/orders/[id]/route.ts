import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { orders, orderItems, products, users } from "@/db/schema";
import { eq } from "drizzle-orm";
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
    // Fetch Order details with User info
    const [order] = await db
      .select({
        id: orders.id,
        status: orders.status,
        totalAmount: orders.totalAmount,
        notes: orders.notes,
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

    // Role guard: Admin can see any order, User can only see their own
    if (session.user.role === "user" && order.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden: Access denied" }, { status: 403 });
    }

    // Fetch order items joined with products details
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

    // Run the status update and inventory adjustment inside a transaction
    const updatedOrder = await db.transaction(async (tx) => {
      // 1. Fetch current order
      const [order] = await tx
        .select()
        .from(orders)
        .where(eq(orders.id, id))
        .limit(1);

      if (!order) {
        throw new Error("Order not found");
      }

      const oldStatus = order.status;
      if (oldStatus === newStatus) {
        return order;
      }

      // Fetch order items to check product stock
      const items = await tx
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, id));

      const wasDeducted = oldStatus === "confirmed" || oldStatus === "fulfilled";
      const isDeductedNow = newStatus === "confirmed" || newStatus === "fulfilled";

      // 2. Perform Stock Adjustments
      if (!wasDeducted && isDeductedNow) {
        // We are confirming the order. Deduct stock.
        for (const item of items) {
          if (!item.productId) continue;

          // Fetch product
          const [product] = await tx
            .select()
            .from(products)
            .where(eq(products.id, item.productId))
            .limit(1);

          if (!product) {
            throw new Error(`Product not found for item: ${item.id}`);
          }

          const stock = parseFloat(product.stockQuantity);
          const required = parseFloat(item.baseQuantity);

          if (stock < required) {
            throw new Error(
              `Insufficient stock for "${product.name}". Available: ${stock} ${product.baseUnit}, Required: ${required} ${product.baseUnit}.`
            );
          }

          // Deduct stock
          const newStock = stock - required;
          await tx
            .update(products)
            .set({ stockQuantity: newStock.toFixed(6) })
            .where(eq(products.id, item.productId));
        }
      } else if (wasDeducted && !isDeductedNow) {
        // We are rejecting or returning a confirmed order. Restore stock.
        for (const item of items) {
          if (!item.productId) continue;

          // Fetch product
          const [product] = await tx
            .select()
            .from(products)
            .where(eq(products.id, item.productId))
            .limit(1);

          if (!product) continue;

          const stock = parseFloat(product.stockQuantity);
          const restored = parseFloat(item.baseQuantity);

          // Restore stock
          const newStock = stock + restored;
          await tx
            .update(products)
            .set({ stockQuantity: newStock.toFixed(6) })
            .where(eq(products.id, item.productId));
        }
      }

      // 3. Update Order Status
      const [updated] = await tx
        .update(orders)
        .set({
          status: newStatus,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, id))
        .returning();

      return updated;
    });

    return NextResponse.json(updatedOrder);
  } catch (error: any) {
    console.error("PATCH order status failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update order status" },
      { status: 400 }
    );
  }
}
