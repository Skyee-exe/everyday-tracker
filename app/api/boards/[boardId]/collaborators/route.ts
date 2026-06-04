import { NextResponse } from "next/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { boardCollaborators, users } from "@/db/schema";
import { assertCanAccessBoard } from "@/lib/board-access";
import { isCollabRole, type CollabRole } from "@/lib/collab/permissions";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const { boardId: raw } = await params;
    const boardId = Number(raw);
    if (!Number.isFinite(boardId)) {
      return new NextResponse("Bad board id", { status: 400 });
    }
    await assertCanAccessBoard(boardId, "viewer");

    const rows = await db
      .select({
        id: boardCollaborators.id,
        email: boardCollaborators.email,
        role: boardCollaborators.role,
        acceptedAt: boardCollaborators.acceptedAt,
        createdAt: boardCollaborators.createdAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          imageUrl: users.imageUrl,
          lastSignedInAt: users.lastSignedInAt,
        },
      })
      .from(boardCollaborators)
      .leftJoin(
        users,
        sql`LOWER(${users.email}) = LOWER(${boardCollaborators.email})`
      )
      .where(eq(boardCollaborators.boardId, boardId))
      .orderBy(desc(boardCollaborators.createdAt));

    return NextResponse.json({ collaborators: rows });
  } catch (e: any) {
    if (e?.message === "FORBIDDEN") {
      return new NextResponse("Forbidden", { status: 403 });
    }
    return NextResponse.json(
      { error: e?.message ?? "Server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const { boardId: raw } = await params;
    const boardId = Number(raw);
    if (!Number.isFinite(boardId)) {
      return new NextResponse("Bad board id", { status: 400 });
    }
    const { context } = await assertCanAccessBoard(boardId, "owner");

    const body = await req.json().catch(() => ({}));
    const email = String(body.email ?? "").trim().toLowerCase();
    const role: CollabRole = isCollabRole(body.role) ? body.role : "editor";
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    if (role === "owner") {
      return NextResponse.json(
        { error: "Cannot invite as owner" },
        { status: 400 }
      );
    }
    if (email.toLowerCase() === context.email.toLowerCase()) {
      return NextResponse.json(
        { error: "You can't invite yourself" },
        { status: 400 }
      );
    }

    const existingUser = await db.query.users.findFirst({
      where: sql`LOWER(${users.email}) = LOWER(${email})`,
    });

    const existing = await db.query.boardCollaborators.findFirst({
      where: and(
        eq(boardCollaborators.boardId, boardId),
        sql`LOWER(${boardCollaborators.email}) = LOWER(${email})`
      ),
    });

    let row;
    if (existing) {
      const [updated] = await db
        .update(boardCollaborators)
        .set({
          role,
          userId: existingUser?.id ?? existing.userId,
          acceptedAt: existingUser ? new Date() : existing.acceptedAt,
        })
        .where(eq(boardCollaborators.id, existing.id))
        .returning();
      row = updated;
    } else {
      const [created] = await db
        .insert(boardCollaborators)
        .values({
          boardId,
          userId: existingUser?.id ?? null,
          email,
          role,
          invitedByClerkUserId: context.clerkUserId,
          acceptedAt: existingUser ? new Date() : null,
        })
        .returning();
      row = created;
    }

    return NextResponse.json({
      collaborator: {
        id: row.id,
        email: row.email,
        role: row.role,
        acceptedAt: row.acceptedAt,
        createdAt: row.createdAt,
        user: existingUser
          ? {
              id: existingUser.id,
              name: existingUser.name,
              email: existingUser.email,
              imageUrl: existingUser.imageUrl,
              lastSignedInAt: existingUser.lastSignedInAt,
            }
          : null,
      },
    });
  } catch (e: any) {
    if (e?.message === "FORBIDDEN") {
      return new NextResponse("Forbidden", { status: 403 });
    }
    return NextResponse.json(
      { error: e?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
