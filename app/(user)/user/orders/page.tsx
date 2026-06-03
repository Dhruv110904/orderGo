import { db } from "@/lib/db";
import { orders } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/units";
import { Eye, History, ExternalLink } from "lucide-react";
import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const revalidate = 0; // live order updates

export default async function UserOrdersPage() {
  const session = await auth();
  if (!session || session.user.role !== "user") {
    redirect("/login");
  }

  const userId = session.user.id;

  // Fetch all orders placed by this user
  const userOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt));

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-emerald-950/60 border-emerald-700/50 text-emerald-300";
      case "fulfilled":
        return "bg-blue-950/60 border-blue-700/50 text-blue-300";
      case "rejected":
        return "bg-rose-950/60 border-rose-700/50 text-rose-300";
      case "pending":
      default:
        return "bg-amber-950/60 border-amber-700/50 text-amber-300";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Order History</h1>
        <p className="text-slate-400 text-sm mt-1">Review the status and details of your previous orders and requests.</p>
      </div>

      {/* Orders Table */}
      <Card className="border-slate-800 bg-slate-900/40 text-slate-100 shadow-xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <History className="h-5 w-5 text-indigo-400" />
            Your Submissions
          </CardTitle>
          <CardDescription className="text-slate-400">
            A list of all quotation requests and warehouse order logs you have made.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-950/40 border-b border-slate-850 text-slate-400">
              <TableRow className="border-b border-slate-850 hover:bg-transparent">
                <TableHead className="w-1/5">Order ID</TableHead>
                <TableHead>Date Placed</TableHead>
                <TableHead className="w-1/3">Notes</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userOrders.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                    No orders placed yet.
                  </TableCell>
                </TableRow>
              ) : (
                userOrders.map((order) => (
                  <TableRow key={order.id} className="border-b border-slate-850/80 hover:bg-slate-900/20 text-slate-300 transition-colors">
                    <TableCell className="font-mono text-xs font-semibold text-indigo-400">
                      <Link href={`/user/orders/${order.id}`} className="hover:underline">
                        #{order.id.slice(0, 8)}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm">
                      {order.createdAt ? (
                        <div className="flex flex-col">
                          <span>
                            {new Date(order.createdAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                          <span className="text-[10px] text-slate-500 mt-0.5">
                            {new Date(order.createdAt).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-sm max-w-xs truncate italic text-slate-400">
                      {order.notes ? `"${order.notes}"` : <span className="text-slate-600 not-italic">No notes</span>}
                    </TableCell>
                    <TableCell className="font-bold text-white">
                      {formatCurrency(order.totalAmount)}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase border ${getStatusBadgeClass(order.status)}`}>
                        {order.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/user/orders/${order.id}`}>
                        <Button variant="ghost" size="sm" className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/20 gap-1.5 py-1">
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
