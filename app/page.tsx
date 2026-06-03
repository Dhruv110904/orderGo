import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function IndexPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role === "admin") {
    redirect("/admin/dashboard");
  } else {
    redirect("/seller/dashboard");
  }
}
