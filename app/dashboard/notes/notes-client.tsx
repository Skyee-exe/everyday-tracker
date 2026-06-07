"use client";

import React, { useState, useCallback, useEffect, useTransition } from "react";
import NotesSidebar from "@/components/notes/notes-sidebar";
import Editor from "@/components/notes/editor";
import { Note } from "@/db/schema";
import { getNotes } from "@/app/dashboard/notes/actions";

interface NotesClientProps {
  initialNotes: Note[];
  categories: any[];
}

export default function NotesClient({ initialNotes, categories }: NotesClientProps) {
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
    <div className="flex h-full w-full overflow-hidden bg-background text-foreground">
      <div className={`h-full flex-shrink-0 ${selectedNoteId !== null ? "hidden md:block" : "w-full md:w-[280px]"}`}>
        <NotesSidebar
          notes={notes}
          categories={categories}
          selectedNoteId={selectedNoteId}
          onSelectNote={setSelectedNoteId}
          onMutate={refreshNotes}
        />
      </div>
      <div className={`flex-1 relative h-full ${selectedNoteId === null ? "hidden md:block" : "w-full"}`}>
        {selectedNote ? (
          <Editor key={selectedNote.id} note={selectedNote} categories={categories} onSave={refreshNotes} onBack={() => setSelectedNoteId(null)} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <div className="w-16 h-16 mb-4 rounded-xl bg-muted flex items-center justify-center border border-border shadow-sm">
              <span className="text-2xl">📝</span>
            </div>
            <p className="text-lg font-medium text-foreground">Start writing</p>
            <p className="text-sm mt-1 text-muted-foreground">
              Select a note or create a new one.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
