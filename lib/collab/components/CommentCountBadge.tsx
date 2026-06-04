"use client";

import React from "react";
import { ClientSideSuspense } from "@liveblocks/react";
import { useThreads } from "../liveblocks.config";

function CountInner() {
  const { threads } = useThreads();
  const list = threads ?? [];
  const count = list.length;
  if (count === 0) {
    return (
      <span
        className="kb-task-comment-count kb-task-comment-count--zero"
        title="No comments yet"
      >
        <CommentIcon />
      </span>
    );
  }
  return (
    <span
      className="kb-task-comment-count"
      title={`${count} comment${count > 1 ? "s" : ""}`}
    >
      <CommentIcon />
      {count}
    </span>
  );
}

function CountFallback() {
  return (
    <span
      className="kb-task-comment-count kb-task-comment-count--loading"
      title="Loading comments…"
    >
      <CommentIcon />
    </span>
  );
}

function CommentIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

export function CommentCountBadge() {
  return (
    <ClientSideSuspense fallback={<CountFallback />}>
      <CountInner />
    </ClientSideSuspense>
  );
}
