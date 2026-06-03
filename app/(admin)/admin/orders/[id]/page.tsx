import { db } from "@/lib/db";
import { orders, orderItems, products, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import OrderDetailAdminClient from "./OrderDetailAdminClient";

interface AdminOrderDetailPageProps {
  params: {
    id: string;
  };
}

export const revalidate = 0; // live order details

export default async function AdminOrderDetailPage({ params }: AdminOrderDetailPageProps) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    redirect("/login");
  }

  const { id } = params;

  // 1. Fetch order details joined with user info
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
    notFound();
  }

  // 2. Fetch order items joined with product info
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

  return (
    <div className="space-y-6">
      <OrderDetailAdminClient order={order} items={items} />
    </div>
  );
}
