"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { LogOut, Menu, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LinkItem {
  name: string;
  href: string;
  icon: any;
}

interface AdminNavClientProps {
  links: LinkItem[];
  user: {
    name?: string | null;
    email?: string | null;
    role: string;
  };
  isMobileHeader?: boolean;
}

export default function AdminNavClient({ links, user, isMobileHeader = false }: AdminNavClientProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  const navLinks = (
    <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
        return (
          <Link
            key={link.name}
            href={link.href}
            onClick={() => setIsOpen(false)}
            className={cn(
              "flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group",
              isActive
                ? "bg-gradient-to-r from-indigo-900/40 to-indigo-950/20 text-indigo-400 border-l-2 border-indigo-500 pl-3.5"
                : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
            )}
          >
            <Icon
              className={cn(
                "mr-3 h-4.5 w-4.5 transition-colors",
                isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"
              )}
            />
            {link.name}
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
          <p className="text-xs font-semibold text-white truncate">{user.name || "Admin"}</p>
          <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
        </div>
      </div>
      <Button
        variant="ghost"
        onClick={handleLogout}
        className="w-full justify-start text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 border border-rose-900/30 rounded-lg py-2"
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
          className="text-slate-400 hover:text-white"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
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
