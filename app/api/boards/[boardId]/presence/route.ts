import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { boardCollaborators, users } from "@/db/schema";
import { assertCanAccessBoard } from "@/lib/board-access";

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
    const { context } = await assertCanAccessBoard(boardId, "viewer");

    const rows = await db
      .select({ email: users.email })
      .from(boardCollaborators)
      .leftJoin(
        users,
        sql`LOWER(${users.email}) = LOWER(${boardCollaborators.email})`
      )
      .where(eq(boardCollaborators.boardId, boardId));

    return NextResponse.json({
      currentUserEmail: context.email,
      onlineEmails: [] as string[],
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
