import { NextResponse } from "next/server";
import { Liveblocks } from "@liveblocks/node";
import {
  canAccessBoard,
  canAccessTask,
  getAccessContext,
  autoAcceptPendingInvite,
} from "@/lib/board-access";
import { parseRoomId } from "@/lib/collab/types";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY || "sk_dev_placeholder",
});

export async function POST(req: Request) {
  const ctx = await getAccessContext();
  if (!ctx) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  let body: { room?: string };
  try {
    body = await req.json();
  } catch {
    return new NextResponse("Bad request", { status: 400 });
  }

  const roomId = body.room;
  if (!roomId || typeof roomId !== "string") {
    return new NextResponse("Missing room", { status: 400 });
  }

  const parsed = parseRoomId(roomId);
  if (!parsed) {
    return new NextResponse("Invalid room id", { status: 400 });
  }

  let allowed = false;
  try {
    if (parsed.kind === "board") {
      const access = await canAccessBoard(parsed.entityId, "viewer");
      allowed = access !== null;
    } else if (parsed.kind === "task") {
      const access = await canAccessTask(parsed.entityId, "viewer");
      allowed = access !== null;
    }
  } catch {
    allowed = false;
  }

  if (!allowed) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    await autoAcceptPendingInvite(ctx);
  } catch {
    // non-fatal
  }

  const dbUser = await import("@/db").then((m) =>
    m.db.query.users.findFirst({
      where: (u, { eq }) => eq(u.clerkUserId, ctx.clerkUserId),
    })
  );

  const name =
    dbUser?.name || ctx.email.split("@")[0] || "Anonymous";
  const avatar = dbUser?.imageUrl || undefined;

  const session = liveblocks.prepareSession(ctx.userId.toString(), {
    userInfo: {
      name,
      email: ctx.email,
      avatar,
    },
  });

  session.allow(roomId, session.FULL_ACCESS);

  const { status, body: lbBody } = await session.authorize();
  return new NextResponse(lbBody, { status });
}
