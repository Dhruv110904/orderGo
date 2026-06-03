"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, User, Mail, Lock, Shield, ShieldAlert, ArrowLeft } from "lucide-react";
import Link from "next/link";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["admin", "seller"]),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterFormClient() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "seller",
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const resData = await response.json();

      if (!response.ok) {
        toast.error(resData.error || "Failed to create user account.");
      } else {
        toast.success("Account created successfully!", {
          description: `User "${data.name}" has been registered as a ${data.role}.`,
        });
        reset(); // Clear form
        router.refresh();
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12 sm:px-6 lg:px-8 overflow-hidden">
      {/* Decorative premium background elements */}
      <div className="absolute top-0 -right-4 w-96 h-96 bg-indigo-500 rounded-full filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute -bottom-10 right-4 w-96 h-96 bg-emerald-500 rounded-full filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>

      <div className="w-full max-w-md z-10">
        <div className="mb-4">
          <Link
            href="/admin/users"
            className="inline-flex items-center text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
          >
            <ArrowLeft className="mr-1 h-3.5 w-3.5" />
            Back to Users Management
          </Link>
        </div>

        <div className="flex flex-col items-center justify-center mb-6">
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Create User Account</h2>
          <p className="text-slate-400 text-sm mt-1">Register a new Admin or Seller</p>
        </div>

        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-md shadow-2xl text-slate-100">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white">Account Details</CardTitle>
            <CardDescription className="text-slate-400">
              Only system administrators can register new user profiles.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-300">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-500" />
                  <Input
                    id="name"
                    placeholder="John Doe"
                    disabled={isLoading}
                    className="pl-10 bg-slate-950/60 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-indigo-500 focus:ring-indigo-500"
                    {...register("name")}
                  />
                </div>
                {errors.name && (
                  <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                    <ShieldAlert className="h-3 w-3" />
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-500" />
                  <Input
                    id="email"
                    placeholder="user@aasa.com"
                    type="email"
                    autoCapitalize="none"
                    autoComplete="email"
                    disabled={isLoading}
                    className="pl-10 bg-slate-950/60 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-indigo-500 focus:ring-indigo-500"
                    {...register("email")}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                    <ShieldAlert className="h-3 w-3" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-500" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Min 6 characters"
                    disabled={isLoading}
                    className="pl-10 bg-slate-950/60 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-indigo-500 focus:ring-indigo-500"
                    {...register("password")}
                  />
                </div>
                {errors.password && (
                  <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                    <ShieldAlert className="h-3 w-3" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" className="text-slate-300">System Role</Label>
                <div className="relative">
                  <Shield className="absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-500 z-10" />
                  <Select
                    onValueChange={(val) => setValue("role", val as "admin" | "seller")}
                    defaultValue="seller"
                    disabled={isLoading}
                  >
                    <SelectTrigger className="pl-10 bg-slate-950/60 border-slate-800 text-slate-100 focus:border-indigo-500 focus:ring-indigo-500">
                      <SelectValue placeholder="Select user role" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                      <SelectItem value="seller">Seller (Order Placement & Catalog)</SelectItem>
                      <SelectItem value="admin">Administrator (Full Control)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {errors.role && (
                  <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                    <ShieldAlert className="h-3 w-3" />
                    {errors.role.message}
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-medium shadow-lg shadow-indigo-600/20 py-2.5 transition-all duration-200"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registering Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
