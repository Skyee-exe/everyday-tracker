"use client";

import dynamic from "next/dynamic";
import { type Whiteboard } from "@/db/schema";
import { Loader2 } from "lucide-react";

const WhiteboardWorkspace = dynamic(() => import("./WhiteboardWorkspace"), {
  ssr: false,
  loading: () => (
    <div className="wb-canvas-loading">
      <Loader2 size={18} className="wb-spin" />
      <span>Loading whiteboard...</span>
    </div>
  ),
});

export default function WhiteboardWrapper({
  initialBoards,
}: {
  initialBoards: Whiteboard[];
}) {
  return <WhiteboardWorkspace initialBoards={initialBoards} />;
}
