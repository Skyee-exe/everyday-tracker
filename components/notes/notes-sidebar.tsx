"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Plus,
  Search,
  FileText,
  Trash2,
  MoreHorizontal,
  Pin,
  Star,
  Copy,
  RotateCcw,
  Clock,
  Tag,
} from "lucide-react";
import { Note } from "@/db/schema";
import { formatDistanceToNow } from "date-fns";
import {
  createNote,
  moveToTrash,
  restoreNote,
  emptyTrash,
  togglePin,
  toggleFavorite,
  duplicateNote,
  updateColor,
} from "@/app/dashboard/notes/actions";

interface NotesSidebarProps {
  notes: Note[];
  categories: any[];
  selectedNoteId: number | null;
  onSelectNote: (id: number | null) => void;
  onMutate: () => void;
}

const NOTE_COLORS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#6366f1",
  "#a855f7",
  "#ec4899",
  "transparent",
];

const TEMPLATES = [
  { label: "Blank Note", title: "Untitled", content: { type: "doc", content: [{ type: "paragraph" }] } },
  { label: "Meeting Notes", title: "Meeting Notes", content: { type: "doc", content: [{ type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Meeting Notes" }] }, { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Attendees" }] }, { type: "bulletList", content: [{ type: "listItem", content: [{ type: "paragraph" }] }] }, { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Agenda" }] }, { type: "bulletList", content: [{ type: "listItem", content: [{ type: "paragraph" }] }] }] } },
  { label: "Daily Journal", title: "Daily Journal", content: { type: "doc", content: [{ type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Daily Journal" }] }, { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Gratitude" }] }, { type: "bulletList", content: [{ type: "listItem", content: [{ type: "paragraph" }] }] }, { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Today's Goals" }] }, { type: "taskList", content: [{ type: "taskItem", attrs: { checked: false }, content: [{ type: "paragraph" }] }] }] } }
];

export default function NotesSidebar({
  notes,
  categories,
  selectedNoteId,
  onSelectNote,
  onMutate,
}: NotesSidebarProps) {
  const [search, setSearch] = useState("");
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [showTemplates, setShowTemplates] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  const activeNotes = notes.filter((n) => !n.isTrash);
  const trashNotes = notes.filter((n) => n.isTrash);

  const filteredNotes = useMemo(() => {
    let result = activeNotes;
    if (search) {
      const s = search.toLowerCase();
      result = result.filter((n) => n.title.toLowerCase().includes(s));
    }
    if (filterCategory) {
      result = result.filter((n) => n.category?.toLowerCase() === filterCategory.toLowerCase());
    }
    return result;
  }, [activeNotes, search, filterCategory]);

  const favorites = filteredNotes.filter((n) => n.isFavorite);
  const pinned = filteredNotes.filter((n) => n.isPinned && !n.isFavorite);
  const others = filteredNotes.filter((n) => !n.isFavorite && !n.isPinned);

  const handleCreateFromTemplate = async (template: typeof TEMPLATES[0]) => {
    setShowTemplates(false);
    try {
      const note = await createNote({ title: template.title, content: template.content });
      if (note) {
        onSelectNote(note.id);
        onMutate();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openMenu = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPos({ top: Math.min(rect.bottom + 4, window.innerHeight - 300), left: rect.left });
    setMenuOpenId(id);
  };

  useEffect(() => {
    if (menuOpenId === null) return;
    const handler = () => setMenuOpenId(null);
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [menuOpenId]);

  useEffect(() => {
    if (!showTemplates) return;
    const handler = () => setShowTemplates(false);
    setTimeout(() => window.addEventListener("click", handler), 0);
    return () => window.removeEventListener("click", handler);
  }, [showTemplates]);

  const renderNoteItem = (n: Note) => (
    <div
      key={n.id}
      onClick={() => onSelectNote(n.id)}
      className={`group relative flex items-center gap-3 p-2 mx-3 mb-1 rounded-lg cursor-pointer transition-colors overflow-hidden ${
        selectedNoteId === n.id ? "bg-accent/80 text-foreground" : "hover:bg-muted/60 text-muted-foreground"
      }`}
    >
      {n.color && n.color !== "transparent" && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-md" style={{ backgroundColor: n.color }} />
      )}

      <div className={`flex-shrink-0 w-5 h-5 flex items-center justify-center text-[13px] ${selectedNoteId === n.id ? "text-blue-600" : "text-slate-400"}`}>
        {n.icon ? <span>{n.icon}</span> : <FileText size={15} />}
      </div>

      <div className="flex-1 min-w-0">
        <div className={`truncate text-[13px] ${selectedNoteId === n.id ? "font-semibold text-blue-700" : "font-medium text-slate-700"}`}>
          {n.title || "Untitled"}
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
          <div className="flex items-center gap-1">
            <Clock size={10} />
            <span>{formatDistanceToNow(new Date(n.updatedAt), { addSuffix: true })}</span>
          </div>
          {n.category && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground font-medium text-[9px] uppercase tracking-wider">
              {n.category}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        {n.isPinned && <Pin size={11} className="text-blue-500 opacity-60 group-hover:opacity-100 mr-1" />}
        <button
          onClick={(e) => openMenu(e, n.id)}
          className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
        >
          <MoreHorizontal size={14} />
        </button>
      </div>

      {menuOpenId === n.id && (
        <div
          className="fixed z-50 w-48 bg-card border border-border rounded-xl shadow-lg p-1 animate-in fade-in zoom-in-95"
          style={{ top: menuPos.top, left: menuPos.left }}
          onClick={(e) => e.stopPropagation()}
        >
          {!n.isTrash ? (
            <>
              <button
                className="w-full flex items-center gap-2 px-2 py-1.5 text-[13px] font-medium text-foreground hover:bg-muted rounded-md transition-colors"
                onClick={async () => { await toggleFavorite(n.id, !n.isFavorite); setMenuOpenId(null); onMutate(); }}
              >
                <Star size={14} className="text-slate-400" />
                {n.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
              </button>
              <button
                className="w-full flex items-center gap-2 px-2 py-1.5 text-[13px] font-medium text-foreground hover:bg-muted rounded-md transition-colors"
                onClick={async () => { await togglePin(n.id, !n.isPinned); setMenuOpenId(null); onMutate(); }}
              >
                <Pin size={14} className="text-slate-400" />
                {n.isPinned ? "Unpin Note" : "Pin Note"}
              </button>
              <button
                className="w-full flex items-center gap-2 px-2 py-1.5 text-[13px] font-medium text-foreground hover:bg-muted rounded-md transition-colors"
                onClick={async () => { const newNote = await duplicateNote(n.id); if (newNote) onSelectNote(newNote.id); setMenuOpenId(null); onMutate(); }}
              >
                <Copy size={14} className="text-slate-400" /> Duplicate
              </button>
              <div className="h-px bg-border my-1 mx-1" />
              <div className="px-2 py-1.5">
                <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  <Tag size={11} /> Color
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {NOTE_COLORS.map((c) => (
                    <button
                      key={c}
                      className="w-5 h-5 rounded-full border border-border flex items-center justify-center transition-transform hover:scale-110"
                      style={{ backgroundColor: c === "transparent" ? "#f8fafc" : c }}
                      onClick={async () => { await updateColor(n.id, c); setMenuOpenId(null); onMutate(); }}
                    >
                      {c === "transparent" && <span className="text-[10px] font-bold text-slate-400">✕</span>}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-px bg-border my-1 mx-1" />
              <button
                className="w-full flex items-center gap-2 px-2 py-1.5 text-[13px] font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
                onClick={async () => { await moveToTrash(n.id); if (selectedNoteId === n.id) onSelectNote(null); setMenuOpenId(null); onMutate(); }}
              >
                <Trash2 size={14} className="text-red-500" /> Move to Trash
              </button>
            </>
          ) : (
            <button
              className="w-full flex items-center gap-2 px-2 py-1.5 text-[13px] font-medium text-foreground hover:bg-muted rounded-md transition-colors"
              onClick={async () => { await restoreNote(n.id); setMenuOpenId(null); onMutate(); }}
            >
              <RotateCcw size={14} className="text-slate-400" /> Restore Note
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full md:w-[280px] h-full border-r border-border bg-muted/30 flex flex-col flex-shrink-0">
      <div className="p-4 pb-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-800 tracking-tight">Notes</h2>
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowTemplates(!showTemplates); }}
              className="w-7 h-7 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm transition-all hover:scale-105"
            >
              <Plus size={16} />
            </button>
            {showTemplates && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-card border border-border shadow-xl rounded-xl p-1 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">New Note</div>
                {TEMPLATES.map((t) => (
                  <button key={t.label} className="w-full text-left px-3 py-2 text-[13px] font-medium text-foreground hover:bg-muted rounded-md transition-colors" onClick={() => handleCreateFromTemplate(t)}>
                    {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search notes..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-1.5 text-[13px] bg-card border border-border rounded-md outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm" />
        </div>
        {categories && categories.length > 0 && (
          <div className="mt-2 flex gap-1 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setFilterCategory(null)}
              className={`flex-shrink-0 px-2.5 py-1 text-[11px] font-bold rounded-full border transition-colors ${
                !filterCategory
                  ? "bg-slate-800 text-white border-slate-800"
                  : "bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground"
              }`}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setFilterCategory(filterCategory === c.name ? null : c.name)}
                className={`flex-shrink-0 px-2.5 py-1 text-[11px] font-bold rounded-full border transition-colors flex items-center gap-1.5 ${
                  filterCategory === c.name
                    ? "text-white border-transparent"
                    : "bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                }`}
                style={{ backgroundColor: filterCategory === c.name ? c.color : undefined }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: filterCategory === c.name ? "white" : c.color }} />
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pb-4 scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300">
        {search && filteredNotes.length === 0 && <div className="px-6 py-10 text-center text-[13px] text-slate-500">No notes found.</div>}
        {favorites.length > 0 && (
          <div className="mb-4">
            <div className="px-5 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Favorites</div>
            {favorites.map(renderNoteItem)}
          </div>
        )}
        {pinned.length > 0 && (
          <div className="mb-4">
            <div className="px-5 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pinned</div>
            {pinned.map(renderNoteItem)}
          </div>
        )}
        {others.length > 0 && (
          <div className="mb-4">
            <div className="px-5 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">All Notes</div>
            {others.map(renderNoteItem)}
          </div>
        )}
        {!search && activeNotes.length === 0 && (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center mb-4"><FileText size={24} /></div>
            <p className="text-[14px] font-semibold text-slate-700">No notes yet</p>
            <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">Create your first note to start writing.</p>
          </div>
        )}
      </div>

      {trashNotes.length > 0 && !search && (
        <div className="border-t border-border p-2 flex-shrink-0 bg-muted/50">
          <button onClick={() => setShowTrash(!showTrash)} className="w-full flex items-center gap-2 px-3 py-2 text-[12px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
            <Trash2 size={14} /> Trash ({trashNotes.length})
          </button>
          {showTrash && (
            <div className="mt-2 pt-2 border-t border-slate-100">
              <div className="max-h-48 overflow-y-auto">{trashNotes.map(renderNoteItem)}</div>
              <button onClick={async () => { await emptyTrash(); onSelectNote(null); onMutate(); }} className="w-[calc(100%-24px)] mx-3 mt-2 py-1.5 text-[11px] font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors border border-red-100">
                Empty Trash
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
