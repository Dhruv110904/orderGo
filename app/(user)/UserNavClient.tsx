"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useCart } from "@/context/CartContext";
import { cn } from "@/lib/utils";
import { LogOut, Menu, X, User, LayoutDashboard, ShoppingBag, ShoppingCart, History } from "lucide-react";
import { Button } from "@/components/ui/button";

const ICON_MAP: Record<string, any> = {
  dashboard: LayoutDashboard,
  catalog: ShoppingBag,
  cart: ShoppingCart,
  orders: History,
};

interface LinkItem {
  name: string;
  href: string;
  icon: string;
  isCart?: boolean;
}

interface UserNavClientProps {
  links: LinkItem[];
  user: {
    name?: string | null;
    email?: string | null;
    role: string;
  };
  isMobileHeader?: boolean;
}

export default function UserNavClient({ links, user, isMobileHeader = false }: UserNavClientProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { itemCount } = useCart();

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  const navLinks = (
    <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
      {links.map((link) => {
        const Icon = ICON_MAP[link.icon] || ShoppingBag;
        const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
        return (
          <Link
            key={link.name}
            href={link.href}
            onClick={() => setIsOpen(false)}
            className={cn(
              "flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group",
              isActive
                ? "bg-gradient-to-r from-indigo-900/40 to-indigo-950/20 text-indigo-400 border-l-2 border-indigo-500 pl-3.5"
                : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
            )}
          >
            <div className="flex items-center">
              <Icon
                className={cn(
                  "mr-3 h-4.5 w-4.5 transition-colors",
                  isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"
                )}
              />
              {link.name}
            </div>
            {link.isCart && itemCount > 0 && (
              <span className="bg-emerald-500 text-slate-950 font-bold text-[10px] px-2 py-0.5 rounded-full flex items-center justify-center animate-pulse">
                {itemCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  const profileWidget = (
    <div className="p-4 border-t border-slate-800 bg-slate-900/40">
      <div className="flex items-center mb-4">
        <div className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 mr-3">
          <User className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-white truncate">{user.name || "User"}</p>
          <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
        </div>
      </div>
      <Button
        variant="ghost"
        onClick={handleLogout}
        className="w-full justify-start text-xs text-rose-450 hover:text-rose-350 hover:bg-rose-950/20 border border-rose-900/30 rounded-lg py-2"
      >
        <LogOut className="mr-2 h-4 w-4" />
        Sign Out
      </Button>
    </div>
  );

  if (isMobileHeader) {
    return (
      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="text-slate-400 hover:text-white flex items-center justify-center relative"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          {itemCount > 0 && !isOpen && (
            <span className="absolute -top-1 -right-1 bg-emerald-500 w-2.5 h-2.5 rounded-full"></span>
          )}
        </Button>

        {isOpen && (
          <div className="absolute right-0 top-10 mt-2 w-64 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl z-30 flex flex-col">
            {navLinks}
            {profileWidget}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col justify-between min-h-0 bg-slate-900">
      {navLinks}
      {profileWidget}
    </div>
  );
}
