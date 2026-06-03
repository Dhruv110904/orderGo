import bcrypt from "bcryptjs";
import { db } from "../lib/db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

async function run() {
  const email = "admin@aasa.com";
  const password = "Admin@123";

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      console.error("FAILED: User not found in DB!");
      return;
    }

    console.log("Found User in DB:", {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    console.log("SUCCESS: Is password valid?", isPasswordValid);
  } catch (error: any) {
    console.error("ERROR running test auth:", error.message || error);
  }
}

run();
