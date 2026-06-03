import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { CartProvider } from "@/context/CartContext";
import { LayoutDashboard, ShoppingBag, ShoppingCart, History, LogOut } from "lucide-react";
import SellerNavClient from "./SellerNavClient";

export default async function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Guard: Ensure user is logged in and has the seller role
  if (!session || session.user.role !== "seller") {
    redirect("/login");
  }

  const links = [
    { name: "Dashboard", href: "/seller/dashboard", icon: LayoutDashboard },
    { name: "Product Catalog", href: "/seller/products", icon: ShoppingBag },
    { name: "Shopping Cart", href: "/seller/cart", icon: ShoppingCart, isCart: true },
    { name: "Order History", href: "/seller/orders", icon: History },
  ];

  return (
    <CartProvider>
      <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800">
          {/* Sidebar Header */}
          <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950/40">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-500/10 mr-3">
              <span className="text-white font-extrabold text-sm">oG</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-none">orderGo</h1>
              <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">Seller Portal</span>
            </div>
          </div>

          {/* Sidebar Links */}
          <SellerNavClient links={links} user={session.user} />
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile Header */}
          <header className="md:hidden h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 z-20">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-emerald-500 flex items-center justify-center mr-2">
                <span className="text-white font-extrabold text-sm">oG</span>
              </div>
              <h1 className="text-md font-bold text-white">orderGo</h1>
              <span className="ml-2 px-1.5 py-0.5 rounded text-[8px] bg-emerald-900/60 border border-emerald-700/50 text-emerald-200 uppercase font-semibold">Seller</span>
            </div>
            <SellerNavClient links={links} user={session.user} isMobileHeader={true} />
          </header>

          {/* Dynamic page content */}
          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          </main>
        </div>
      </div>
    </CartProvider>
  );
}
