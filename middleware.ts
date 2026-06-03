import NextAuth from "next-auth";
import authConfig from "./auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  const isAdminRoute = nextUrl.pathname.startsWith("/admin");
  const isSellerRoute = nextUrl.pathname.startsWith("/seller");
  const isAuthRoute = nextUrl.pathname.startsWith("/login");

  if (isAdminRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }
    if (role !== "admin") {
      return NextResponse.redirect(new URL("/seller/dashboard", nextUrl));
    }
  }

  if (isSellerRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }
    if (role !== "seller") {
      return NextResponse.redirect(new URL("/admin/dashboard", nextUrl));
    }
  }

  if (isAuthRoute) {
    if (isLoggedIn) {
      if (role === "admin") {
        return NextResponse.redirect(new URL("/admin/dashboard", nextUrl));
      } else {
        return NextResponse.redirect(new URL("/seller/dashboard", nextUrl));
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/seller/:path*", "/login"],
};
