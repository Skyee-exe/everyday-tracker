/* eslint-disable react-hooks/purity */
"use client";

import React, { useState } from "react";
import {
  LayoutGrid,
  FileText,
  Trello,
  Compass,
  Plus,
  Send,
  RotateCcw,
  Sparkles,
  Calendar as CalendarIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "./theme-context";

interface TabStory {
  id: string;
  icon: React.ReactNode;
  label: string;
  headline: string;
  description: string;
  benefits: string[];
}

interface KanbanCard {
  id: string;
  title: string;
  status: "todo" | "doing" | "done";
  category: "Design" | "Code" | "Marketing";
}

interface WhiteboardShape {
  id: string;
  type: "rectangle" | "circle" | "sticky";
  color: string;
  x: number;
  y: number;
}

export default function ProductShowcase() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "notes" | "kanban" | "calendar" | "whiteboard" | "ai">("dashboard");
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Tab Story Details (Left Column Content)
  const stories: TabStory[] = [
    {
      id: "dashboard",
      icon: <LayoutGrid className="h-4 w-4" />,
      label: "Smart Dashboard",
      headline: "A bird's eye view of your entire focus",
      description: "Everyday Tracker unifies your agenda in a single command center. View upcoming meetings, track task velocities, and log active workspace documents.",
      benefits: [
        "Aggregate files by workspaces folders",
        "Monitor task progression percentages",
        "Keep calendar reminders in focus view",
      ],
    },
    {
      id: "notes",
      icon: <FileText className="h-4 w-4" />,
      label: "Notes Editor",
      headline: "Block notes meets real-time database inputs",
      description: "Draft code files, store specifications, format block structures, and adjust headers. Ask the built-in assistant to expand or rewrite documents instantly.",
      benefits: [
        "Notion-style markdown shortcuts",
        "AI text expansion on selection",
        "Syntax highlighting for development",
      ],
    },
    {
      id: "kanban",
      icon: <Trello className="h-4 w-4" />,
      label: "Kanban Board",
      headline: "Scale task workflows visual and direct",
      description: "Manage milestones, toggle priorities, assign items to teammates, and write direct comment threads inside task cards.",
      benefits: [
        "Seamless columns shift triggers",
        "Assigned task status filter categories",
        "Custom metadata tags setup",
      ],
    },
    {
      id: "calendar",
      icon: <CalendarIcon className="h-4 w-4" />,
      label: "Calendar Sync",
      headline: "Unify your scheduling and project timelines",
      description: "Track standing meetings, coordinate sprint durations, and schedule task reminder timelines directly alongside notes and Kanban pipelines.",
      benefits: [
        "Multi-calendar import integration",
        "Inline task scheduling triggers",
        "Automatic standup notification times",
      ],
    },
    {
      id: "whiteboard",
      icon: <Compass className="h-4 w-4" />,
      label: "Visual Whiteboard",
      headline: "Infinite canvas to map project pathways",
      description: "Map design flows, outline database architectures, and collaborate simultaneously with teammates on an infinite canvas.",
      benefits: [
        "Linked flowchart flowchart nodes",
        "Color-coded digital sticky notes",
        "Live blocks multiplayer alignment",
      ],
    },
    {
      id: "ai",
      icon: <Sparkles className="h-4 w-4" />,
      label: "AI Templates",
      headline: "Context-aware assistant and template preset logs",
      description: "Run checklists, write documentation drafts, ask workspace summaries, and create calendar standups using plain language.",
      benefits: [
        "Reads workspace context automatically",
        "Creates database rows in seconds",
        "Reduces manual administrative tasks",
      ],
    },
  ];

  // Notes Mock State
  const [notesText, setNotesText] = useState("This is our landing page spec document.\nWe need to define color palettes, trust badges, and target target personas.");
  const [isTypingNotes, setIsTypingNotes] = useState(false);

  // Kanban Mock State
  const [kanbanCards, setKanbanCards] = useState<KanbanCard[]>([
    { id: "1", title: "Write landing page copy", status: "todo", category: "Marketing" },
    { id: "2", title: "Configure Clerk auth middleware", status: "todo", category: "Code" },
    { id: "3", title: "Mockup whiteboard UI component", status: "doing", category: "Design" },
    { id: "4", title: "Design marketing banner", status: "done", category: "Design" },
  ]);

  // Whiteboard Mock State
  const [whiteboardShapes, setWhiteboardShapes] = useState<WhiteboardShape[]>([
    { id: "s1", type: "rectangle", color: "bg-slate-50 dark:bg-[#0F172A] border-slate-205 dark:border-slate-800 text-slate-700 dark:text-slate-200", x: 30, y: 30 },
    { id: "s2", type: "circle", color: "bg-slate-50 dark:bg-[#0F172A] border-slate-205 dark:border-slate-800 text-slate-700 dark:text-slate-200", x: 200, y: 40 },
    { id: "s3", type: "sticky", color: "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/60 text-blue-700 dark:text-blue-400", x: 100, y: 100 },
  ]);

  // AI Assistant Chat Mock State
  const [messages, setMessages] = useState<Array<{ sender: "user" | "ai"; text: string }>>([
    { sender: "ai", text: "Hello! I am your AI workspace assistant. Ask me to outline documents, summarize projects, or create a calendar reminder." },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);

  const handleRefineNotes = () => {
    if (isTypingNotes) return;
    setIsTypingNotes(true);
    setNotesText("");
    const newText = "⚡ AI EXPANDED SPECIFICATION:\n\n1. DESIGN DIRECTIVE:\n   - Modern Apple/Linear style landing page layout.\n   - Monochromatic styling using scale colors and subtle 1px borders.\n\n2. REUSABLE SECTIONS:\n   - Sticky dynamic Navbar with responsive mobile toggle.\n   - Live Product Showcase sandbox widget.\n   - Pricing plan tiers grid + Monthly/Annual toggles.";
    
    let index = 0;
    const interval = setInterval(() => {
      setNotesText((prev) => prev + newText[index]);
      index++;
      if (index >= newText.length) {
        clearInterval(interval);
        setIsTypingNotes(false);
      }
    }, 12);
  };

  const handleMoveKanban = (id: string, nextStatus: "todo" | "doing" | "done") => {
    setKanbanCards((cards) =>
      cards.map((c) => (c.id === id ? { ...c, status: nextStatus } : c))
    );
  };

  const handleAddShape = (type: "rectangle" | "circle" | "sticky") => {
    const defaultColors = {
      rectangle: "bg-slate-50 dark:bg-[#0F172A] border-slate-205 dark:border-slate-805 text-slate-700 dark:text-slate-200",
      circle: "bg-slate-50 dark:bg-[#0F172A] border-slate-205 dark:border-slate-805 text-slate-700 dark:text-slate-200",
      sticky: "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/60 text-blue-700 dark:text-blue-400",
    };
    const newShape: WhiteboardShape = {
      id: Date.now().toString(),
      type,
      color: defaultColors[type],
      x: Math.floor(Math.random() * 150) + 20,
      y: Math.floor(Math.random() * 80) + 20,
    };
    setWhiteboardShapes((prev) => [...prev, newShape]);
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isAiTyping) return;

    const userText = chatInput;
    setMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setChatInput("");
    setIsAiTyping(true);

    setTimeout(() => {
      let reply = "I can help with that! ";
      if (userText.toLowerCase().includes("task") || userText.toLowerCase().includes("kanban")) {
        reply += "I've drafted a task checklist for you: 1) Outline design assets, 2) Set up API routing structure, 3) Test client integration.";
      } else if (userText.toLowerCase().includes("calendar") || userText.toLowerCase().includes("remind")) {
        reply += "I've set a calendar reminder: 'Team Sync Meeting' scheduled for Monday at 10:00 AM PST.";
      } else {
        reply += "Analyzing workspace files... I recommend setting up a template card to track these items.";
      }

      setMessages((prev) => [...prev, { sender: "ai", text: reply }]);
      setIsAiTyping(false);
    }, 1200);
  };

  const handleResetDemo = () => {
    setKanbanCards([
      { id: "1", title: "Write landing page copy", status: "todo", category: "Marketing" },
      { id: "2", title: "Configure Clerk auth middleware", status: "todo", category: "Code" },
      { id: "3", title: "Mockup whiteboard UI component", status: "doing", category: "Design" },
      { id: "4", title: "Design marketing banner", status: "done", category: "Design" },
    ]);
    setWhiteboardShapes([
      { id: "s1", type: "rectangle", color: "bg-slate-50 dark:bg-[#0F172A] border-slate-205 dark:border-slate-800 text-slate-700 dark:text-slate-200", x: 30, y: 30 },
      { id: "s2", type: "circle", color: "bg-slate-50 dark:bg-[#0F172A] border-slate-205 dark:border-slate-800 text-slate-700 dark:text-slate-200", x: 200, y: 40 },
      { id: "s3", type: "sticky", color: "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/60 text-blue-700 dark:text-blue-400", x: 100, y: 100 },
    ]);
    setNotesText("This is our landing page spec document.\nWe need to define color palettes, trust badges, and target target personas.");
    setMessages([
      { sender: "ai", text: "Hello! I am your AI workspace assistant. Ask me to outline documents, summarize projects, or create a calendar reminder." },
    ]);
  };

  const currentStory = stories.find((s) => s.id === activeTab) || stories[0];

  return (
    <section id="showcase" className="py-12 md:py-28 transition-colors duration-300 bg-white dark:bg-[#050816] text-slate-900 dark:text-white relative border-t border-slate-200 dark:border-slate-900/40">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 md:mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight mb-5"
          >
            Experience the <span className="text-blue-600 dark:text-blue-500">interactive sandbox</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-slate-500 dark:text-slate-400 text-base sm:text-lg"
          >
            Don&apos;t just read about features. Test the actual workspace tools in the interactive playground below.
          </motion.p>
        </div>
        {/* Mobile Stacked Layout (Visible on screens below 1024px) */}
        <div className="lg:hidden flex flex-col gap-6 w-full">
          {stories.map((story) => (
            <div
              key={story.id}
              className={`rounded-3xl border p-5 flex flex-col gap-4 text-left transition-colors ${
                isDark ? "border-slate-850 bg-[#0F172A]/40" : "border-slate-200 bg-slate-50/50"
              }`}
            >
              {/* Card Header (Icon, Label, Title) */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-350">
                    {story.icon}
                  </div>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">{story.label}</span>
                </div>
                <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white mt-1">
                  {story.headline}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
                  {story.description}
                </p>
              </div>

              {/* Screenshot mockup wrapper */}
              <div className={`relative rounded-2xl border p-4 shadow-xs transition-colors ${
                isDark ? "bg-slate-950 border-slate-900" : "bg-white border-slate-150"
              }`}>
                {/* Static Render of Mockups based on story.id */}
                {story.id === "dashboard" && (
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-3 gap-2.5">
                      <div className={`rounded-xl border p-2.5 ${isDark ? "border-slate-900 bg-slate-900/40" : "border-slate-150 bg-slate-50/40"}`}>
                        <span className="text-[8px] uppercase font-bold tracking-wider text-slate-500">Pipeline</span>
                        <p className="text-base font-black mt-0.5 text-blue-600 dark:text-blue-400">75%</p>
                      </div>
                      <div className={`rounded-xl border p-2.5 ${isDark ? "border-slate-900 bg-slate-900/40" : "border-slate-150 bg-slate-50/40"}`}>
                        <span className="text-[8px] uppercase font-bold tracking-wider text-slate-500">Notes</span>
                        <p className="text-base font-black mt-0.5 text-slate-850 dark:text-slate-200">12 Wiki</p>
                      </div>
                      <div className={`rounded-xl border p-2.5 ${isDark ? "border-slate-900 bg-slate-900/40" : "border-slate-150 bg-slate-50/40"}`}>
                        <span className="text-[8px] uppercase font-bold tracking-wider text-slate-500">Canvas</span>
                        <p className="text-base font-black mt-0.5 text-slate-850 dark:text-slate-200">3 Nodes</p>
                      </div>
                    </div>
                    <div className={`rounded-xl border p-3 flex flex-col gap-2.5 ${
                      isDark ? "border-slate-900 bg-slate-900/20" : "border-slate-150 bg-slate-50/20"
                    }`}>
                      <span className="text-[8px] uppercase font-bold text-slate-500">Weekly Focus Hours</span>
                      <div className="flex items-end justify-between gap-2 h-8">
                        {[35, 45, 60, 25, 80, 55, 90].map((h, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                            <div
                              style={{ height: `${h}%` }}
                              className={`w-full rounded-xs ${
                                i === 6 ? "bg-blue-600 dark:bg-blue-500" : isDark ? "bg-slate-805" : "bg-slate-200"
                              }`}
                            ></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {story.id === "notes" && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">spec-doc-final.md</span>
                      <span className="text-[9px] px-2 py-0.5 rounded bg-blue-600/10 border border-blue-500/20 text-blue-600 dark:text-blue-405 font-bold">Spec</span>
                    </div>
                    <div className={`w-full rounded-xl p-3 text-[10.5px] font-sans leading-relaxed border ${
                      isDark ? "bg-slate-900/20 border-slate-900 text-slate-300" : "bg-slate-50 border-slate-150 text-slate-700"
                    }`}>
                      <p className="font-bold text-slate-850 dark:text-white mb-1.5">⚡ DESIGN DIRECTIVE:</p>
                      <p>• Modern Apple/Linear style landing page layout.</p>
                      <p>• Monochromatic styling using scale colors and subtle 1px borders.</p>
                      <p className="mt-1.5 text-blue-600 dark:text-blue-400 font-bold">✓ Refined with Everyday AI</p>
                    </div>
                  </div>
                )}

                {story.id === "kanban" && (
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between border-b pb-2 text-[8px] text-slate-400 uppercase font-black">
                      <span>Tasks Pipeline</span>
                      <span>Progress Status</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {[
                        { title: "Write landing page copy", cat: "Marketing", status: "To Do" },
                        { title: "Mockup whiteboard UI component", cat: "Design", status: "Doing" },
                        { title: "Design marketing banner", cat: "Design", status: "Done" },
                      ].map((card, idx) => (
                        <div key={idx} className={`rounded-xl border p-3 flex justify-between items-center ${
                          isDark ? "bg-slate-900 border-slate-850" : "bg-slate-50 border-slate-150"
                        }`}>
                          <div className="flex flex-col gap-1 text-left">
                            <p className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{card.title}</p>
                            <span className="text-[7.5px] w-fit px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold">{card.cat}</span>
                          </div>
                          <span className={`text-[8.5px] font-bold ${
                            card.status === "Done" ? "text-green-600 dark:text-green-400" :
                            card.status === "Doing" ? "text-blue-600 dark:text-blue-400" : "text-slate-450"
                          }`}>{card.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {story.id === "calendar" && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="text-xs font-bold text-slate-750 dark:text-slate-200">Daily Agenda</span>
                      <span className="text-[9px] text-slate-400">June 2026</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {[
                        { time: "09:00 AM", title: "Product Spec Review", type: "Sync" },
                        { time: "10:00 AM", title: "Weekly Team Standup", type: "Standup" },
                        { time: "02:00 PM", title: "Calculus Study Block", type: "Study" },
                      ].map((item, idx) => (
                        <div key={idx} className={`p-2.5 rounded-xl border flex items-center justify-between font-mono text-[9px] ${
                          isDark ? "border-slate-900 bg-slate-900/30" : "border-slate-150 bg-slate-50"
                        }`}>
                          <div className="flex items-center gap-2">
                            <span className="text-blue-600 dark:text-blue-400 font-bold shrink-0">{item.time}</span>
                            <span className={`font-semibold ${isDark ? "text-slate-200" : "text-slate-800"}`}>{item.title}</span>
                          </div>
                          <span className="text-[7.5px] px-1.5 py-0.5 bg-blue-500/10 text-blue-650 dark:text-blue-400 font-bold rounded">{item.type}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {story.id === "whiteboard" && (
                  <div className="flex flex-col gap-2">
                    <div className="border rounded-xl h-24 relative overflow-hidden bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] bg-[size:10px_10px] flex items-center justify-center gap-2.5 p-2 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-900">
                      <div className="px-2 py-1 border border-blue-400 bg-blue-50/60 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 text-[8px] font-mono rounded shadow-xs font-bold shrink-0">
                        Client App
                      </div>
                      <span className="text-slate-400">⟶</span>
                      <div className="px-2 py-1 border border-slate-200 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-[8px] font-mono rounded shadow-xs font-bold shrink-0">
                        AI Gateway
                      </div>
                      <span className="text-slate-400">⟶</span>
                      <div className="px-2 py-1 border border-blue-400 bg-blue-50/60 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 text-[8px] font-mono rounded shadow-xs font-bold shrink-0">
                        Database
                      </div>
                    </div>
                  </div>
                )}

                {story.id === "ai" && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">AI Template Presets</span>
                      <span className="text-[9px] text-blue-600 dark:text-blue-500 font-bold">Ready</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[8.5px] font-bold font-mono">
                      {[
                        "📝 Spec outline",
                        "📅 Sprint scheduler",
                        "🎨 Wireframe helper",
                        "⚡ GTD matrices",
                      ].map((preset, idx) => (
                        <div key={idx} className={`p-2 rounded-xl border text-left ${
                          isDark ? "border-slate-900 bg-slate-900/40 text-slate-300" : "border-slate-150 bg-slate-50 text-slate-700"
                        }`}>
                          {preset}
                        </div>
                      ))}
                    </div>
                    <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[9px] text-blue-600 dark:text-blue-400 font-mono text-left">
                      ⚡ Prompt: "/use-template GTD system"
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Interactive Layout (Visible on screens 1024px and up) */}
        <div className="hidden lg:grid grid-cols-12 gap-12 items-center max-w-6xl mx-auto">
          
          {/* Left Column: Stories & Tab List */}
          <div className="col-span-12 lg:col-span-5 flex flex-col gap-8 text-left">
            
            {/* Horizontal Tabs selection */}
            <div className={`flex flex-wrap gap-2.5 pb-2 border-b ${isDark ? "border-slate-900" : "border-slate-200"}`}>
              {stories.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveTab(s.id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                    activeTab === s.id
                      ? "bg-slate-100 dark:bg-slate-800 border-slate-205 dark:border-slate-700 text-slate-900 dark:text-slate-100 shadow-xs"
                      : "bg-transparent border-transparent text-slate-500 dark:text-slate-450 hover:text-slate-905 dark:hover:text-slate-205"
                  }`}
                >
                  {s.icon}
                  {s.label}
                </button>
              ))}
            </div>

            {/* Stories Story Text */}
            <div className="min-h-[220px] flex flex-col justify-center gap-4">
              <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-850 dark:text-slate-100">
                {currentStory.headline}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm leading-relaxed">
                {currentStory.description}
              </p>
              
              {/* Checklist */}
              <div className="flex flex-col gap-2.5 mt-3">
                {currentStory.benefits.map((b, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-705 dark:text-slate-300 font-semibold">
                    <span className="text-blue-600 dark:text-blue-500 font-extrabold text-sm shrink-0">✓</span>
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Reset button */}
            <button
              onClick={handleResetDemo}
              className={`flex items-center justify-center gap-2 w-fit px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                isDark 
                  ? "border-slate-800 bg-slate-900/30 text-slate-400 hover:text-white hover:bg-slate-900/60" 
                  : "border-slate-200 bg-white text-slate-650 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <RotateCcw className="h-4 w-4" />
              Reset Demo Sandbox
            </button>
          </div>

          {/* Right Column: Interactive Sandbox Container */}
          <div className="col-span-12 lg:col-span-7">
            <div className={`relative rounded-3xl border p-2.5 shadow-xl transition-colors ${
              isDark ? "border-slate-855 bg-slate-900/20" : "border-slate-200 bg-slate-50/60"
            }`}>
              
              {/* Sandbox Window Frame */}
              <div className={`relative rounded-2xl border p-6 min-h-[360px] flex flex-col justify-between overflow-hidden transition-colors ${
                isDark ? "bg-slate-950 border-slate-900" : "bg-white border-slate-150"
              }`}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ x: 15, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -15, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="flex-1 flex flex-col text-left"
                  >
                    
                    {/* 1. Dashboard Overview Tab */}
                    {activeTab === "dashboard" && (
                      <div className="flex-1 flex flex-col gap-5">
                        <div className={`flex items-center justify-between border-b pb-3 ${
                          isDark ? "border-slate-900" : "border-slate-100"
                        }`}>
                          <h4 className={`font-display text-sm font-bold ${isDark ? "text-slate-200" : "text-slate-805"}`}>Smart Command Center</h4>
                          <span className="text-[10px] text-slate-500">Milestone Hub</span>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div className={`rounded-xl border p-3 ${isDark ? "border-slate-900 bg-slate-900/40" : "border-slate-150 bg-slate-50/40"}`}>
                            <span className="text-[8px] uppercase font-bold tracking-wider text-slate-500">Pipeline</span>
                            <p className="text-xl font-black mt-1 text-blue-600 dark:text-blue-400">75%</p>
                          </div>
                          <div className={`rounded-xl border p-3 ${isDark ? "border-slate-900 bg-slate-900/40" : "border-slate-150 bg-slate-50/40"}`}>
                            <span className="text-[8px] uppercase font-bold tracking-wider text-slate-500">Notes</span>
                            <p className="text-xl font-black mt-1 text-slate-800 dark:text-slate-200">12 Wiki</p>
                          </div>
                          <div className={`rounded-xl border p-3 ${isDark ? "border-slate-900 bg-slate-900/40" : "border-slate-150 bg-slate-50/40"}`}>
                            <span className="text-[8px] uppercase font-bold tracking-wider text-slate-500">Canvas</span>
                            <p className="text-xl font-black mt-1 text-slate-800 dark:text-slate-200">{whiteboardShapes.length} Nodes</p>
                          </div>
                        </div>
                        <div className={`flex-1 min-h-[90px] rounded-xl border p-3 flex flex-col justify-between ${
                          isDark ? "border-slate-900 bg-slate-900/20" : "border-slate-150 bg-slate-50/20"
                        }`}>
                          <span className="text-[8px] uppercase font-bold text-slate-505">Weekly Focus Hours</span>
                          <div className="flex items-end justify-between gap-3 h-10">
                            {[35, 45, 60, 25, 80, 55, 90].map((h, i) => (
                              <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                                <div
                                  style={{ height: `${h}%` }}
                                  className={`w-full rounded-xs transition-all duration-300 ${
                                    i === 6 ? "bg-blue-600 dark:bg-blue-500" : isDark ? "bg-slate-800" : "bg-slate-202"
                                  }`}
                                ></div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 2. Notes Editor Tab */}
                    {activeTab === "notes" && (
                      <div className="flex-1 flex flex-col gap-3">
                        <div className={`flex items-center justify-between border-b pb-3 ${
                          isDark ? "border-slate-900" : "border-slate-105"
                        }`}>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">spec-doc-final.md</span>
                          <button
                            onClick={handleRefineNotes}
                            disabled={isTypingNotes}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-202 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-[10px] font-semibold disabled:opacity-50 cursor-pointer"
                          >
                            {isTypingNotes ? "Expanding..." : "Refine with AI"}
                          </button>
                        </div>
                        <textarea
                          value={notesText}
                          onChange={(e) => setNotesText(e.target.value)}
                          disabled={isTypingNotes}
                          className={`w-full h-44 border rounded-xl p-3 text-xs font-sans focus:outline-none resize-none leading-relaxed transition-colors ${
                            isDark 
                              ? "bg-slate-900/30 text-slate-200 border-slate-900 focus:border-blue-550" 
                              : "bg-slate-50 text-slate-850 border-slate-200 focus:border-blue-550"
                          }`}
                        />
                      </div>
                    )}

                    {/* 3. Kanban Board Tab */}
                    {activeTab === "kanban" && (
                      <div className="flex-1 flex flex-col gap-3">
                        <div className={`flex items-center justify-between border-b pb-2 ${
                          isDark ? "border-slate-900" : "border-slate-100"
                        }`}>
                          <span className={`text-xs font-bold ${isDark ? "text-slate-200" : "text-slate-800"}`}>Marketing Pipeline</span>
                        </div>
                        <div className="grid grid-cols-3 gap-3 flex-1">
                          {["todo", "doing", "done"].map((col) => (
                            <div key={col} className={`rounded-xl border p-2 flex flex-col gap-2 ${
                              isDark ? "border-slate-900 bg-slate-950/40" : "border-slate-150 bg-slate-50/40"
                            }`}>
                              <span className="text-[8px] uppercase font-bold text-slate-505">{col}</span>
                              {kanbanCards
                                .filter((c) => c.status === col)
                                .map((card) => (
                                  <div key={card.id} className={`rounded-lg border p-2 flex flex-col gap-1.5 shadow-xs transition-colors ${
                                    isDark ? "bg-slate-900 border-slate-800/80" : "bg-white border-slate-200"
                                  }`}>
                                    <p className={`text-[9.5px] font-bold leading-normal ${isDark ? "text-slate-200" : "text-slate-850"}`}>{card.title}</p>
                                    <div className="flex justify-between items-center mt-1">
                                      <span className="text-[7.5px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-805 border border-slate-200 dark:border-slate-750 text-slate-500 dark:text-slate-400 font-bold">{card.category}</span>
                                      {col !== "done" ? (
                                        <button
                                          onClick={() => handleMoveKanban(card.id, col === "todo" ? "doing" : "done")}
                                          className="text-[8.5px] text-blue-600 dark:text-blue-405 font-bold cursor-pointer hover:underline"
                                        >
                                          Next →
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => handleMoveKanban(card.id, "doing")}
                                          className="text-[8.5px] text-slate-450 dark:text-slate-505 font-bold cursor-pointer hover:underline"
                                        >
                                          Back
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 4. Calendar Tab */}
                    {activeTab === "calendar" && (
                      <div className="flex-1 flex flex-col gap-3">
                        <div className={`flex items-center justify-between border-b pb-2.5 ${
                          isDark ? "border-slate-900" : "border-slate-100"
                        }`}>
                          <span className={`text-xs font-bold ${isDark ? "text-slate-200" : "text-slate-800"}`}>Everyday Timelines</span>
                          <span className="text-[10px] text-slate-500 font-mono font-semibold">June 2026</span>
                        </div>
                        <div className="grid grid-cols-7 gap-1.5 text-center text-[9px] font-bold text-slate-400 font-mono">
                          <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
                        </div>
                        <div className="grid grid-cols-7 gap-1.5 text-center text-[9px] font-mono">
                          {[...Array(30)].map((_, i) => {
                            const day = i + 1;
                            const isToday = day === 8;
                            const hasEvent = day === 8 || day === 12 || day === 20;
                            return (
                              <div key={i} className={`py-1.5 rounded-lg border transition-all ${
                                isToday ? "bg-blue-600 text-white border-blue-500 font-bold" :
                                hasEvent ? (isDark ? "bg-blue-950/20 border-blue-900/40 text-blue-405 font-semibold" : "bg-blue-50 border-blue-100 text-blue-600 font-semibold") :
                                isDark ? "border-slate-900 text-slate-500 hover:text-slate-300" : "border-slate-100 text-slate-400 hover:text-slate-900"
                              }`}>
                                {day}
                              </div>
                            );
                          })}
                        </div>
                        <div className={`mt-2 p-2.5 rounded-xl border flex items-center gap-3 font-mono text-[9.5px] ${
                          isDark ? "border-slate-900 bg-slate-900/30" : "border-slate-150 bg-slate-50"
                        }`}>
                          <div className="h-4.5 w-4.5 bg-blue-600 text-white rounded flex items-center justify-center shrink-0 text-[8px] font-black">8</div>
                          <div className="flex-1 text-left">
                            <p className={`font-bold ${isDark ? "text-slate-202" : "text-slate-850"}`}>Weekly Team Standup</p>
                            <p className="text-[8px] text-slate-500 font-semibold">10:00 AM - 10:30 AM • Video Call</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 5. Whiteboard Tab */}
                    {activeTab === "whiteboard" && (
                      <div className="flex-1 flex flex-col gap-3">
                        <div className={`flex items-center justify-between border-b pb-2 ${
                          isDark ? "border-slate-900" : "border-slate-100"
                        }`}>
                          <div className="flex gap-1.5">
                            {["rectangle", "circle", "sticky"].map((sh) => (
                              <button
                                key={sh}
                                onClick={() => handleAddShape(sh as any)}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded text-[9px] font-bold border transition-colors cursor-pointer ${
                                  isDark 
                                    ? "bg-slate-900 border-slate-800 text-slate-350 hover:text-white" 
                                    : "bg-slate-50 border-slate-202 text-slate-700 hover:text-slate-950"
                                }`}
                              >
                                <Plus className="h-3 w-3" /> {sh}
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={() => setWhiteboardShapes([])}
                            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 text-[9px] font-bold cursor-pointer"
                          >
                            Clear
                          </button>
                        </div>
                        <div className={`flex-1 h-36 border rounded-xl relative overflow-hidden transition-colors ${
                          isDark 
                            ? "border-slate-900 bg-slate-950 bg-[radial-gradient(#1e293b_1px,transparent_1px)] bg-[size:12px_12px]" 
                            : "border-slate-200 bg-slate-50 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] bg-[size:12px_12px]"
                        }`}>
                          {whiteboardShapes.map((shape) => (
                            <div
                              key={shape.id}
                              style={{ left: `${shape.x}px`, top: `${shape.y}px` }}
                              className={`absolute border p-1 flex items-center justify-center select-none shadow-sm ${shape.color} ${
                                shape.type === "circle" ? "rounded-full w-14 h-14" :
                                shape.type === "sticky" ? "rounded w-16 h-16 text-[8px]" : "rounded-lg w-20 h-10"
                              }`}
                            >
                              <span className="text-[7.5px] font-bold truncate">Node</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 6. AI Assistant Tab */}
                    {activeTab === "ai" && (
                      <div className="flex-1 flex flex-col gap-3">
                        <div className={`flex-1 h-32 border rounded-xl p-3 flex flex-col gap-2 overflow-y-auto transition-colors ${
                          isDark 
                            ? "bg-slate-900/20 border-slate-900" 
                            : "bg-slate-50/50 border-slate-200"
                        }`}>
                          {messages.map((m, idx) => (
                            <div
                              key={idx}
                              className={`max-w-[85%] rounded-xl p-2.5 text-[10.5px] leading-relaxed ${
                                m.sender === "ai"
                                  ? "bg-blue-50/40 dark:bg-blue-955/20 border border-blue-105 dark:border-blue-900/40 self-start text-slate-800 dark:text-slate-200"
                                  : "bg-slate-100 dark:bg-slate-808 border border-slate-200/50 dark:border-transparent self-end text-slate-700 dark:text-slate-202"
                              }`}
                            >
                              {m.text}
                            </div>
                          ))}
                          {isAiTyping && (
                            <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-805 self-start max-w-[85%] rounded-xl p-2.5 text-[10.5px] text-slate-400 dark:text-slate-500 animate-pulse font-semibold">
                              AI is typing...
                            </div>
                          )}
                        </div>
                        <form onSubmit={handleChatSubmit} className="flex gap-2">
                          <input
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder="Ask me: 'summarize projects' or 'add tasks'"
                            className={`flex-1 border rounded-xl px-3 py-2 text-xs focus:outline-none transition-colors ${
                              isDark 
                                ? "bg-slate-900 border-slate-850 text-slate-202 focus:border-blue-500/50" 
                                : "bg-white border-slate-200 text-slate-800 focus:border-blue-500/50"
                            }`}
                          />
                          <button
                            type="submit"
                            className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-955 text-white rounded-xl px-3.5 flex items-center justify-center cursor-pointer shadow-xs"
                          >
                            <Send className="h-3 w-3" />
                          </button>
                        </form>
                      </div>
                    )}

                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
