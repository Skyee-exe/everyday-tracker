import React from "react";
import NotesClient from "./notes-client";
import { getNotes } from "./actions";

export default async function NotesPage() {
  const notes = await getNotes();

  // Sort notes by updatedAt desc
  const sortedNotes = notes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return (
    <div className="h-[calc(100vh-3.5rem)] w-full">
      <NotesClient initialNotes={sortedNotes} />
    </div>
  );
}
