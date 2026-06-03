import { db } from "@/lib/db";
import { orders, orderItems, products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/units";
import { ArrowLeft, Clock, CheckCircle, XCircle, ChevronRight, MessageSquare, AlertCircle, MapPin, Banknote } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface UserOrderDetailPageProps {
  params: {
    id: string;
  };
}

export const revalidate = 0; // live order updates

export default async function UserOrderDetailPage({ params }: UserOrderDetailPageProps) {
  const session = await auth();
  if (!session || session.user.role !== "user") {
    redirect("/login");
  }

  const { id } = params;

  // 1. Fetch order details
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, id))
    .limit(1);

  if (!order) {
    notFound();
  }

  // Guard: Ensure this user owns the order
  if (order.userId !== session.user.id) {
    redirect("/user/orders");
  }

  // 2. Fetch order items joined with products
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
    })
    .from(orderItems)
    .leftJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orderItems.orderId, id));

  const getStatusIcon = (st: string) => {
    switch (st) {
      case "confirmed":
        return <CheckCircle className="h-5 w-5 text-emerald-400" />;
      case "fulfilled":
        return <CheckCircle className="h-5 w-5 text-blue-450 font-bold" />;
      case "rejected":
        return <XCircle className="h-5 w-5 text-rose-400" />;
      case "pending":
      default:
        return <Clock className="h-5 w-5 text-amber-400 animate-pulse" />;
    }
  };

  const getStatusCardClass = (st: string) => {
    switch (st) {
      case "confirmed":
        return "border-emerald-500/20 bg-emerald-500/5 text-slate-100";
      case "fulfilled":
        return "border-blue-500/20 bg-blue-500/5 text-slate-100";
      case "rejected":
        return "border-rose-500/20 bg-rose-500/5 text-slate-100";
      case "pending":
      default:
        return "border-amber-500/20 bg-amber-500/5 text-slate-100";
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <div className="flex items-center gap-4">
        <Link href="/user/orders" className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Orders</span>
            <ChevronRight className="h-3 w-3 text-slate-655" />
            <span className="text-indigo-400 text-xs font-semibold tracking-wider">#{order.id.slice(0, 8)}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mt-1">Order Summary</h1>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Order stats and items list */}
        <div className="space-y-6 lg:col-span-2">
          {/* Order Header Summary */}
          <Card className="border-slate-800 bg-slate-900/40 text-slate-100 shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white">Order Details</CardTitle>
              <CardDescription className="text-slate-400">
                Created on {order.createdAt ? new Date(order.createdAt).toLocaleString("en-IN") : "-"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-slate-500 block text-xs">Order ID Reference</span>
                  <span className="font-mono text-xs text-slate-400">{order.id}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-500 block text-xs">Last Updated</span>
                  <span className="font-semibold text-slate-200">
                    {order.updatedAt ? new Date(order.updatedAt).toLocaleString("en-IN") : "-"}
                  </span>
                </div>
              </div>

              {/* Payment Method */}
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <Banknote className="h-5 w-5 text-amber-400 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-amber-300 uppercase tracking-wide">Payment Method</p>
                  <p className="text-sm font-semibold text-white mt-0.5">
                    {order.paymentMethod === "cod" ? "Cash on Delivery (COD)" : order.paymentMethod ?? "-"}
                  </p>
                </div>
              </div>

              {/* Delivery Address */}
              {order.deliveryAddress && (
                <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                  <MapPin className="h-5 w-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-indigo-300 uppercase tracking-wide">Delivery Address</p>
                    <p className="text-sm text-slate-200 mt-1 leading-relaxed whitespace-pre-line">{order.deliveryAddress}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Items Table */}
          <Card className="border-slate-800 bg-slate-900/40 text-slate-100 shadow-xl">
            <CardHeader className="border-b border-slate-800/60">
              <CardTitle className="text-lg font-semibold text-white">Line Items</CardTitle>
              <CardDescription className="text-slate-400">Detailed list of units ordered and converted values.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-950/40 border-b border-slate-850 text-slate-400">
                  <TableRow className="border-b border-slate-850">
                    <TableHead>Product Name</TableHead>
                    <TableHead>Ordered Quantity</TableHead>
                    <TableHead>Base Quantity</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead className="text-right">Line Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => {
                    const orderedQty = parseFloat(item.orderedQuantity);
                    const baseQty = parseFloat(item.baseQuantity);
                    const unitPrice = parseFloat(item.unitPriceInOrderedUnit);
                    const lineTotal = parseFloat(item.lineTotal);

                    return (
                      <TableRow key={item.id} className="border-b border-slate-850 hover:bg-slate-900/10 text-slate-300">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold text-white">{item.productName || "Deleted Product"}</span>
                            <span className="text-[10px] text-slate-500">SKU: {item.productSku || "-"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-slate-200">
                          {orderedQty.toLocaleString("en-IN", { maximumFractionDigits: 6 })} {item.orderedUnit}
                        </TableCell>
                        <TableCell className="text-xs text-slate-500">
                          {baseQty.toLocaleString("en-IN", { maximumFractionDigits: 6 })} {item.productBaseUnit}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatCurrency(unitPrice)} / {item.orderedUnit}
                        </TableCell>
                        <TableCell className="text-right font-bold text-white">
                          {formatCurrency(lineTotal)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {/* Total Row */}
                  <TableRow className="bg-slate-950/20 hover:bg-transparent font-bold text-white border-t border-slate-800">
                    <TableCell colSpan={4} className="text-right text-slate-400 py-4">Total Amount:</TableCell>
                    <TableCell className="text-right text-lg text-emerald-450 py-4">
                      {formatCurrency(order.totalAmount)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Notes Card */}
          {order.notes && (
            <Card className="border-slate-800 bg-slate-900/40 text-slate-100 shadow-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-450 flex items-center gap-1.5">
                  <MessageSquare className="h-4 w-4 text-indigo-400" />
                  Your Order Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-300 italic bg-slate-950/40 p-4 rounded-lg border border-slate-850 mx-6 mb-6">
                "{order.notes}"
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Status info timeline */}
        <div className="space-y-6">
          <Card className={cn("border shadow-xl", getStatusCardClass(order.status))}>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                {getStatusIcon(order.status)}
                Order Status: <span className="uppercase tracking-wider">{order.status}</span>
              </CardTitle>
              <CardDescription className="text-slate-400">
                Current processing status of your order submission.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs text-slate-400 leading-relaxed pt-2">
              {order.status === "pending" && (
                <div className="flex gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300">
                  <AlertCircle className="h-4.5 w-4.5 flex-shrink-0" />
                  <p>
                    <strong>Awaiting confirmation</strong>: Admin is verifying product stocks. If stock is ready, it will transition to Confirmed.
                  </p>
                </div>
              )}
              {order.status === "confirmed" && (
                <div className="flex gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                  <CheckCircle className="h-4.5 w-4.5 flex-shrink-0" />
                  <p>
                    <strong>Stock reserved</strong>: The system has locked and deducted the products from inventory. Awaiting shipment packaging.
                  </p>
                </div>
              )}
              {order.status === "fulfilled" && (
                <div className="flex gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300">
                  <CheckCircle className="h-4.5 w-4.5 flex-shrink-0" />
                  <p>
                    <strong>Fulfilled</strong>: Your products have been processed and dispatched/delivered. This transaction is completed.
                  </p>
                </div>
              )}
              {order.status === "rejected" && (
                <div className="flex gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300">
                  <XCircle className="h-4.5 w-4.5 flex-shrink-0" />
                  <p>
                    <strong>Order Rejected</strong>: The request was declined (e.g. because of stock shortages, catalog changes, or cancel request).
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
