import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { inArray } from "drizzle-orm";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const userIds = url.searchParams.getAll("userIds");

  if (!userIds || userIds.length === 0) {
    return NextResponse.json([]);
  }

  const ids = userIds.map((id) => parseInt(id, 10)).filter((id) => !isNaN(id));
  if (ids.length === 0) {
    return NextResponse.json([]);
  }

  const dbUsers = await db.query.users.findMany({
    where: inArray(users.id, ids),
  });

  const result = dbUsers.map((u) => ({
    id: u.id.toString(),
    name: u.name || u.email.split("@")[0] || "Anonymous",
    avatar: u.imageUrl || undefined,
  }));

  return NextResponse.json(result);
}
