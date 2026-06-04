"use client";

import React, { useState, useCallback, useEffect, useTransition } from "react";
import NotesSidebar from "@/components/notes/notes-sidebar";
import Editor from "@/components/notes/editor";
import { Note } from "@/db/schema";
import { getNotes } from "@/app/dashboard/notes/actions";

interface NotesClientProps {
  initialNotes: Note[];
}

export default function NotesClient({ initialNotes }: NotesClientProps) {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  // Keep notes in sync with server data passed via props
  useEffect(() => {
    setNotes(initialNotes);
  }, [initialNotes]);

  const selectedNote = notes.find((n) => n.id === selectedNoteId) || null;

  // Refetch notes from the server after mutations
  const refreshNotes = useCallback(() => {
    startTransition(async () => {
      try {
        const fresh = await getNotes();
        const sorted = fresh.sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        setNotes(sorted);
      } catch (e) {
        console.error("Failed to refresh notes:", e);
      }
    });
  }, []);

  return (
    <div className="flex h-full w-full overflow-hidden bg-white">
      <NotesSidebar
        notes={notes}
        selectedNoteId={selectedNoteId}
        onSelectNote={setSelectedNoteId}
        onMutate={refreshNotes}
      />
      <div className="flex-1 relative">
        {selectedNote ? (
          <Editor key={selectedNote.id} note={selectedNote} onSave={refreshNotes} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <div className="w-16 h-16 mb-4 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 shadow-sm">
              <span className="text-2xl">📝</span>
            </div>
            <p className="text-lg font-medium text-slate-600">Start writing</p>
            <p className="text-sm mt-1 text-slate-400">
              Select a note or create a new one.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
