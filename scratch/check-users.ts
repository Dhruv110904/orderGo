import { db } from "../lib/db";
import { users } from "../db/schema";

async function run() {
  try {
    const allUsers = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    }).from(users);
    console.log("SUCCESS: Users in DB:", allUsers);
  } catch (error: any) {
    console.error("ERROR querying DB:", error.message || error);
  }
}

run();
