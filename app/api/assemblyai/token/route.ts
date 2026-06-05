import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKey = process.env.ASSEMBLYAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "AssemblyAI API key not configured" },
        { status: 500 }
      );
    }

    const params = new URLSearchParams({
      expires_in_seconds: "60",
      max_session_duration_seconds: "60",
    });

    const response = await fetch(
      `https://streaming.assemblyai.com/v3/token?${params.toString()}`,
      {
        headers: {
          Authorization: apiKey,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to create AssemblyAI token" },
        { status: response.status }
      );
    }

    return NextResponse.json({ token: data.token });
  } catch (error) {
    console.error("AssemblyAI token error:", error);
    return NextResponse.json(
      { error: "Failed to create AssemblyAI token" },
      { status: 500 }
    );
  }
}
