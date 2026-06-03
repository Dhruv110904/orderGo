"use client";

import { useState } from "react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/units";
import { Search, Eye, FilterX } from "lucide-react";
import { cn } from "@/lib/utils";

interface Order {
  id: string;
  status: string;
  totalAmount: string;
  notes: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  sellerName: string | null;
  sellerEmail: string | null;
}

interface OrdersListClientProps {
  initialOrders: Order[];
}

const STATUS_TABS = [
  { value: "all", label: "All Orders" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "rejected", label: "Rejected" },
  { value: "fulfilled", label: "Fulfilled" },
];

export default function OrdersListClient({ initialOrders }: OrdersListClientProps) {
  const [ordersList, setOrdersList] = useState<Order[]>(initialOrders);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const filteredOrders = ordersList.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(search.toLowerCase()) ||
      (order.sellerName || "").toLowerCase().includes(search.toLowerCase()) ||
      (order.sellerEmail || "").toLowerCase().includes(search.toLowerCase());

    const matchesStatus = activeTab === "all" || order.status === activeTab;

    return matchesSearch && matchesStatus;
  });

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
        <h1 className="text-3xl font-bold tracking-tight text-white">Order Management</h1>
        <p className="text-slate-400 text-sm mt-1">Review, approve, reject, or fulfill orders submitted by sellers.</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-slate-800 pb-px">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors duration-155",
              activeTab === tab.value
                ? "border-indigo-500 text-indigo-400 font-semibold"
                : "border-transparent text-slate-450 hover:text-slate-200 hover:border-slate-800"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter and Search */}
      <div className="flex items-center gap-3 bg-slate-900/40 p-4 rounded-xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search by Order ID, Seller Name or Email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-slate-950/60 border-slate-850 text-slate-200 placeholder:text-slate-650 focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        {search && (
          <Button variant="ghost" onClick={() => setSearch("")} className="text-slate-400 hover:text-white hover:bg-slate-800/50">
            <FilterX className="mr-2 h-4 w-4" />
            Clear Search
          </Button>
        )}
      </div>

      {/* Orders Table */}
      <div className="border border-slate-800 bg-slate-900/20 rounded-xl overflow-hidden shadow-xl">
        <Table>
          <TableHeader className="bg-slate-900/60 border-b border-slate-800 text-slate-400">
            <TableRow className="border-b border-slate-850 hover:bg-transparent">
              <TableHead className="w-1/6">Order ID</TableHead>
              <TableHead className="w-1/4">Seller Profile</TableHead>
              <TableHead>Date Placed</TableHead>
              <TableHead>Total (INR)</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                  No orders found.
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.id} className="border-b border-slate-850/80 hover:bg-slate-900/20 text-slate-300 transition-colors">
                  <TableCell className="font-mono text-xs font-semibold text-indigo-400">
                    <Link href={`/admin/orders/${order.id}`} className="hover:underline">
                      #{order.id.slice(0, 8)}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-white">{order.sellerName || "Unknown Seller"}</span>
                      <span className="text-[10px] text-slate-500">{order.sellerEmail}</span>
                    </div>
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
                  <TableCell className="font-bold text-white">
                    {formatCurrency(order.totalAmount)}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase border", getStatusBadgeClass(order.status))}>
                      {order.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/orders/${order.id}`}>
                      <Button variant="ghost" size="sm" className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/20 gap-1.5 py-1">
                        <Eye className="h-4 w-4" />
                        Details
                      </Button>
                    </Link>
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
