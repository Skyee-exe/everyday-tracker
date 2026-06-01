import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function checkAndSyncUser() {
  try {
    const { userId } = await auth();
    if (!userId) return null;

    // First check if user already exists by clerkUserId in local db (extremely fast)
    const dbUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (dbUser) {
      return dbUser;
    }

    // User is signed in but clerkUserId not found, fetch full details from Clerk
    const clerkUser = await currentUser();
    if (!clerkUser) return null;

    const email = clerkUser.emailAddresses[0]?.emailAddress;
    if (!email) {
      console.warn("User has no email address: ", userId);
      return null;
    }

    const name = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || null;
    const imageUrl = clerkUser.imageUrl || null;

    // Check if the user exists by email (to link existing account)
    const existingUserByEmail = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUserByEmail) {
      // Link the Clerk ID to the existing email record
      const [updatedUser] = await db.update(users)
        .set({ 
          clerkUserId: userId, 
          name, 
          imageUrl, 
          lastSignedInAt: new Date(),
          updatedAt: new Date() 
        })
        .where(eq(users.email, email))
        .returning();
      console.log("Successfully linked Clerk user ID to existing user email:", email);
      return updatedUser;
    }

    // Insert new user
    const [newUser] = await db.insert(users).values({
      clerkUserId: userId,
      email,
      name,
      imageUrl,
      lastSignedInAt: new Date(),
    }).returning();

    console.log("Successfully created and synced user to database:", email);
    return newUser;
  } catch (error: any) {
    // Rethrow Next.js dynamic server usage errors so Next.js knows to opt-out of static rendering
    if (error && typeof error === 'object' && (error.digest === 'DYNAMIC_SERVER_USAGE' || error.message?.includes('Dynamic server usage'))) {
      throw error;
    }
    console.error("Error during user sync:", error);
    return null;
  }
}
