"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/units";
import { Loader2, ArrowLeft, Info, HelpCircle } from "lucide-react";
import Link from "next/link";

const productFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  sku: z.string().min(1, "SKU is required").max(100),
  description: z.string().optional().nullable().default(""),
  category: z.string().optional().nullable().default(""),
  baseUnit: z.enum(["g", "mL", "unit"]),
  basePricePerUnit: z.coerce.number().positive("Base price per unit must be positive"),
  stockQuantity: z.coerce.number().nonnegative("Stock quantity cannot be negative"),
  isActive: z.boolean().default(true),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

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

interface ProductFormClientProps {
  initialProduct?: Product;
}

export default function ProductFormClient({ initialProduct }: ProductFormClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const isEditMode = !!initialProduct;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: initialProduct?.name || "",
      sku: initialProduct?.sku || "",
      description: initialProduct?.description || "",
      category: initialProduct?.category || "",
      baseUnit: (initialProduct?.baseUnit as "g" | "mL" | "unit") || "g",
      basePricePerUnit: initialProduct ? parseFloat(initialProduct.basePricePerUnit) : 0.05,
      stockQuantity: initialProduct ? parseFloat(initialProduct.stockQuantity) : 0,
      isActive: initialProduct ? (initialProduct.isActive !== null ? initialProduct.isActive : true) : true,
    },
  });

  const baseUnit = watch("baseUnit");
  const basePricePerUnit = watch("basePricePerUnit");

  const [priceHelperText, setPriceHelperText] = useState("");

  // Live price helper calculation
  useEffect(() => {
    const price = basePricePerUnit || 0;
    if (baseUnit === "g") {
      const perKg = price * 1000;
      setPriceHelperText(`₹${price.toFixed(4)}/g equals ${formatCurrency(perKg)}/kg`);
    } else if (baseUnit === "mL") {
      const perL = price * 1000;
      setPriceHelperText(`₹${price.toFixed(4)}/mL equals ${formatCurrency(perL)}/L`);
    } else {
      setPriceHelperText(`Count unit price equals ${formatCurrency(price)}/unit`);
    }
  }, [baseUnit, basePricePerUnit]);

  const onSubmit = async (data: ProductFormValues) => {
    setIsLoading(true);
    try {
      const url = isEditMode ? `/api/products/${initialProduct.id}` : "/api/products";
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const resData = await response.json();

      if (!response.ok) {
        toast.error(resData.error || `Failed to ${isEditMode ? "update" : "create"} product.`);
      } else {
        toast.success(`Product ${isEditMode ? "updated" : "created"} successfully!`);
        router.push("/admin/products");
        router.refresh();
      }
    } catch (error) {
      console.error("Product submission failed:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/products" className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            {isEditMode ? "Edit Product" : "Add New Product"}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {isEditMode ? "Update details of the existing product." : "Create a new product catalog item."}
          </p>
        </div>
      </div>

      <Card className="border-slate-800 bg-slate-900/40 text-slate-100 shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white">Product details</CardTitle>
          <CardDescription className="text-slate-400">
            Specify the product identifers, dimensions, stock, and pricing.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-300">Product Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Basmati Rice"
                  disabled={isLoading}
                  className="bg-slate-950/60 border-slate-850 text-slate-100 placeholder:text-slate-650 focus:border-indigo-500 focus:ring-indigo-500"
                  {...register("name")}
                />
                {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sku" className="text-slate-300">SKU Code</Label>
                <Input
                  id="sku"
                  placeholder="e.g. RICE-BAS-01"
                  disabled={isLoading}
                  className="bg-slate-950/60 border-slate-850 text-slate-100 placeholder:text-slate-650 focus:border-indigo-500 focus:ring-indigo-500"
                  {...register("sku")}
                />
                {errors.sku && <p className="text-xs text-rose-500 mt-1">{errors.sku.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category" className="text-slate-300">Category</Label>
                <Input
                  id="category"
                  placeholder="e.g. Groceries, Dairy"
                  disabled={isLoading}
                  className="bg-slate-950/60 border-slate-850 text-slate-100 placeholder:text-slate-650 focus:border-indigo-500 focus:ring-indigo-500"
                  {...register("category")}
                />
                {errors.category && <p className="text-xs text-rose-500 mt-1">{errors.category.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="baseUnit" className="text-slate-300">Base Storage Unit</Label>
                <Select
                  onValueChange={(val) => setValue("baseUnit", val as "g" | "mL" | "unit")}
                  defaultValue={watch("baseUnit")}
                  disabled={isLoading}
                >
                  <SelectTrigger className="bg-slate-950/60 border-slate-850 text-slate-100 focus:border-indigo-500 focus:ring-indigo-500">
                    <SelectValue placeholder="Select base unit" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                    <SelectItem value="g">Weight: Grams (g)</SelectItem>
                    <SelectItem value="mL">Volume: Milliliters (mL)</SelectItem>
                    <SelectItem value="unit">Countable: Unit (unit)</SelectItem>
                  </SelectContent>
                </Select>
                {errors.baseUnit && <p className="text-xs text-rose-500 mt-1">{errors.baseUnit.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="basePricePerUnit" className="text-slate-300">
                  Base Price per Unit (INR)
                </Label>
                <Input
                  id="basePricePerUnit"
                  type="number"
                  step="0.000001"
                  disabled={isLoading}
                  className="bg-slate-950/60 border-slate-850 text-slate-100 focus:border-indigo-500 focus:ring-indigo-500"
                  {...register("basePricePerUnit")}
                />
                {errors.basePricePerUnit && (
                  <p className="text-xs text-rose-500 mt-1">{errors.basePricePerUnit.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="stockQuantity" className="text-slate-300">
                  Stock Quantity (in base unit)
                </Label>
                <Input
                  id="stockQuantity"
                  type="number"
                  step="0.000001"
                  disabled={isLoading}
                  className="bg-slate-950/60 border-slate-850 text-slate-100 focus:border-indigo-500 focus:ring-indigo-500"
                  {...register("stockQuantity")}
                />
                {errors.stockQuantity && (
                  <p className="text-xs text-rose-500 mt-1">{errors.stockQuantity.message}</p>
                )}
              </div>
            </div>

            {/* Pricing Conversion Alert Helper */}
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-indigo-950/20 border border-indigo-900/40 text-indigo-300 text-xs">
              <Info className="h-4.5 w-4.5 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="font-semibold text-white">Unit Conversion Helper</p>
                <p>{priceHelperText}</p>
                <p className="text-[10px] text-slate-450 leading-relaxed">
                  Internal storage matches standard units: weights store as Grams (<code className="bg-slate-950 px-1 rounded text-indigo-400">g</code>), volumes as Milliliters (<code className="bg-slate-950 px-1 rounded text-indigo-400">mL</code>), and counts as pieces (<code className="bg-slate-950 px-1 rounded text-indigo-400">unit</code>).
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-slate-300">Description</Label>
              <Textarea
                id="description"
                placeholder="Product description and details..."
                disabled={isLoading}
                rows={3}
                className="bg-slate-950/60 border-slate-850 text-slate-100 placeholder:text-slate-650 focus:border-indigo-500 focus:ring-indigo-500"
                {...register("description")}
              />
              {errors.description && <p className="text-xs text-rose-500 mt-1">{errors.description.message}</p>}
            </div>

            {isEditMode && (
              <div className="flex items-center gap-2 p-1">
                <input
                  type="checkbox"
                  id="isActive"
                  disabled={isLoading}
                  className="h-4 w-4 rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                  {...register("isActive")}
                />
                <Label htmlFor="isActive" className="text-slate-300 text-sm font-normal cursor-pointer select-none">
                  Product is active and visible to sellers
                </Label>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end gap-3 border-t border-slate-800/40 pt-4">
            <Link href="/admin/products">
              <Button type="button" variant="ghost" className="text-slate-400 hover:text-white hover:bg-slate-800/50">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-medium px-6"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditMode ? "Saving Changes..." : "Creating Product..."}
                </>
              ) : isEditMode ? (
                "Save Changes"
              ) : (
                "Create Product"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
