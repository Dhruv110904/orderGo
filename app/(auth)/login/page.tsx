"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, Mail, ShieldAlert, ArrowLeft, Package, ShoppingCart, BarChart3, Shield } from "lucide-react";
import Link from "next/link";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const features = [
  { icon: Package, label: "Product Catalog", desc: "Browse & manage inventory in real-time" },
  { icon: ShoppingCart, label: "Order Management", desc: "Place and track orders end-to-end" },
  { icon: BarChart3, label: "Admin Dashboard", desc: "Full control over stock & fulfillment" },
  { icon: Shield, label: "Role-Based Access", desc: "Secure portals for users & admins" },
];

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        email: data.email.toLowerCase().trim(),
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Invalid credentials", {
          description: "Please check your email and password and try again.",
        });
      } else {
        toast.success("Welcome back!", {
          description: "Signing you into your dashboard...",
        });
        const session = await getSession();
        const role = session?.user?.role;
        router.push(role === "admin" ? "/admin/dashboard" : "/user/dashboard");
      }
    } catch (error) {
      console.error("Login submission error:", error);
      toast.error("An error occurred during login. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* ─── Back arrow (fixed, top-left) ─── */}
      <Link
        href="/"
        className="fixed top-5 left-5 z-50 flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors group"
      >
        <div className="h-9 w-9 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center group-hover:bg-slate-700 transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </div>
        <span className="text-xs font-medium hidden sm:inline">Back to Home</span>
      </Link>

      {/* ─── Left panel: branding & feature list (hidden on mobile) ─── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12 bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900">
        {/* Glow orbs */}
        <div className="absolute top-0 left-0 w-80 h-80 bg-indigo-600 rounded-full filter blur-3xl opacity-15 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-500 rounded-full filter blur-3xl opacity-10 translate-x-1/3 translate-y-1/3 pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <span className="text-white font-bold text-lg">aG</span>
          </div>
          <span className="text-white font-bold text-xl tracking-tight">orderGo</span>
        </div>

        {/* Headline */}
        <div className="relative z-10 space-y-6">
          <div>
            <h1 className="text-4xl font-extrabold text-white leading-tight">
              Streamline your<br />
              <span className="bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
                entire supply chain
              </span>
            </h1>
            <p className="mt-4 text-slate-400 text-sm leading-relaxed max-w-xs">
              A modern inventory and order management platform built for teams that move fast.
            </p>
          </div>

          {/* Feature grid */}
          <div className="grid grid-cols-1 gap-3">
            {features.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-center gap-4 p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 backdrop-blur-sm">
                <div className="h-9 w-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-4 w-4 text-indigo-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">{label}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Demo credentials */}
        <div className="relative z-10 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Demo Credentials</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="space-y-0.5">
              <p className="text-slate-400 font-semibold">Admin</p>
              <p className="font-mono text-slate-300 text-[11px]">admin@aasa.com</p>
              <p className="font-mono text-slate-400 text-[11px]">Admin@123</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-slate-400 font-semibold">User</p>
              <p className="font-mono text-slate-300 text-[11px]">user@aasa.com</p>
              <p className="font-mono text-slate-400 text-[11px]">User@123</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Right panel: login form ─── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 relative overflow-hidden">
        {/* Subtle glow behind the card */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600 rounded-full filter blur-3xl opacity-5 pointer-events-none" />

        <div className="w-full max-w-sm relative z-10">
          {/* Mobile logo */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-3">
              <span className="text-white font-bold text-xl">aG</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">orderGo</h2>
            <p className="text-slate-400 text-xs mt-1">Inventory & Order Management</p>
          </div>

          {/* Card heading */}
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Sign in</h2>
            <p className="text-slate-400 text-sm mt-1">Access your workspace to continue</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm text-slate-300 font-medium">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                <Input
                  id="email"
                  placeholder="name@aasa.com"
                  type="email"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect="off"
                  disabled={isLoading}
                  className="pl-10 h-11 bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg"
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                  <ShieldAlert className="h-3 w-3" />
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm text-slate-300 font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  disabled={isLoading}
                  className="pl-10 h-11 bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg"
                  {...register("password")}
                />
              </div>
              {errors.password && (
                <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                  <ShieldAlert className="h-3 w-3" />
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-semibold shadow-lg shadow-indigo-600/20 transition-all duration-200 rounded-lg text-sm mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                "Sign In →"
              )}
            </Button>
          </form>

          {/* Mobile demo credentials */}
          <div className="lg:hidden mt-8 p-4 rounded-xl bg-slate-900 border border-slate-800">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Demo Credentials</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="space-y-0.5">
                <p className="text-slate-400 font-semibold">Admin</p>
                <p className="font-mono text-slate-300 text-[11px]">admin@aasa.com</p>
                <p className="font-mono text-slate-400 text-[11px]">Admin@123</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-slate-400 font-semibold">User</p>
                <p className="font-mono text-slate-300 text-[11px]">user@aasa.com</p>
                <p className="font-mono text-slate-400 text-[11px]">User@123</p>
              </div>
            </div>
          </div>

          <p className="text-center text-[11px] text-slate-600 mt-6">
            orderGo · Inventory & Order Management System
          </p>
        </div>
      </div>
    </div>
  );
}
