"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { formatCurrency, getCompatibleUnits, pricePerOrderedUnit } from "@/lib/units";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, ShoppingCart, Loader2, ArrowRight, MessageSquare, ClipboardCheck, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SellerCartPage() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, updateUnit, clearCart, cartTotal } = useCart();
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);

  const handleSubmitOrder = async () => {
    if (items.length === 0) return;

    setIsSubmitting(true);
    try {
      const payload = {
        notes,
        items: items.map((item) => ({
          productId: item.productId,
          orderedUnit: item.orderedUnit,
          orderedQuantity: item.orderedQuantity,
        })),
      };

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to place order.");
      } else {
        toast.success("Order Placed Successfully!", {
          description: `Your order #${data.id.slice(0, 8)} is pending admin confirmation.`,
        });
        setPlacedOrderId(data.id);
        clearCart();
        setNotes("");
      }
    } catch (error) {
      console.error("Order submission error:", error);
      toast.error("An error occurred while submitting your order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // If order was successfully placed, render a confirmation screen!
  if (placedOrderId) {
    return (
      <div className="max-w-xl mx-auto py-12 text-slate-100 space-y-6">
        <Card className="border-emerald-500/25 bg-slate-900/40 text-slate-100 shadow-2xl text-center p-6">
          <CardHeader className="flex flex-col items-center justify-center space-y-2">
            <div className="h-16 w-16 bg-emerald-500/10 border border-emerald-500/25 rounded-full flex items-center justify-center text-emerald-450 mb-2">
              <ClipboardCheck className="h-8 w-8" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">Order Confirmed</CardTitle>
            <CardDescription className="text-slate-400">
              Your request was registered successfully!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-350 leading-relaxed">
              Order ID: <code className="bg-slate-950 px-2 py-1 rounded text-emerald-450 text-xs font-mono">{placedOrderId}</code>
            </p>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
              The order status is set to <span className="text-amber-400 font-semibold uppercase">Pending</span>. The administrator will check stock quantities and confirm or contact you shortly.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center border-t border-slate-800/40 pt-6">
            <Link href="/seller/orders" className="w-full sm:w-auto">
              <Button variant="ghost" className="w-full text-slate-400 hover:text-white hover:bg-slate-800/50">
                View Order History
              </Button>
            </Link>
            <Link href="/seller/products" className="w-full sm:w-auto">
              <Button className="w-full bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-medium">
                Continue Shopping
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Shopping Cart</h1>
        <p className="text-slate-400 text-sm mt-1">Review your selected items, set custom quantities, and check out.</p>
      </div>

      {items.length === 0 ? (
        <Card className="border-slate-800 bg-slate-900/20 text-slate-100 p-8 text-center">
          <CardHeader className="flex flex-col items-center justify-center space-y-3">
            <ShoppingCart className="h-12 w-12 text-slate-655" />
            <CardTitle className="text-lg text-slate-400">Your Cart is Empty</CardTitle>
            <CardDescription className="text-slate-500 max-w-xs mx-auto">
              Head to the Product Catalog to pick products and add them to your cart.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center mt-4">
            <Link href="/seller/products">
              <Button className="bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white gap-2 font-medium">
                <ArrowLeft className="h-4 w-4" />
                Go to Catalog
              </Button>
            </Link>
          </CardFooter>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left panel: Cart items list */}
          <Card className="border-slate-800 bg-slate-900/40 text-slate-100 lg:col-span-2 shadow-xl overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-950/40 border-b border-slate-850 text-slate-400">
                  <TableRow className="border-b border-slate-850 hover:bg-transparent">
                    <TableHead>Product</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.productId} className="border-b border-slate-850/80 hover:bg-slate-900/10 text-slate-300">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-white">{item.name}</span>
                          <span className="text-[10px] text-slate-550">SKU: {item.sku}</span>
                        </div>
                      </TableCell>
                      <TableCell className="w-32">
                        <Input
                          type="number"
                          step="any"
                          min="0.000001"
                          value={item.orderedQuantity}
                          onChange={(e) => updateQuantity(item.productId, parseFloat(e.target.value) || 0)}
                          className="bg-slate-950/60 border-slate-850 text-slate-200 h-8"
                        />
                      </TableCell>
                      <TableCell className="w-24">
                        <Select
                          value={item.orderedUnit}
                          onValueChange={(val) => updateUnit(item.productId, val)}
                        >
                          <SelectTrigger className="bg-slate-950/60 border-slate-850 text-slate-200 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-slate-800 text-slate-350">
                            {getCompatibleUnits(item.baseUnit).map((u) => (
                              <SelectItem key={u} value={u}>
                                {u}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatCurrency(pricePerOrderedUnit(item.basePricePerUnit, item.orderedUnit))} / {item.orderedUnit}
                      </TableCell>
                      <TableCell className="text-right font-bold text-white">
                        {formatCurrency(item.lineTotal)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.productId)}
                          className="h-8 w-8 text-slate-500 hover:text-rose-400 hover:bg-rose-950/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Right panel: Summary checkout */}
          <div className="space-y-6">
            <Card className="border-slate-800 bg-slate-900/40 text-slate-100 shadow-xl">
              <CardHeader className="border-b border-slate-850">
                <CardTitle className="text-lg font-semibold text-white">Order Summary</CardTitle>
                <CardDescription className="text-slate-400">Review total cost and add order notes.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-450">Subtotal</span>
                  <span className="font-semibold text-slate-200">{formatCurrency(cartTotal)}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b border-slate-850 pb-4">
                  <span className="text-slate-450">Tax / Commission</span>
                  <span className="font-semibold text-emerald-450">₹0.00 (Free)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-white">Estimated Total:</span>
                  <span className="text-xl font-bold text-emerald-400">{formatCurrency(cartTotal)}</span>
                </div>

                <div className="space-y-2 border-t border-slate-850 pt-4">
                  <Label htmlFor="notes" className="text-xs text-slate-450 flex items-center gap-1 font-semibold uppercase">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Special Instructions / Notes
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder="Enter order guidelines, shipping notes, or questions..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    className="bg-slate-950/60 border-slate-850 text-slate-200 placeholder:text-slate-655 focus:border-indigo-500 focus:ring-indigo-500 text-xs leading-relaxed"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button
                  onClick={handleSubmitOrder}
                  disabled={isSubmitting || items.length === 0}
                  className="w-full bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-bold py-3 transition-all duration-200 shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4.5 w-4.5 animate-spin" />
                      Submitting Order...
                    </>
                  ) : (
                    <>
                      Place Order
                      <ArrowRight className="h-4.5 w-4.5" />
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  onClick={clearCart}
                  disabled={isSubmitting}
                  className="w-full text-slate-500 hover:text-slate-350 hover:bg-slate-800/40 text-xs py-2"
                >
                  Clear Cart
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
