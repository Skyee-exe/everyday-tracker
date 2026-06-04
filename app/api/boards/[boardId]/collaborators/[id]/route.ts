import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { boardCollaborators, users } from "@/db/schema";
import { assertCanAccessBoard } from "@/lib/board-access";
import { isCollabRole, type CollabRole } from "@/lib/collab/permissions";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ boardId: string; id: string }> }
) {
  try {
    const { boardId: rawBoard, id: rawId } = await params;
    const boardId = Number(rawBoard);
    const id = Number(rawId);
    if (!Number.isFinite(boardId) || !Number.isFinite(id)) {
      return new NextResponse("Bad ids", { status: 400 });
    }
    await assertCanAccessBoard(boardId, "owner");

    const body = await req.json().catch(() => ({}));
    const role: CollabRole = isCollabRole(body.role) ? body.role : "editor";
    if (role === "owner") {
      return NextResponse.json(
        { error: "Cannot promote to owner via this endpoint" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(boardCollaborators)
      .set({ role })
      .where(
        and(
          eq(boardCollaborators.id, id),
          eq(boardCollaborators.boardId, boardId)
        )
      )
      .returning();

    if (!updated) {
      return new NextResponse("Not found", { status: 404 });
    }

    return NextResponse.json({ collaborator: updated });
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

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ boardId: string; id: string }> }
) {
  try {
    const { boardId: rawBoard, id: rawId } = await params;
    const boardId = Number(rawBoard);
    const id = Number(rawId);
    if (!Number.isFinite(boardId) || !Number.isFinite(id)) {
      return new NextResponse("Bad ids", { status: 400 });
    }
    await assertCanAccessBoard(boardId, "owner");

    const target = await db.query.boardCollaborators.findFirst({
      where: and(
        eq(boardCollaborators.id, id),
        eq(boardCollaborators.boardId, boardId)
      ),
    });
    if (!target) {
      return new NextResponse("Not found", { status: 404 });
    }
    if (target.role === "owner") {
      return NextResponse.json(
        { error: "Cannot remove owner" },
        { status: 400 }
      );
    }

    await db
      .delete(boardCollaborators)
      .where(
        and(
          eq(boardCollaborators.id, id),
          eq(boardCollaborators.boardId, boardId)
        )
      );

    return NextResponse.json({ ok: true });
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
