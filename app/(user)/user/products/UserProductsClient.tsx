"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { formatCurrency, fromBaseUnit, getCompatibleUnits, pricePerOrderedUnit } from "@/lib/units";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ShoppingCart, FilterX } from "lucide-react";

interface Product {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  category: string | null;
  baseUnit: string;
  basePricePerUnit: string;
  stockQuantity: string;
  isActive: boolean | null;
}

interface UserProductsClientProps {
  initialProducts: Product[];
  categories: string[];
}

export default function UserProductsClient({ initialProducts, categories }: UserProductsClientProps) {
  const { addItem } = useCart();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [unitFilter, setUnitFilter] = useState("all");

  // Keep track of unit and quantity selections per product card
  // Key: product ID
  const [selections, setSelections] = useState<
    Record<string, { unit: string; quantity: string }>
  >({});

  const filteredProducts = initialProducts.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.sku.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      categoryFilter === "all" || product.category === categoryFilter;

    const matchesUnit =
      unitFilter === "all" || product.baseUnit === unitFilter;

    return matchesSearch && matchesCategory && matchesUnit;
  });

  const getSelection = (productId: string, defaultUnit: string) => {
    return selections[productId] || { unit: defaultUnit, quantity: "1" };
  };

  const handleUnitChange = (productId: string, unit: string) => {
    setSelections((prev) => ({
      ...prev,
      [productId]: {
        ...getSelection(productId, unit),
        unit,
      },
    }));
  };

  const handleQuantityChange = (productId: string, quantity: string) => {
    setSelections((prev) => ({
      ...prev,
      [productId]: {
        ...getSelection(productId, "g"), // fallback unit will be overwritten if exists
        quantity,
      },
    }));
  };

  const handleAddToCart = (product: Product) => {
    const defaultUnit = getCompatibleUnits(product.baseUnit)[1] || product.baseUnit; // prefer kg/L if available
    const selection = getSelection(product.id, defaultUnit);
    const qty = parseFloat(selection.quantity);

    if (isNaN(qty) || qty <= 0) {
      toast.error("Please enter a valid positive quantity.");
      return;
    }

    const basePrice = parseFloat(product.basePricePerUnit);

    addItem({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      category: product.category,
      baseUnit: product.baseUnit,
      basePricePerUnit: basePrice,
      orderedUnit: selection.unit,
      orderedQuantity: qty,
    });

    toast.success(`Added ${qty} ${selection.unit} of "${product.name}" to cart.`);
  };

  // Render nicely formatted stock
  const renderStock = (qtyStr: string, baseUnit: string) => {
    const qty = parseFloat(qtyStr);
    if (baseUnit === "g") {
      if (qty >= 1000) return `${(qty / 1000).toLocaleString("en-IN", { maximumFractionDigits: 2 })} kg`;
      return `${qty.toLocaleString("en-IN")} g`;
    }
    if (baseUnit === "mL") {
      if (qty >= 1000) return `${(qty / 1000).toLocaleString("en-IN", { maximumFractionDigits: 2 })} L`;
      return `${qty.toLocaleString("en-IN")} mL`;
    }
    return `${qty.toLocaleString("en-IN")} units`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Product Catalog</h1>
        <p className="text-slate-400 text-sm mt-1">Browse active items, pick units, and build your order.</p>
      </div>

      {/* Filter and search bar */}
      <div className="flex flex-col md:flex-row gap-3 bg-slate-900/40 p-4 rounded-xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search by product name, brand or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-slate-950/60 border-slate-850 text-slate-200 placeholder:text-slate-655 focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap sm:flex-nowrap gap-3">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-48 bg-slate-950/60 border-slate-850 text-slate-350">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800 text-slate-300">
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={unitFilter} onValueChange={setUnitFilter}>
            <SelectTrigger className="w-full sm:w-40 bg-slate-950/60 border-slate-850 text-slate-350">
              <SelectValue placeholder="Unit Type" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800 text-slate-300">
              <SelectItem value="all">All Units</SelectItem>
              <SelectItem value="g">Weight (g)</SelectItem>
              <SelectItem value="mL">Volume (mL)</SelectItem>
              <SelectItem value="unit">Count (unit)</SelectItem>
            </SelectContent>
          </Select>

          {(search || categoryFilter !== "all" || unitFilter !== "all") && (
            <Button variant="ghost" onClick={() => {
              setSearch("");
              setCategoryFilter("all");
              setUnitFilter("all");
            }} className="text-slate-400 hover:text-white hover:bg-slate-800/50">
              <FilterX className="mr-2 h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Product Cards Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 text-slate-500 border border-slate-800 rounded-xl bg-slate-900/10">
          No products matched your filters.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => {
            const compatibleUnits = getCompatibleUnits(product.baseUnit);
            // Default to larger units (kg, L) if available for better user display
            const defaultUnit = compatibleUnits[1] || product.baseUnit;
            
            const selection = getSelection(product.id, defaultUnit);
            const unitPrice = pricePerOrderedUnit(parseFloat(product.basePricePerUnit), selection.unit);
            const qtyVal = parseFloat(selection.quantity) || 0;
            const lineTotal = qtyVal * unitPrice;

            return (
              <Card key={product.id} className="border-slate-800 bg-slate-900/40 text-slate-100 flex flex-col justify-between hover:border-slate-700/60 transition-all duration-200 shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-950/40 border border-indigo-900/30 text-indigo-300">
                      {product.category || "General"}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">SKU: {product.sku}</span>
                  </div>
                  <CardTitle className="text-lg font-bold text-white mt-2 leading-snug line-clamp-1">{product.name}</CardTitle>
                  <CardDescription className="text-slate-400 text-xs mt-1 min-h-[32px] line-clamp-2">
                    {product.description || "No description provided."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-0 flex-1">
                  {/* Stock Level */}
                  <div className="flex justify-between items-center text-xs py-1.5 px-3 rounded bg-slate-950/40 border border-slate-850">
                    <span className="text-slate-450">Available Warehouse Stock</span>
                    <span className="font-bold text-slate-200">
                      {renderStock(product.stockQuantity, product.baseUnit)}
                    </span>
                  </div>

                  {/* Pricing and Unit selections */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-450 uppercase font-semibold">Select Unit</label>
                      <Select
                        value={selection.unit}
                        onValueChange={(val) => handleUnitChange(product.id, val)}
                      >
                        <SelectTrigger className="bg-slate-950/60 border-slate-850 text-slate-200 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-800 text-slate-350">
                          {compatibleUnits.map((u) => (
                            <SelectItem key={u} value={u}>
                              {u}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-450 uppercase font-semibold">Quantity</label>
                      <Input
                        type="number"
                        step="any"
                        min="0.000001"
                        value={selection.quantity}
                        onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                        className="bg-slate-950/60 border-slate-850 text-slate-200 h-9"
                      />
                    </div>
                  </div>

                  {/* Cost Calculation Display */}
                  <div className="flex flex-col items-center justify-center p-2.5 rounded bg-indigo-950/15 border border-indigo-900/20 text-xs">
                    <div className="text-indigo-400 font-medium">Live Cost Calculator</div>
                    <div className="text-slate-300 mt-1">
                      {qtyVal} {selection.unit} &times; {formatCurrency(unitPrice)}/{selection.unit}
                    </div>
                    <div className="text-md font-bold text-white mt-0.5">
                      = {formatCurrency(lineTotal)}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t border-slate-800/40 pt-3.5">
                  <Button
                    onClick={() => handleAddToCart(product)}
                    className="w-full bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white gap-2 font-semibold shadow-lg shadow-indigo-600/5 py-2.5 transition-all duration-205"
                  >
                    <ShoppingCart className="h-4.5 w-4.5" />
                    Add to Order Cart
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
