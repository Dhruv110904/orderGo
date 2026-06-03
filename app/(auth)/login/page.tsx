"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, Mail, ShieldAlert } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
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
        
        // Let middleware or route control handle redirect by refreshing/navigating
        router.refresh();
        router.push("/");
      }
    } catch (error) {
      console.error("Login submission error:", error);
      toast.error("An error occurred during login. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12 sm:px-6 lg:px-8 overflow-hidden">
      {/* Decorative premium background elements */}
      <div className="absolute top-0 -left-4 w-96 h-96 bg-indigo-500 rounded-full filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute -bottom-10 right-4 w-96 h-96 bg-emerald-500 rounded-full filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
      
      <div className="w-full max-w-md z-10">
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-3">
            <span className="text-white font-bold text-xl tracking-wider">aG</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">orderGo</h2>
          <p className="text-slate-400 text-sm mt-1">Inventory & Order Management System</p>
        </div>

        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-md shadow-2xl text-slate-100">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight text-white">Sign In</CardTitle>
            <CardDescription className="text-slate-400">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-500" />
                  <Input
                    id="email"
                    placeholder="name@aasa.com"
                    type="email"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect="off"
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
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-medium shadow-lg shadow-indigo-600/20 py-2.5 transition-all duration-200"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>

              <div className="text-center w-full border-t border-slate-800/80 pt-4">
                <p className="text-xs text-slate-500">
                  Demo Credentials:<br />
                  Admin: <code className="text-slate-300">admin@aasa.com</code> / <code className="text-slate-300">Admin@123</code><br />
                  Seller: <code className="text-slate-300">seller@aasa.com</code> / <code className="text-slate-300">Seller@123</code>
                </p>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
