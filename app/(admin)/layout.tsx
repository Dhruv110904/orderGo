import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import AdminNavClient from "./AdminNavClient";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Guard: Ensure user is logged in and has the admin role
  if (!session || session.user.role !== "admin") {
    redirect("/login");
  }

  const links = [
    { name: "Dashboard", href: "/admin/dashboard", icon: "dashboard" },
    { name: "Products", href: "/admin/products", icon: "products" },
    { name: "Orders", href: "/admin/orders", icon: "orders" },
    { name: "Sellers", href: "/admin/users", icon: "users" },
  ];

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800">
        {/* Sidebar Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950/40">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-500/10 mr-3">
            <span className="text-white font-extrabold text-sm">aG</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white leading-none">orderGo</h1>
            <span className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">Admin Panel</span>
          </div>
        </div>

        {/* Sidebar Links */}
        <AdminNavClient links={links} user={session.user} />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 z-20">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-emerald-500 flex items-center justify-center mr-2">
              <span className="text-white font-extrabold text-sm">aG</span>
            </div>
            <h1 className="text-md font-bold text-white">orderGo</h1>
            <span className="ml-2 px-1.5 py-0.5 rounded text-[8px] bg-indigo-900/60 border border-indigo-700/50 text-indigo-200 uppercase font-semibold">Admin</span>
          </div>
          {/* Mobile menu trigger is handled in client nav */}
          <AdminNavClient links={links} user={session.user} isMobileHeader={true} />
        </header>

        {/* Dynamic page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
