import { auth } from "@/auth";
import { redirect } from "next/navigation";
import RegisterFormClient from "./RegisterFormClient";

export default async function RegisterPage() {
  const session = await auth();

  // Route protection - Admin only can register new users
  if (!session || session.user.role !== "admin") {
    redirect("/login");
  }

  return <RegisterFormClient />;
}
