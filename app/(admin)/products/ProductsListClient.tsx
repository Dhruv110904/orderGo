"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, fromBaseUnit, getCompatibleUnits, pricePerOrderedUnit } from "@/lib/units";
import { Plus, Search, Edit2, Trash2, Power, PowerOff, FilterX, Loader2 } from "lucide-react";

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
  createdAt: Date | null;
  updatedAt: Date | null;
}

interface ProductsListClientProps {
  initialProducts: Product[];
  categories: string[];
}

export default function ProductsListClient({ initialProducts, categories }: ProductsListClientProps) {
  const router = useRouter();
  const [productsList, setProductsList] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [unitFilter, setUnitFilter] = useState("all");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter products locally for instant response
  const filteredProducts = productsList.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.sku.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      categoryFilter === "all" || product.category === categoryFilter;

    const matchesUnit =
      unitFilter === "all" || product.baseUnit === unitFilter;

    return matchesSearch && matchesCategory && matchesUnit;
  });

  const handleToggleActive = async (product: Product) => {
    setTogglingId(product.id);
    const newActiveState = !product.isActive;
    
    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...product,
          isActive: newActiveState,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to update product status.");
      } else {
        setProductsList((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, isActive: newActiveState } : p))
        );
        toast.success(`Product "${product.name}" is now ${newActiveState ? "active" : "inactive"}.`);
      }
    } catch (error) {
      console.error("Toggle active failed:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete product "${name}"?`)) {
      return;
    }

    setDeletingId(id);
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to delete product.", {
          description: data.details,
          duration: 6000,
        });
      } else {
        setProductsList((prev) => prev.filter((p) => p.id !== id));
        toast.success(`Product "${name}" deleted successfully.`);
      }
    } catch (error) {
      console.error("Delete product failed:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setCategoryFilter("all");
    setUnitFilter("all");
  };

  // Helper to render nice stock description
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

  // Helper to render pricing display
  const renderPriceInfo = (priceStr: string, baseUnit: string) => {
    const price = parseFloat(priceStr);
    const compatible = getCompatibleUnits(baseUnit);
    
    return (
      <div className="text-xs space-y-0.5">
        <div>{formatCurrency(price)} / {baseUnit}</div>
        {compatible.includes("kg") && (
          <div className="text-slate-400">({formatCurrency(pricePerOrderedUnit(price, "kg"))} / kg)</div>
        )}
        {compatible.includes("L") && (
          <div className="text-slate-400">({formatCurrency(pricePerOrderedUnit(price, "L"))} / L)</div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Product Catalog</h1>
          <p className="text-slate-400 text-sm mt-1">Manage and track your products, stock levels, and prices.</p>
        </div>
        <Link href="/admin/products/new">
          <Button className="bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white shadow-lg shadow-indigo-600/10">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 bg-slate-900/40 p-4 rounded-xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-slate-950/60 border-slate-850 text-slate-200 placeholder:text-slate-600 focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap sm:flex-nowrap gap-3">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-48 bg-slate-950/60 border-slate-850 text-slate-300">
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
            <SelectTrigger className="w-full sm:w-40 bg-slate-950/60 border-slate-850 text-slate-300">
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
            <Button variant="ghost" onClick={resetFilters} className="text-slate-400 hover:text-white hover:bg-slate-800/50">
              <FilterX className="mr-2 h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Products Table */}
      <div className="border border-slate-800 bg-slate-900/20 rounded-xl overflow-hidden shadow-xl">
        <Table>
          <TableHeader className="bg-slate-900/60 border-b border-slate-800 text-slate-400">
            <TableRow className="border-b border-slate-850 hover:bg-transparent">
              <TableHead className="w-1/4">Product Name</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Available Stock</TableHead>
              <TableHead>Base Pricing (INR)</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <TableRow key={product.id} className="border-b border-slate-850/80 hover:bg-slate-900/20 text-slate-300 transition-colors">
                  <TableCell className="font-semibold text-white">
                    <div className="flex flex-col">
                      <span>{product.name}</span>
                      <span className="text-[10px] text-slate-500 font-normal mt-0.5 line-clamp-1">{product.description || "No description provided."}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{product.sku}</TableCell>
                  <TableCell>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-850 border border-slate-800 text-slate-300">
                      {product.category || "General"}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium text-slate-200">
                    {renderStock(product.stockQuantity, product.baseUnit)}
                  </TableCell>
                  <TableCell>
                    {renderPriceInfo(product.basePricePerUnit, product.baseUnit)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(product)}
                      disabled={togglingId === product.id}
                      className={`mx-auto rounded-full w-24 flex items-center justify-center gap-1.5 border py-0.5 ${
                        product.isActive
                          ? "bg-emerald-950/40 text-emerald-400 border-emerald-900/50 hover:bg-emerald-950/60"
                          : "bg-slate-950/60 text-slate-500 border-slate-900 hover:bg-slate-900/40"
                      }`}
                    >
                      {togglingId === product.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : product.isActive ? (
                        <>
                          <Power className="h-3 w-3" />
                          Active
                        </>
                      ) : (
                        <>
                          <PowerOff className="h-3 w-3" />
                          Inactive
                        </>
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/products/${product.id}/edit`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-400 hover:bg-indigo-950/20">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(product.id, product.name)}
                        disabled={deletingId === product.id}
                        className="h-8 w-8 text-slate-400 hover:text-rose-400 hover:bg-rose-950/20"
                      >
                        {deletingId === product.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-rose-400" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
