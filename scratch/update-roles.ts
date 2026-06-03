import { db } from "../lib/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Updating seller roles to user in database...");
  await db.execute(sql`UPDATE users SET role = 'user' WHERE role = 'seller'`);
  console.log("Done updating roles!");
}

main().catch(console.error);
