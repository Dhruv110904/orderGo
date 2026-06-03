"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/units";
import { ArrowLeft, Clock, CheckCircle, XCircle, ChevronRight, MessageSquare, AlertCircle, Loader2, MapPin, Banknote } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderItem {
  id: string;
  productId: string | null;
  orderedUnit: string;
  orderedQuantity: string;
  baseQuantity: string;
  unitPriceInOrderedUnit: string;
  lineTotal: string;
  productName: string | null;
  productSku: string | null;
  productBaseUnit: string | null;
  productStock: string | null;
}

interface Order {
  id: string;
  status: string;
  totalAmount: string;
  notes: string | null;
  deliveryAddress: string | null;
  paymentMethod: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
}

interface OrderDetailAdminClientProps {
  order: Order;
  items: OrderItem[];
}

export default function OrderDetailAdminClient({ order, items }: OrderDetailAdminClientProps) {
  const router = useRouter();
  const [status, setStatus] = useState(order.status);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === status) return;
    
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to update order status.", {
          description: "Inventory checks or transaction failed.",
          duration: 6000,
        });
      } else {
        setStatus(newStatus);
        toast.success(`Order status updated to "${newStatus}"!`);
        router.refresh();
      }
    } catch (error) {
      console.error("Status update error:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusIcon = (st: string) => {
    switch (st) {
      case "confirmed":
        return <CheckCircle className="h-5 w-5 text-emerald-400" />;
      case "fulfilled":
        return <CheckCircle className="h-5 w-5 text-blue-400 font-bold" />;
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
        return "border-emerald-500/20 bg-emerald-500/5";
      case "fulfilled":
        return "border-blue-500/20 bg-blue-500/5";
      case "rejected":
        return "border-rose-500/20 bg-rose-500/5";
      case "pending":
      default:
        return "border-amber-500/20 bg-amber-500/5";
    }
  };

  return (
    <div className="space-y-6">
      {/* Back link */}
      <div className="flex items-center gap-4">
        <Link href="/admin/orders" className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Orders</span>
            <ChevronRight className="h-3 w-3 text-slate-600" />
            <span className="text-indigo-400 text-xs font-semibold tracking-wider">#{order.id.slice(0, 8)}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mt-1">Order Details</h1>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: Order summary and items list */}
        <div className="space-y-6 lg:col-span-2">
          {/* Order Header info */}
          <Card className="border-slate-800 bg-slate-900/40 text-slate-100 shadow-xl">
            <CardHeader className="border-b border-slate-800/60">
              <CardTitle className="text-lg font-semibold text-white">Order Summary</CardTitle>
              <CardDescription className="text-slate-400">
                Submitted by {order.userName} ({order.userEmail})
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-slate-500 block text-xs">Date Submitted</span>
                  <span className="font-semibold text-slate-200">
                    {order.createdAt ? new Date(order.createdAt).toLocaleString("en-IN") : "-"}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-500 block text-xs">Last Updated</span>
                  <span className="font-semibold text-slate-200">
                    {order.updatedAt ? new Date(order.updatedAt).toLocaleString("en-IN") : "-"}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-500 block text-xs">User ID</span>
                  <span className="font-mono text-xs text-slate-400">{order.userId}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-500 block text-xs">Order Reference</span>
                  <span className="font-mono text-xs text-slate-400">{order.id}</span>
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
              <CardDescription className="text-slate-400">List of ordered units and converted stock quantities.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-950/40 border-b border-slate-850 text-slate-400">
                  <TableRow className="border-b border-slate-850">
                    <TableHead>Product Name</TableHead>
                    <TableHead>Ordered Qty</TableHead>
                    <TableHead>Base Qty</TableHead>
                    <TableHead>Price / Ordered Unit</TableHead>
                    <TableHead className="text-right">Line Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => {
                    const orderedQty = parseFloat(item.orderedQuantity);
                    const baseQty = parseFloat(item.baseQuantity);
                    const unitPrice = parseFloat(item.unitPriceInOrderedUnit);
                    const lineTotal = parseFloat(item.lineTotal);

                    // Show stock info
                    const productStock = item.productStock ? parseFloat(item.productStock) : 0;
                    const stockAlert = productStock < baseQty && status === "pending";

                    return (
                      <TableRow key={item.id} className="border-b border-slate-850 hover:bg-slate-900/10 text-slate-300">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold text-white">{item.productName || "Deleted Product"}</span>
                            <span className="text-[10px] text-slate-550">SKU: {item.productSku || "-"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-slate-200">
                          {orderedQty.toLocaleString("en-IN", { maximumFractionDigits: 6 })} {item.orderedUnit}
                        </TableCell>
                        <TableCell className="text-xs text-slate-400">
                          {baseQty.toLocaleString("en-IN", { maximumFractionDigits: 6 })} {item.productBaseUnit}
                          {stockAlert && (
                            <span className="ml-1 text-[9px] text-rose-500 font-semibold bg-rose-500/10 px-1 py-0.5 rounded border border-rose-500/15 block w-max mt-1">
                              Stock low: {productStock.toLocaleString("en-IN")} {item.productBaseUnit} left
                            </span>
                          )}
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
                  {/* Order Total Row */}
                  <TableRow className="bg-slate-950/20 hover:bg-transparent font-bold text-white border-t border-slate-800">
                    <TableCell colSpan={4} className="text-right text-slate-400 py-4">Total Amount:</TableCell>
                    <TableCell className="text-right text-lg text-emerald-400 py-4">
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
                  User Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-300 italic bg-slate-950/40 p-4 rounded-lg border border-slate-850 mx-6 mb-6">
                "{order.notes}"
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column: Action panel (status updating, inventory checklist) */}
        <div className="space-y-6">
          {/* Status Panel Card */}
          <Card className={cn("border text-slate-100 shadow-xl", getStatusCardClass(status))}>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                {getStatusIcon(status)}
                Order Status: <span className="uppercase tracking-wider">{status}</span>
              </CardTitle>
              <CardDescription className="text-slate-400">
                Change status to validate and adjust warehouse stocks.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-slate-400 block font-semibold uppercase">Transition State</label>
                <Select
                  value={status}
                  onValueChange={handleStatusChange}
                  disabled={isUpdating}
                >
                  <SelectTrigger className="w-full bg-slate-950/60 border-slate-800 text-slate-200">
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                    <SelectItem value="pending">Pending Verification</SelectItem>
                    <SelectItem value="confirmed">Confirm & Reserve Stock</SelectItem>
                    <SelectItem value="rejected">Reject Order / Cancel</SelectItem>
                    <SelectItem value="fulfilled">Fulfill & Complete</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isUpdating && (
                <div className="flex items-center justify-center gap-2 text-xs text-slate-400 mt-2">
                  <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                  Running database checks & updating stock...
                </div>
              )}
            </CardContent>
          </Card>

          {/* Verification details */}
          <Card className="border-slate-800 bg-slate-900/40 text-slate-100 shadow-xl text-xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-white">Status Action Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-slate-400 leading-relaxed">
              <div className="flex gap-2">
                <AlertCircle className="h-4 w-4 text-amber-400 flex-shrink-0" />
                <p>
                  <strong>Pending</strong>: Order is placed. Stock has not been decremented yet. Users can edit/cancel.
                </p>
              </div>
              <div className="flex gap-2">
                <AlertCircle className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                <p>
                  <strong>Confirmed</strong>: Stock is validated and decremented immediately from products table. Reconfirming checks stock limits.
                </p>
              </div>
              <div className="flex gap-2">
                <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0" />
                <p>
                  <strong>Rejected</strong>: Cancels order. If order was previously confirmed, warehouse stock is returned automatically.
                </p>
              </div>
              <div className="flex gap-2">
                <AlertCircle className="h-4 w-4 text-blue-400 flex-shrink-0" />
                <p>
                  <strong>Fulfilled</strong>: Signifies delivery. Stock remains decremented. Order is locked.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
