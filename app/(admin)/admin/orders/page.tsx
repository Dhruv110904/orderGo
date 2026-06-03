import { db } from "@/lib/db";
import { orders, users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import OrdersListClient from "./OrdersListClient";

export const revalidate = 0; // live order updates

export default async function AdminOrdersPage() {
  // Fetch all orders with user information
  const allOrders = await db
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
    .orderBy(desc(orders.createdAt));

  return (
    <div className="space-y-6">
      <OrdersListClient initialOrders={allOrders} />
    </div>
  );
}
