"use client";

import React from "react";
import { Thread, Composer } from "@liveblocks/react-ui";
import { ClientSideSuspense } from "@liveblocks/react";
import { useThreads } from "../liveblocks.config";

function ThreadListInner({
  taskId,
}: {
  taskId: number;
}) {
  const { threads } = useThreads();
  const list = threads ?? [];

  return (
    <div className="collab-thread-list" data-room={`task_${taskId}`}>
      {list.length === 0 ? (
        <div className="collab-thread-empty">
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
          <p className="collab-thread-empty-title">Start the discussion</p>
          <p className="collab-thread-empty-desc">
            Leave the first comment on this task.
          </p>
        </div>
      ) : (
        list.map((thread) => (
          <div key={thread.id} className="collab-thread-card">
            <Thread thread={thread} showReactions={false} showActions={false} />
          </div>
        ))
      )}

      <div className="collab-thread-composer">
        <ComposerWithMeta taskId={taskId} />
      </div>
    </div>
  );
}

function ComposerWithMeta({ taskId }: { taskId: number }) {
  return <Composer metadata={{ taskId, resolved: false }} />;
}

function ThreadListFallback() {
  return (
    <div className="collab-thread-list collab-thread-list--loading">
      <div className="collab-thread-skeleton" />
      <div className="collab-thread-skeleton collab-thread-skeleton--short" />
    </div>
  );
}

export function CommentThread({ taskId }: { taskId: number }) {
  return (
    <ClientSideSuspense fallback={<ThreadListFallback />}>
      <ThreadListInner taskId={taskId} />
    </ClientSideSuspense>
  );
}
