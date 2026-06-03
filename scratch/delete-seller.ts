import { db } from "../lib/db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Deleting old seller@aasa.com from database...");
  await db.delete(users).where(eq(users.email, "seller@aasa.com"));
  console.log("Done deleting old seller!");
}

main().catch(console.error);
