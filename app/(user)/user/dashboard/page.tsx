import { db } from "@/lib/db";
import { orders } from "@/db/schema";
import { sql, eq, or, desc } from "drizzle-orm";
import { formatCurrency } from "@/lib/units";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingBag, Clock, History, DollarSign, ArrowRight, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const revalidate = 0; // live dashboard updates

export default async function UserDashboardPage() {
  const session = await auth();
  if (!session || session.user.role !== "user") {
    redirect("/login");
  }

  const userId = session.user.id;

  // Query user specific stats
  const [
    [totalOrdersResult],
    [pendingOrdersResult],
    [spentResult],
    recentOrders,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(orders).where(eq(orders.userId, userId)),
    db.select({ count: sql<number>`count(*)` }).from(orders).where(and(eq(orders.userId, userId), eq(orders.status, "pending"))),
    db
      .select({ total: sql<string>`sum(total_amount)` })
      .from(orders)
      .where(
        and(
          eq(orders.userId, userId),
          or(eq(orders.status, "confirmed"), eq(orders.status, "fulfilled"))
        )
      ),
    db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt))
      .limit(5),
  ]);

  // Helper helper to handle optional queries
  function and(...conditions: any[]) {
    // simple helper because of local scope or import
    const active = conditions.filter(Boolean);
    return sql`(${sql.join(active, sql` AND `)})`;
  }

  const totalOrders = totalOrdersResult?.count || 0;
  const pendingOrders = pendingOrdersResult?.count || 0;
  const totalSpent = parseFloat(spentResult?.total || "0");

  const statCards = [
    {
      title: "Total Purchases",
      value: formatCurrency(totalSpent),
      description: "Confirmed & Fulfilled orders",
      icon: DollarSign,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      title: "Pending Orders",
      value: pendingOrders,
      description: "Awaiting admin confirmation",
      icon: Clock,
      color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
    {
      title: "Total Placed Orders",
      value: totalOrders,
      description: "Historical submission count",
      icon: History,
      color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Welcome, {session.user.name || "User"}!</h1>
        <p className="text-slate-400 text-sm mt-1">Here is a summary of your orders, quotations, and active sales.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="border-slate-800 bg-slate-900/40 text-slate-100">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">{card.title}</CardTitle>
                <div className={`p-2 rounded-lg border ${card.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{card.value}</div>
                <p className="text-xs text-slate-500 mt-1">{card.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Quick Links Card */}
        <Card className="border-slate-800 bg-slate-900/40 text-slate-100 flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">Quick Actions</CardTitle>
            <CardDescription className="text-slate-400">Jump directly into order execution steps.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pb-6 flex-1">
            <Link href="/user/products" className="flex items-center justify-between p-3 rounded-lg bg-slate-950/40 border border-slate-850 hover:border-slate-800 hover:bg-slate-950/70 transition-all group">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-md bg-indigo-500/10 text-indigo-400">
                  <ShoppingBag className="h-4 w-4" />
                </div>
                <span className="text-xs font-semibold text-slate-200">Browse Catalog</span>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
            </Link>

            <Link href="/user/cart" className="flex items-center justify-between p-3 rounded-lg bg-slate-950/40 border border-slate-850 hover:border-slate-800 hover:bg-slate-950/70 transition-all group">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400">
                  <ShoppingCart className="h-4 w-4" />
                </div>
                <span className="text-xs font-semibold text-slate-200">Shopping Cart</span>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
            </Link>
          </CardContent>
        </Card>

        {/* Recent Orders List Card */}
        <Card className="border-slate-800 bg-slate-900/40 text-slate-100 md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-800/60">
            <div>
              <CardTitle className="text-lg font-semibold text-white">Your Recent Orders</CardTitle>
              <CardDescription className="text-slate-400">Status of your last 5 order requests</CardDescription>
            </div>
            <Link href="/user/orders" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center font-medium">
              View History <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="pt-4">
            {recentOrders.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">You have not placed any orders yet.</p>
            ) : (
              <div className="space-y-3.5">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-950/40 border border-slate-850 hover:border-slate-800 transition-colors">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Link href={`/user/orders/${order.id}`} className="text-sm font-semibold text-indigo-400 hover:underline truncate">
                          #{order.id.slice(0, 8)}
                        </Link>
                        <span className="text-[10px] text-slate-500">
                          {new Date(order.createdAt!).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 italic mt-0.5 truncate block max-w-md">
                        {order.notes ? `"${order.notes}"` : "No notes."}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-semibold text-white">{formatCurrency(order.totalAmount)}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          order.status === "confirmed"
                            ? "bg-emerald-950/60 border border-emerald-700/50 text-emerald-300"
                            : order.status === "fulfilled"
                            ? "bg-blue-950/60 border border-blue-700/50 text-blue-300"
                            : order.status === "rejected"
                            ? "bg-rose-950/60 border border-rose-700/50 text-rose-300"
                            : "bg-amber-950/60 border border-amber-700/50 text-amber-300"
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
