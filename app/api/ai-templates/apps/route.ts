import { auth } from "@clerk/nextjs/server";
import { desc, eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db, generatedApps } from "@/db";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ apps: [] });

    const apps = await db
      .select({
        id: generatedApps.id,
        appName: generatedApps.appName,
        description: generatedApps.description,
        icon: generatedApps.icon,
        color: generatedApps.color,
      })
      .from(generatedApps)
      .where(and(eq(generatedApps.clerkUserId, userId), eq(generatedApps.inSidebar, true)))
      .orderBy(desc(generatedApps.updatedAt));

    return NextResponse.json({ apps });
  } catch (error) {
    console.error("Generated apps sidebar API error:", error);
    return NextResponse.json({ apps: [] });
  }
}
