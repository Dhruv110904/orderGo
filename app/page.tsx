import { auth } from "@/auth";
import LandingPageClient from "./LandingPageClient";

export default async function IndexPage() {
  const session = await auth();
  return <LandingPageClient session={session} />;
}
