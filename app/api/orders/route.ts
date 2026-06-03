import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { orders, orderItems, products, users } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { toBaseUnit, pricePerOrderedUnit } from "@/lib/units";
import { z } from "zod";

const createOrderSchema = z.object({
  notes: z.string().optional().nullable(),
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
      // Admins see all orders
      orderQuery = db
        .select({
          id: orders.id,
          status: orders.status,
          totalAmount: orders.totalAmount,
          notes: orders.notes,
          createdAt: orders.createdAt,
          updatedAt: orders.updatedAt,
          userName: users.name,
          userEmail: users.email,
        })
        .from(orders)
        .leftJoin(users, eq(orders.userId, users.id));
    } else {
      // Users see only their own orders
      orderQuery = db
        .select({
          id: orders.id,
          status: orders.status,
          totalAmount: orders.totalAmount,
          notes: orders.notes,
          createdAt: orders.createdAt,
          updatedAt: orders.updatedAt,
          userName: users.name,
          userEmail: users.email,
        })
        .from(orders)
        .leftJoin(users, eq(orders.userId, users.id))
        .where(eq(orders.userId, session.user.id));
    }

    // Apply status filter if provided
    if (status) {
      // Drizzle doesn't support where on join directly without nesting or where in query
      // Let's filter the results or modify the query
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

    const { notes, items } = result.data;

    // We run the order placement in a transaction
    const newOrder = await db.transaction(async (tx) => {
      let orderTotal = 0;
      const orderItemInserts: any[] = [];

      for (const item of items) {
        // Fetch product
        const [product] = await tx
          .select()
          .from(products)
          .where(eq(products.id, item.productId))
          .limit(1);

        if (!product) {
          throw new Error(`Product with ID ${item.productId} not found.`);
        }

        if (!product.isActive) {
          throw new Error(`Product "${product.name}" is no longer active.`);
        }

        const baseQty = toBaseUnit(item.orderedQuantity, item.orderedUnit);
        const productStock = parseFloat(product.stockQuantity);

        // User-side soft warning check:
        // We can let order creation go through or block it. Let's block if item has absolutely no stock,
        // but let's allow it as "Quotation" if stock is insufficient but positive.
        // To be strict, we'll allow pending orders but let the admin do the hard check at confirmation.
        // However, if the user requests more than available, let's log/allow but show warnings in UI.

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

      // Insert Order
      const [order] = await tx
        .insert(orders)
        .values({
          userId: session.user.id,
          status: "pending",
          totalAmount: orderTotal.toFixed(2),
          notes,
        })
        .returning();

      // Insert Order Items
      for (const orderItem of orderItemInserts) {
        await tx.insert(orderItems).values({
          orderId: order.id,
          productId: orderItem.productId,
          orderedUnit: orderItem.orderedUnit,
          orderedQuantity: orderItem.orderedQuantity,
          baseQuantity: orderItem.baseQuantity,
          unitPriceInOrderedUnit: orderItem.unitPriceInOrderedUnit,
          lineTotal: orderItem.lineTotal,
        });
      }

      return order;
    });

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error: any) {
    console.error("POST order failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to place order" },
      { status: 400 }
    );
  }
}
