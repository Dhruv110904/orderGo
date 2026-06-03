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
import { Trash2, ShoppingCart, Loader2, ArrowRight, MessageSquare, ClipboardCheck, ArrowLeft, MapPin, Banknote, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function UserCartPage() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, updateUnit, clearCart, cartTotal } = useCart();
  const [notes, setNotes] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [addressError, setAddressError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);

  const handleSubmitOrder = async () => {
    if (items.length === 0) return;

    // Validate address
    if (!deliveryAddress.trim() || deliveryAddress.trim().length < 10) {
      setAddressError("Please enter a valid delivery address (at least 10 characters).");
      return;
    }
    setAddressError("");

    setIsSubmitting(true);
    try {
      const payload = {
        notes,
        deliveryAddress: deliveryAddress.trim(),
        paymentMethod: "cod",
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
        setDeliveryAddress("");
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
            <div className="h-16 w-16 bg-emerald-500/10 border border-emerald-500/25 rounded-full flex items-center justify-center text-emerald-400 mb-2">
              <ClipboardCheck className="h-8 w-8" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">Order Confirmed!</CardTitle>
            <CardDescription className="text-slate-400">
              Your request was registered successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-300 leading-relaxed">
              Order ID: <code className="bg-slate-950 px-2 py-1 rounded text-emerald-400 text-xs font-mono">{placedOrderId}</code>
            </p>
            <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
              <Banknote className="h-4 w-4 flex-shrink-0" />
              <span>Payment: <strong>Cash on Delivery</strong> — pay when your order arrives.</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
              Status is <span className="text-amber-400 font-semibold uppercase">Pending</span>. The administrator will verify stock and confirm shortly.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center border-t border-slate-800/40 pt-6">
            <Link href="/user/orders" className="w-full sm:w-auto">
              <Button variant="ghost" className="w-full text-slate-400 hover:text-white hover:bg-slate-800/50">
                View Order History
              </Button>
            </Link>
            <Link href="/user/products" className="w-full sm:w-auto">
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
        <p className="text-slate-400 text-sm mt-1">Review your selected items, add your delivery address, and place your order.</p>
      </div>

      {items.length === 0 ? (
        <Card className="border-slate-800 bg-slate-900/20 text-slate-100 p-8 text-center">
          <CardHeader className="flex flex-col items-center justify-center space-y-3">
            <ShoppingCart className="h-12 w-12 text-slate-600" />
            <CardTitle className="text-lg text-slate-400">Your Cart is Empty</CardTitle>
            <CardDescription className="text-slate-500 max-w-xs mx-auto">
              Head to the Product Catalog to pick products and add them to your cart.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center mt-4">
            <Link href="/user/products">
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
                <TableHeader className="bg-slate-950/40 border-b border-slate-800 text-slate-400">
                  <TableRow className="border-b border-slate-800 hover:bg-transparent">
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
                    <TableRow key={item.productId} className="border-b border-slate-800/80 hover:bg-slate-900/10 text-slate-300">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-white">{item.name}</span>
                          <span className="text-[10px] text-slate-500">SKU: {item.sku}</span>
                        </div>
                      </TableCell>
                      <TableCell className="w-32">
                        <Input
                          type="number"
                          step="any"
                          min="0.000001"
                          value={item.orderedQuantity}
                          onChange={(e) => updateQuantity(item.productId, parseFloat(e.target.value) || 0)}
                          className="bg-slate-950/60 border-slate-800 text-slate-200 h-8"
                        />
                      </TableCell>
                      <TableCell className="w-24">
                        <Select
                          value={item.orderedUnit}
                          onValueChange={(val) => updateUnit(item.productId, val)}
                        >
                          <SelectTrigger className="bg-slate-950/60 border-slate-800 text-slate-200 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-slate-800 text-slate-300">
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

          {/* Right panel: Summary + Delivery + Checkout */}
          <div className="space-y-4">
            {/* Payment Method — COD Badge */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <Banknote className="h-5 w-5 text-amber-400 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-amber-300 uppercase tracking-wide">Payment Method</p>
                <p className="text-sm font-semibold text-white mt-0.5">Cash on Delivery (COD)</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Pay when your order is delivered to your address.</p>
              </div>
            </div>

            {/* Order Summary Card */}
            <Card className="border-slate-800 bg-slate-900/40 text-slate-100 shadow-xl">
              <CardHeader className="border-b border-slate-800 pb-3">
                <CardTitle className="text-lg font-semibold text-white">Order Summary</CardTitle>
                <CardDescription className="text-slate-400">Review total and fill in delivery details.</CardDescription>
              </CardHeader>
              <CardContent className="pt-5 space-y-5">
                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Subtotal</span>
                    <span className="font-semibold text-slate-200">{formatCurrency(cartTotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-b border-slate-800 pb-3">
                    <span className="text-slate-400">Tax / Commission</span>
                    <span className="font-semibold text-emerald-400">₹0.00 (Free)</span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-sm font-semibold text-white">Estimated Total:</span>
                    <span className="text-xl font-bold text-emerald-400">{formatCurrency(cartTotal)}</span>
                  </div>
                </div>

                {/* Delivery Address */}
                <div className="space-y-2 border-t border-slate-800 pt-4">
                  <Label htmlFor="deliveryAddress" className="text-xs text-slate-400 flex items-center gap-1.5 font-semibold uppercase">
                    <MapPin className="h-3.5 w-3.5 text-indigo-400" />
                    Delivery Address <span className="text-rose-400">*</span>
                  </Label>
                  <Textarea
                    id="deliveryAddress"
                    placeholder="e.g. 12, MG Road, Koramangala, Bangalore, Karnataka - 560034"
                    value={deliveryAddress}
                    onChange={(e) => {
                      setDeliveryAddress(e.target.value);
                      if (e.target.value.trim().length >= 10) setAddressError("");
                    }}
                    rows={3}
                    className={`bg-slate-950/60 border-slate-800 text-slate-200 placeholder:text-slate-600 focus:border-indigo-500 focus:ring-indigo-500 text-xs leading-relaxed resize-none ${addressError ? "border-rose-500" : ""}`}
                  />
                  {addressError && (
                    <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3" />
                      {addressError}
                    </p>
                  )}
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-xs text-slate-400 flex items-center gap-1.5 font-semibold uppercase">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Special Instructions (Optional)
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder="Any delivery notes, preferred time, or special requests..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="bg-slate-950/60 border-slate-800 text-slate-200 placeholder:text-slate-600 focus:border-indigo-500 focus:ring-indigo-500 text-xs leading-relaxed resize-none"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3 border-t border-slate-800 pt-4">
                <Button
                  onClick={handleSubmitOrder}
                  disabled={isSubmitting || items.length === 0}
                  className="w-full bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-bold py-3 transition-all duration-200 shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Placing Order...
                    </>
                  ) : (
                    <>
                      Place Order (COD)
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  onClick={clearCart}
                  disabled={isSubmitting}
                  className="w-full text-slate-500 hover:text-slate-300 hover:bg-slate-800/40 text-xs py-2"
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
