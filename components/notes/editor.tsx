"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { SlashCommand } from "./slash-command";
import { Note } from "@/db/schema";
import { updateNote } from "@/app/dashboard/notes/actions";
import {
  Heading1, Heading2, Heading3, List, ListOrdered, CheckSquare,
  Quote, Code, Minus, Bold, Italic, Underline as UnderlineIcon,
  Highlighter, Link as LinkIcon, Wand2, Check, Strikethrough
} from "lucide-react";

interface EditorProps {
  note: Note;
  onSave?: () => void;
}

export default function Editor({ note, onSave }: EditorProps) {
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [title, setTitle] = useState(note.title);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleRef = useRef(title);

  useEffect(() => { titleRef.current = title; }, [title]);

  const debouncedSave = useCallback((content: any, noteTitle: string) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    setSaveStatus("saving");
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await updateNote(note.id, { content, title: noteTitle });
        setSaveStatus("saved");
        onSave?.();
        setTimeout(() => setSaveStatus("idle"), 2000);
      } catch (e) {
        console.error("Save failed:", e);
        setSaveStatus("idle");
      }
    }, 800);
  }, [note.id, onSave]);

  useEffect(() => {
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, []);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Placeholder.configure({ placeholder: "Press '/' for commands, or start typing..." }),
      TaskList, TaskItem.configure({ nested: true }),
      TextStyle, Color, Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: false }), Underline,
      SlashCommand,
    ],
    content: note.content || { type: "doc", content: [{ type: "paragraph" }] },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      debouncedSave(json, titleRef.current);
    },
  });

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (editor) debouncedSave(editor.getJSON(), newTitle);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      editor?.commands.focus("start");
    }
  };

  if (!editor) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="w-8 h-8 rounded-full bg-slate-100 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white flex-1 min-w-0">
      <div className="flex items-center justify-between px-8 h-16 border-b border-slate-100 flex-shrink-0 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {note.icon && <span className="text-2xl">{note.icon}</span>}
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            onKeyDown={handleTitleKeyDown}
            className="text-[22px] font-bold text-slate-800 bg-transparent border-none outline-none w-full placeholder:text-slate-300 font-display tracking-tight"
            placeholder="Untitled"
          />
        </div>
        <div className="flex items-center gap-4 flex-shrink-0 text-xs font-medium text-slate-400">
          <div className="flex items-center gap-1.5 w-20 justify-end">
            {saveStatus === "saving" && <><div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> Saving...</>}
            {saveStatus === "saved" && <><Check size={12} className="text-green-500" /> Saved</>}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
        <div className="max-w-[760px] mx-auto px-8 py-12 pb-32">
          
          <BubbleMenu editor={editor} className="flex items-center bg-white border border-slate-200 rounded-lg p-1 shadow-[0_8px_30px_rgb(0,0,0,0.12)] gap-0.5">
            <button onClick={() => editor.chain().focus().toggleBold().run()} className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${editor.isActive("bold") ? "bg-slate-100 text-blue-600" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}><Bold size={14} /></button>
            <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${editor.isActive("italic") ? "bg-slate-100 text-blue-600" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}><Italic size={14} /></button>
            <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${editor.isActive("underline") ? "bg-slate-100 text-blue-600" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}><UnderlineIcon size={14} /></button>
            <button onClick={() => editor.chain().focus().toggleStrike().run()} className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${editor.isActive("strike") ? "bg-slate-100 text-blue-600" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}><Strikethrough size={14} /></button>
            <button onClick={() => editor.chain().focus().toggleHighlight().run()} className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${editor.isActive("highlight") ? "bg-slate-100 text-blue-600" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}><Highlighter size={14} /></button>
            <div className="w-px h-4 bg-slate-200 mx-1" />
            <LinkButton editor={editor} />
            <div className="w-px h-4 bg-slate-200 mx-1" />
            <AiRefineMenu editor={editor} />
          </BubbleMenu>

          <EditorContent editor={editor} className="prose prose-slate prose-lg max-w-none prose-headings:font-display prose-headings:tracking-tight prose-a:text-blue-600 prose-p:leading-relaxed prose-pre:bg-slate-50 prose-pre:text-slate-800 prose-pre:border prose-pre:border-slate-200 focus:outline-none" />
        </div>
      </div>
    </div>
  );
}

function LinkButton({ editor }: { editor: any }) {
  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Enter URL", previousUrl || "https://");
    if (url === null) return;
    if (url === "") { editor.chain().focus().extendMarkRange("link").unsetLink().run(); return; }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  return (
    <button onClick={setLink} className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${editor.isActive("link") ? "bg-slate-100 text-blue-600" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}><LinkIcon size={14} /></button>
  );
}

function AiRefineMenu({ editor }: { editor: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false); };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [isOpen]);

  const handleAiAction = async (option: string) => {
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, " ");
    if (!selectedText) return;
    setIsOpen(false);
    setLoading(true);
    try {
      const res = await fetch("/api/ai/refine", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: selectedText, option }) });
      const data = await res.json();
      if (data.result) editor.chain().focus().deleteSelection().insertContent(data.result).run();
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const options = ["Improve Grammar", "Rewrite", "Shorten", "Expand", "Professional", "Friendly", "Summarize", "Bullet Points"];

  return (
    <div className="relative flex items-center" ref={ref}>
      <button onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }} disabled={loading} className="flex items-center gap-1.5 px-2.5 py-1 text-[12px] font-bold text-purple-600 hover:bg-purple-50 rounded-md transition-colors whitespace-nowrap ml-1">
        <Wand2 size={13} className={loading ? "animate-spin" : ""} />
        {loading ? "Refining..." : "AI Refine"}
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%+6px)] left-0 w-40 bg-white border border-slate-200 shadow-xl rounded-xl p-1 z-50 animate-in fade-in zoom-in-95">
          {options.map((opt) => (
            <button key={opt} onClick={(e) => { e.stopPropagation(); handleAiAction(opt); }} className="w-full text-left px-3 py-1.5 text-[13px] font-medium text-slate-700 hover:bg-purple-50 hover:text-purple-700 rounded-md transition-colors">
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
