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
import { ArrowLeft, BookOpen, Check, Copy, Download, Heart, Share2, Trash2, Archive, Bold, Italic, Underline as UnderlineIcon, Strikethrough, Highlighter, Link as LinkIcon, Wand2, Mic, Square, Sparkles } from "lucide-react";
import { SlashCommand } from "../notes/slash-command";
import { SpacePage } from "@/db/schema";
import { updatePage } from "@/app/dashboard/pages/actions";
import { useAssemblyAIStreaming } from "@/hooks/useAssemblyAIStreaming";
import { convertTiptapToMarkdown } from "@/lib/markdown-export";

interface PageEditorProps {
  page: SpacePage;
  spaceName: string;
  onClose: () => void;
  onSave?: () => void;
}

export default function PageEditor({ page, spaceName, onClose, onSave }: PageEditorProps) {
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [title, setTitle] = useState(page.title);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleRef = useRef(title);
  const voiceRangeRef = useRef<{ from: number; to: number } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/dashboard/pages`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      showNotification("Workspace link copied!");
    }).catch((err) => {
      console.error(err);
      showNotification("Failed to copy link");
    });
  };

  const handleExport = () => {
    try {
      const markdownContent = editor
        ? convertTiptapToMarkdown(editor.getJSON())
        : page.summary || "";
      const blob = new Blob([markdownContent], { type: "text/markdown;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${title.toLowerCase().replace(/\s+/g, "-") || "untitled"}.md`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showNotification("Exported to Markdown!");
    } catch (e) {
      console.error(e);
      showNotification("Export failed");
    }
  };

  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  const debouncedSave = useCallback((content: any, pageTitle: string) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    setSaveStatus("saving");
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await updatePage(page.id, { content, title: pageTitle });
        setSaveStatus("saved");
        onSave?.();
        setTimeout(() => setSaveStatus("idle"), 2000);
      } catch (e) {
        console.error("Page save failed:", e);
        setSaveStatus("idle");
      }
    }, 800);
  }, [page.id, onSave]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Placeholder.configure({ placeholder: "Press '/' for commands, or start typing..." }),
      TaskList,
      TaskItem.configure({ nested: true }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: false }),
      Underline,
      SlashCommand,
    ],
    content: page.content || { type: "doc", content: [{ type: "paragraph" }] },
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
      <div className="flex-1 flex items-center justify-center bg-white h-full">
        <div className="w-8 h-8 rounded-full bg-slate-100 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white flex-1 min-w-0 relative">
      {/* Editor Top Toolbar */}
      <div className="flex items-center justify-between px-6 h-14 border-b border-slate-100 flex-shrink-0 bg-white/90 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-50 border border-slate-200/60 text-slate-500 hover:text-slate-800 transition-colors"
            title="Back to workspace"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 select-none">
            <span>{spaceName}</span>
            <span>/</span>
            <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-200/50 text-[10px] text-slate-500 uppercase tracking-wider">{page.type}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleShare}
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-50 border border-slate-200/60 text-slate-500 hover:text-slate-800 transition-colors"
            title="Share page link"
          >
            <Share2 size={14} />
          </button>
          <button
            onClick={handleExport}
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-50 border border-slate-200/60 text-slate-500 hover:text-slate-800 transition-colors"
            title="Export page to Markdown"
          >
            <Download size={14} />
          </button>
          <div className="h-4 w-px bg-slate-200/80 mx-1" />
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={recordingStatus === "requesting" || recordingStatus === "connecting" || recordingStatus === "stopping"}
            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-bold transition-colors ${
              isRecording
                ? "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
            } disabled:cursor-not-allowed disabled:opacity-60`}
          >
            <span className={`relative flex h-3.5 w-3.5 items-center justify-center ${isRecording ? "text-rose-600" : ""}`}>
              {isRecording && (
                <span className="absolute inset-0 rounded-full bg-rose-400/40 animate-ping" />
              )}
              {isRecording ? <Square size={10} fill="currentColor" /> : <Mic size={11} />}
            </span>
            {isRecording ? "Stop" : recordingStatus === "requesting" || recordingStatus === "connecting" ? "Listening..." : "Speak to Page"}
          </button>
          <div className="flex items-center gap-1.5 w-18 justify-end text-xs font-medium text-slate-400">
            {saveStatus === "saving" && <><div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> Saving...</>}
            {saveStatus === "saved" && <><Check size={12} className="text-green-500" /> Saved</>}
          </div>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
        <div className="max-w-[760px] mx-auto px-6 py-8 pb-32">
          {/* Audio Live Preview */}
          {(liveTranscript || speechError) && (
            <div className={`mb-6 rounded-lg border px-4 py-3 text-sm shadow-sm ${
              speechError
                ? "border-rose-100 bg-rose-50 text-rose-700"
                : "border-blue-100 bg-blue-50/70 text-slate-700"
            }`}>
              {liveTranscript ? (
                <div className="flex items-start gap-3">
                  <Mic size={16} className="mt-0.5 flex-shrink-0 text-blue-500" />
                  <p className="min-w-0 leading-6">
                    <span className="font-semibold text-blue-700">Live voice input: </span>
                    <span className="text-slate-600">{liveTranscript}</span>
                  </p>
                </div>
              ) : (
                speechError
              )}
            </div>
          )}

          {/* Page Title */}
          <div className="mb-6 flex items-center gap-2">
            <span className="text-2xl text-slate-400 select-none">📄</span>
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              onKeyDown={handleTitleKeyDown}
              className="text-3xl font-extrabold text-slate-800 bg-transparent border-none outline-none w-full placeholder:text-slate-300 font-display tracking-tight"
              placeholder="Untitled Page"
            />
          </div>

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

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-250 bg-slate-900/90 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-white/10 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-300">
          <Sparkles size={14} className="text-blue-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}
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
