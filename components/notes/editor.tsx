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
import { useAssemblyAIStreaming } from "@/hooks/useAssemblyAIStreaming";
import {
  Heading1, Heading2, Heading3, List, ListOrdered, CheckSquare,
  Quote, Code, Minus, Bold, Italic, Underline as UnderlineIcon,
  Highlighter, Link as LinkIcon, Wand2, Check, Strikethrough,
  Mic, Square, Tag, ChevronDown
} from "lucide-react";

interface EditorProps {
  note: Note;
  categories: any[];
  onSave?: () => void;
}

export default function Editor({ note, categories, onSave }: EditorProps) {
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [title, setTitle] = useState(note.title);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleRef = useRef(title);
  const voiceRangeRef = useRef<{ from: number; to: number } | null>(null);

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

  const insertTranscript = useCallback((text: string, isFinal: boolean) => {
    if (!editor) return;

    const content = isFinal ? `${text} ` : text;
    const existingRange = voiceRangeRef.current;

    if (existingRange) {
      editor
        .chain()
        .focus()
        .deleteRange(existingRange)
        .insertContent(content)
        .run();
      voiceRangeRef.current = isFinal
        ? null
        : { from: existingRange.from, to: existingRange.from + content.length };
      return;
    }

    const insertAt = editor.isFocused
      ? editor.state.selection.from
      : editor.state.doc.content.size;

    editor.chain().focus().insertContentAt(insertAt, content).run();
    voiceRangeRef.current = isFinal
      ? null
      : { from: insertAt, to: insertAt + content.length };
  }, [editor]);

  const {
    error: speechError,
    isRecording,
    liveTranscript,
    start: startRecording,
    status: recordingStatus,
    stop: stopRecording,
  } = useAssemblyAIStreaming({
    onTranscript: insertTranscript,
  });

  useEffect(() => {
    if (recordingStatus === "idle" || recordingStatus === "error") {
      voiceRangeRef.current = null;
    }
  }, [recordingStatus]);

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
      <div className="flex-1 flex items-center justify-center bg-card">
        <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
      </div>
    );
  }

  const activeCategory = categories.find((c) => c.name.toLowerCase() === note.category?.toLowerCase());

  return (
    <div className="flex flex-col h-full bg-card flex-1 min-w-0">
      <div className="flex items-center justify-between px-8 h-16 border-b border-border flex-shrink-0 bg-card/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {note.icon && <span className="text-2xl">{note.icon}</span>}
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            onKeyDown={handleTitleKeyDown}
            className="text-[22px] font-bold text-slate-800 dark:text-slate-100 bg-transparent border-none outline-none w-full placeholder:text-slate-300 dark:placeholder:text-slate-700 font-display tracking-tight"
            placeholder="Untitled"
          />
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 text-xs font-medium text-slate-400">
          <div className="relative group">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card hover:bg-muted text-foreground transition-colors">
              <Tag size={13} style={{ color: activeCategory ? activeCategory.color : "currentColor" }} />
              <span className="max-w-[100px] truncate text-slate-700 font-bold">
                {activeCategory ? activeCategory.name : "No Category"}
              </span>
              <ChevronDown size={12} className="text-slate-400" />
            </button>
            <div className="absolute right-0 top-[calc(100%+4px)] w-48 bg-card border border-border shadow-xl rounded-xl p-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              <button
                onClick={() => updateNote(note.id, { category: null }).then(() => onSave?.())}
                className="w-full text-left px-3 py-2 text-[13px] font-medium text-slate-700 hover:bg-muted rounded-md transition-colors flex items-center gap-2"
              >
                <Tag size={14} className="text-slate-400" />
                None
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => updateNote(note.id, { category: c.name }).then(() => onSave?.())}
                  className="w-full text-left px-3 py-2 text-[13px] font-medium text-slate-700 hover:bg-muted rounded-md transition-colors flex items-center gap-2"
                >
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                  {c.name}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={recordingStatus === "requesting" || recordingStatus === "connecting" || recordingStatus === "stopping"}
            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] font-bold transition-colors ${
              isRecording
                ? "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:bg-accent hover:text-primary"
            } disabled:cursor-not-allowed disabled:opacity-60`}
          >
            <span className={`relative flex h-4 w-4 items-center justify-center ${isRecording ? "text-rose-600" : ""}`}>
              {isRecording && (
                <span className="absolute inset-0 rounded-full bg-rose-400/40 animate-ping" />
              )}
              {isRecording ? <Square size={13} fill="currentColor" /> : <Mic size={14} />}
            </span>
            {isRecording ? "Stop Recording" : recordingStatus === "requesting" || recordingStatus === "connecting" ? "Listening..." : "Speak to Note"}
          </button>
          <div className="flex items-center gap-1.5 w-20 justify-end">
            {saveStatus === "saving" && <><div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> Saving...</>}
            {saveStatus === "saved" && <><Check size={12} className="text-green-500" /> Saved</>}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
        <div className="max-w-[760px] mx-auto px-8 py-12 pb-32">
          {(liveTranscript || speechError) && (
            <div className={`mb-6 rounded-lg border px-4 py-3 text-sm shadow-sm ${
              speechError
                ? "border-rose-100 dark:border-rose-950 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400"
                : "border-blue-100 dark:border-blue-950 bg-blue-50/70 dark:bg-blue-950/20 text-slate-700 dark:text-slate-300"
            }`}>
              {liveTranscript ? (
                <div className="flex items-start gap-3">
                  <Mic size={16} className="mt-0.5 flex-shrink-0 text-blue-500" />
                  <p className="min-w-0 leading-6">
                    <span className="font-semibold text-blue-700 dark:text-blue-400">Live preview: </span>
                    <span className="text-slate-600 dark:text-slate-400">{liveTranscript}</span>
                  </p>
                </div>
              ) : (
                speechError
              )}
            </div>
          )}
          
          <BubbleMenu editor={editor} className="flex items-center bg-card border border-border rounded-lg p-1 shadow-[0_8px_30px_rgb(0,0,0,0.12)] gap-0.5">
            <button onClick={() => editor.chain().focus().toggleBold().run()} className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${editor.isActive("bold") ? "bg-muted text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400 hover:bg-muted dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-255"}`}><Bold size={14} /></button>
            <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${editor.isActive("italic") ? "bg-muted text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400 hover:bg-muted dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-255"}`}><Italic size={14} /></button>
            <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${editor.isActive("underline") ? "bg-muted text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400 hover:bg-muted dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-255"}`}><UnderlineIcon size={14} /></button>
            <button onClick={() => editor.chain().focus().toggleStrike().run()} className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${editor.isActive("strike") ? "bg-muted text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400 hover:bg-muted dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-255"}`}><Strikethrough size={14} /></button>
            <button onClick={() => editor.chain().focus().toggleHighlight().run()} className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${editor.isActive("highlight") ? "bg-muted text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400 hover:bg-muted dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-255"}`}><Highlighter size={14} /></button>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 mx-1" />
            <LinkButton editor={editor} />
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 mx-1" />
            <AiRefineMenu editor={editor} />
          </BubbleMenu>

          <EditorContent editor={editor} className="prose prose-slate dark:prose-invert prose-lg max-w-none prose-headings:font-display prose-headings:tracking-tight prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-p:leading-relaxed prose-pre:bg-muted prose-pre:text-foreground prose-pre:border prose-pre:border-border focus:outline-none" />
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
    <button onClick={setLink} className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${editor.isActive("link") ? "bg-muted text-primary" : "text-slate-500 hover:bg-muted hover:text-slate-800"}`}><LinkIcon size={14} /></button>
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
        <div className="absolute top-[calc(100%+6px)] left-0 w-40 bg-card border border-border shadow-xl rounded-xl p-1 z-50 animate-in fade-in zoom-in-95">
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
