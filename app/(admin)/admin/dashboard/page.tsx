import { db } from "@/lib/db";
import { orders, products, users } from "@/db/schema";
import { sql, eq, or, desc, lte, and } from "drizzle-orm";
import { formatCurrency } from "@/lib/units";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Clock, Package, DollarSign, ArrowRight, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

export const revalidate = 0; // Disable server caching for live dashboard data

export default async function AdminDashboardPage() {
  // Fetch stats in parallel
  const [
    [totalOrdersResult],
    [pendingOrdersResult],
    [activeProductsResult],
    [revenueResult],
    recentOrders,
    lowStockProducts,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(orders),
    db.select({ count: sql<number>`count(*)` }).from(orders).where(eq(orders.status, "pending")),
    db.select({ count: sql<number>`count(*)` }).from(products).where(eq(products.isActive, true)),
    db
      .select({ total: sql<string>`sum(total_amount)` })
      .from(orders)
      .where(or(eq(orders.status, "confirmed"), eq(orders.status, "fulfilled"))),
    db
      .select({
        id: orders.id,
        status: orders.status,
        totalAmount: orders.totalAmount,
        createdAt: orders.createdAt,
        sellerName: users.name,
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .orderBy(desc(orders.createdAt))
      .limit(5),
    // Low stock: g < 20kg (20000g), mL < 10L (10000mL), unit < 15 units
    db
      .select()
      .from(products)
      .where(
        and(
          eq(products.isActive, true),
          or(
            and(eq(products.baseUnit, "g"), lte(products.stockQuantity, "20000")),
            and(eq(products.baseUnit, "mL"), lte(products.stockQuantity, "10000")),
            and(eq(products.baseUnit, "unit"), lte(products.stockQuantity, "15"))
          )
        )
      )
      .limit(5),
  ]);

  const totalOrders = totalOrdersResult?.count || 0;
  const pendingOrders = pendingOrdersResult?.count || 0;
  const activeProducts = activeProductsResult?.count || 0;
  const totalRevenue = parseFloat(revenueResult?.total || "0");

  const statCards = [
    {
      title: "Total Revenue",
      value: formatCurrency(totalRevenue),
      description: "Confirmed & Fulfilled orders",
      icon: DollarSign,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      title: "Pending Orders",
      value: pendingOrders,
      description: "Needs admin verification",
      icon: Clock,
      color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
    {
      title: "Active Products",
      value: activeProducts,
      description: "Available in catalog",
      icon: Package,
      color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    },
    {
      title: "Total Orders",
      value: totalOrders,
      description: "Placed by all sellers",
      icon: ShoppingCart,
      color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">
          Welcome to the orderGo control panel. Here is your system overview.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      {/* Alert Feeds and Tables */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent Orders List */}
        <Card className="border-slate-800 bg-slate-900/40 md:col-span-2 text-slate-100">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-800/60">
            <div>
              <CardTitle className="text-lg font-semibold text-white">Recent Orders</CardTitle>
              <CardDescription className="text-slate-400">Latest orders requested by sellers</CardDescription>
            </div>
            <Link href="/admin/orders" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center font-medium">
              View All <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="pt-4">
            {recentOrders.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">No orders placed yet.</p>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-950/40 border border-slate-850 hover:border-slate-800 transition-colors">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/orders/${order.id}`} className="text-sm font-semibold text-indigo-400 hover:underline truncate">
                          #{order.id.slice(0, 8)}
                        </Link>
                        <span className="text-xs text-slate-400">by {order.sellerName}</span>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {new Date(order.createdAt!).toLocaleDateString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
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

        {/* Low Stock Alerts */}
        <Card className="border-slate-800 bg-slate-900/40 text-slate-100">
          <CardHeader className="pb-4 border-b border-slate-800/60">
            <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Low Stock Alerts
            </CardTitle>
            <CardDescription className="text-slate-400">Products requiring replenishment</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {lowStockProducts.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-60" />
                <p className="text-sm text-slate-400 font-medium">All stocks healthy</p>
                <p className="text-xs text-slate-500 mt-0.5">No products fall below warning limits.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.map((product) => {
                  const stock = parseFloat(product.stockQuantity);
                  let displayStock = stock.toString();
                  let displayUnit = product.baseUnit;
                  
                  if (product.baseUnit === "g" && stock >= 1000) {
                    displayStock = (stock / 1000).toFixed(2);
                    displayUnit = "kg";
                  } else if (product.baseUnit === "mL" && stock >= 1000) {
                    displayStock = (stock / 1000).toFixed(2);
                    displayUnit = "L";
                  }

                  return (
                    <div key={product.id} className="p-3 rounded-lg bg-slate-950/40 border border-amber-500/10 hover:border-amber-500/20 transition-colors">
                      <div className="flex justify-between items-start">
                        <Link href={`/admin/products/${product.id}/edit`} className="text-xs font-semibold text-white hover:underline truncate mr-2">
                          {product.name}
                        </Link>
                        <span className="text-[10px] text-amber-400 font-semibold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/10">
                          {displayStock} {displayUnit}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">SKU: {product.sku}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
