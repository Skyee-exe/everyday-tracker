"use client";

import React, { useState } from "react";
import {
  LayoutGrid,
  Calendar as CalendarIcon,
  Trello,
  FileText,
  PenTool,
  Settings,
  Plus,
  ArrowRight,
  Terminal,
} from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "./theme-context";

export default function FeatureSection() {
  const [completedTask, setCompletedTask] = useState<string | null>(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  
  // Fade-in container parameters
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 20 } },
  };

  return (
    <section id="features" className="py-28 transition-colors duration-300 bg-white dark:bg-[#050816] text-slate-900 dark:text-white relative border-t border-slate-200 dark:border-slate-900/40">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight mb-5 text-slate-900 dark:text-white"
          >
            A workspace designed for{" "}
            <span className="text-blue-600 dark:text-blue-500">
              maximum momentum.
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-slate-500 dark:text-slate-400 text-base sm:text-lg"
          >
            Everyday Tracker consolidates notes, visual boards, calendars, and templates with a contextual AI engine built directly into your database.
          </motion.p>
        </div>

        {/* ── BENTO GRID LAYOUT ── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[220px] md:auto-rows-[250px]"
        >
          
          {/* Card 1: Large Featured - AI Assistant (2 cols, 2 rows) */}
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -2 }}
            className="md:col-span-2 md:row-span-2 rounded-3xl border border-slate-200 dark:border-slate-850 bg-slate-50/50 dark:bg-[#0F172A]/60 p-8 flex flex-col justify-between overflow-hidden relative group shadow-sm hover:border-slate-300 dark:hover:border-slate-800 transition-all duration-200 text-left"
          >
            <div className="max-w-md">
              <div className="flex items-center gap-2 mb-3.5">
                <div className="h-7 w-7 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-350">
                  <Terminal className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">Contextual AI Engine</span>
              </div>
              <h3 className="font-display text-xl sm:text-2xl font-bold mb-2 text-slate-900 dark:text-white">AI assistant with full database context</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm leading-relaxed">
                Chat with an AI that knows your notes, active tasks, and team milestones. Instantly summarize long specs or push project checklists.
              </p>
            </div>

            {/* Realistic AI Conversation UI Mock */}
            <div className="mt-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 flex flex-col gap-3 font-mono text-[10px] w-full self-center rounded-2xl shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-2 mb-1">
                <span className="text-slate-400 dark:text-slate-500 font-bold uppercase text-[8px]">Prompt AI</span>
                <span className="text-blue-600 dark:text-blue-500 font-semibold">Active context</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-150 dark:border-slate-850 text-slate-700 dark:text-slate-300">
                &ldquo;Summarize specs and add a checklist to Kanban board.&rdquo;
              </div>
              <div className="p-3 bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-xl text-slate-800 dark:text-slate-200">
                <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 block mb-1">⚡ AI Copilot:</span>
                I&apos;ve added 3 new tasks to the <span className="text-blue-600 dark:text-blue-400 underline font-bold">Marketing</span> pipeline and set due dates.
              </div>
            </div>
          </motion.div>

          {/* Card 2: Medium Card - Kanban Board (1 col, 2 rows) */}
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -2 }}
            className="md:col-span-1 md:row-span-2 rounded-3xl border border-slate-200 dark:border-slate-850 bg-slate-50/50 dark:bg-[#0F172A]/60 p-6 flex flex-col justify-between overflow-hidden relative group shadow-sm hover:border-slate-300 dark:hover:border-slate-800 transition-all duration-200 text-left"
          >
            <div>
              <div className="flex items-center gap-2 mb-3.5">
                <div className="h-7 w-7 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300">
                  <Trello className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">Kanban Pipeline</span>
              </div>
              <h3 className="font-display text-lg font-bold mb-2 text-slate-900 dark:text-white">Interactive sprint boards</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
                Coordinate project sprint columns, customize categories, and assign tasks with comments.
              </p>
            </div>

            {/* Mini Kanban Board snippet */}
            <div className="mt-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 flex flex-col gap-3 font-mono text-[10px] rounded-2xl shadow-xs">
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-900 pb-1.5 text-[8px] text-slate-400 dark:text-slate-500 uppercase font-black">
                <span>Milestones</span>
                <span>To Do</span>
              </div>
              {[
                { id: "k1", title: "Build canvas integrations", cat: "Code" },
                { id: "k2", title: "Draft launch strategy", cat: "PR" },
              ].map((task) => (
                <div 
                  key={task.id}
                  onClick={() => setCompletedTask(completedTask === task.id ? null : task.id)}
                  className="p-2.5 rounded-lg bg-slate-50 border border-slate-150 dark:bg-slate-900 dark:border-slate-850 hover:border-slate-250 dark:hover:border-slate-750 transition-all cursor-pointer flex items-center justify-between"
                >
                  <span className={`text-[10px] font-bold ${completedTask === task.id ? "line-through text-slate-400 dark:text-slate-500" : "text-slate-800 dark:text-slate-200"}`}>
                    {task.title}
                  </span>
                  <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold border ${
                    completedTask === task.id 
                      ? "bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-900 text-slate-400 dark:text-slate-600" 
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                  }`}>
                    {task.cat}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Card 3: Medium Card - Whiteboard (2 cols, 1 row) */}
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -2 }}
            className="md:col-span-2 rounded-3xl border border-slate-200 dark:border-slate-850 bg-slate-50/50 dark:bg-[#0F172A]/60 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 overflow-hidden relative group shadow-sm hover:border-slate-300 dark:hover:border-slate-800 transition-all duration-200 text-left"
          >
            <div className="max-w-sm shrink-0">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-7 w-7 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300">
                  <PenTool className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">Visual Canvas</span>
              </div>
              <h3 className="font-display text-lg font-bold mb-1.5 text-slate-900 dark:text-white">Infinite collaborative whiteboard</h3>
              <p className="text-slate-550 dark:text-slate-400 text-xs leading-relaxed">
                Sketch flows, map architecture nodes, and place sticky notes on an infinite digital canvas.
              </p>
            </div>

            {/* Mini whiteboard diagram */}
            <div className="flex-1 w-full h-full min-h-[110px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-2xl bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] bg-[size:10px_10px] relative overflow-hidden flex items-center justify-center gap-3 p-3 shadow-inner">
              <div className="px-2.5 py-1.5 rounded border border-blue-300 bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 text-[8px] font-mono shadow-xs font-bold">
                Client Page
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-700">⟶</span>
              <div className="px-2.5 py-1.5 rounded border border-slate-200 bg-slate-50 dark:bg-slate-900 text-slate-750 dark:text-slate-300 text-[8px] font-mono shadow-xs font-bold">
                AI API Routing
              </div>
            </div>
          </motion.div>

          {/* Card 4: Small Card - Calendar Agenda (1 col, 1 row) */}
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -2 }}
            className="md:col-span-1 rounded-3xl border border-slate-200 dark:border-slate-850 bg-slate-50/50 dark:bg-[#0F172A]/60 p-6 flex flex-col justify-between overflow-hidden relative group shadow-sm hover:border-slate-300 dark:hover:border-slate-800 transition-all duration-200 text-left"
          >
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-7 w-7 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300">
                  <CalendarIcon className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">Calendar Sync</span>
              </div>
              <h3 className="font-display text-base font-bold mb-1 text-slate-900 dark:text-white">Schedule & Reminders</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
                Keep standups and due milestones integrated in your dashboard daily.
              </p>
            </div>

            {/* Mini Calendar agenda snippet */}
            <div className="border border-slate-200 dark:border-slate-805 bg-white dark:bg-slate-950 p-2.5 flex items-center gap-2.5 font-mono text-[9px] rounded-xl shadow-xs">
              <div className="border-r border-slate-150 dark:border-slate-850 pr-2.5 text-center font-bold">
                <div className="text-blue-600 dark:text-blue-450 text-[7px] uppercase font-black">MON</div>
                <div className="text-xs text-slate-800 dark:text-slate-100">08</div>
              </div>
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200">Weekly Kickoff</p>
                <p className="text-[8px] text-slate-400 dark:text-slate-500">10:00 AM • Zoom</p>
              </div>
            </div>
          </motion.div>

          {/* Card 5: Small Card - Notes Rich Editor (1 col, 1 row) */}
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -2 }}
            className="md:col-span-1 rounded-3xl border border-slate-200 dark:border-slate-850 bg-slate-50/50 dark:bg-[#0F172A]/60 p-6 flex flex-col justify-between overflow-hidden relative group shadow-sm hover:border-slate-300 dark:hover:border-slate-800 transition-all duration-200 text-left"
          >
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-7 w-7 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300">
                  <FileText className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">Rich Notes</span>
              </div>
              <h3 className="font-display text-base font-bold mb-1 text-slate-900 dark:text-white">Block Note Editor</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
                Write documents with markdown formatting, syntax highlighting, and media blocks.
              </p>
            </div>

            {/* Notes Editor mock preview */}
            <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2.5 flex flex-col gap-1.5 font-mono text-[9px] text-slate-400 rounded-xl shadow-xs">
              <span className="font-bold text-slate-700 dark:text-slate-200"># Project Kickoff Spec</span>
              <div className="h-1 w-full bg-slate-100 dark:bg-slate-900 rounded"></div>
              <div className="h-1 w-4/5 bg-slate-100 dark:bg-slate-900 rounded"></div>
            </div>
          </motion.div>

          {/* Card 6: Small Card - Custom tags (1 col, 1 row) */}
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -2 }}
            className="md:col-span-1 rounded-3xl border border-slate-200 dark:border-slate-850 bg-slate-50/50 dark:bg-[#0F172A]/60 p-6 flex flex-col justify-between overflow-hidden relative group shadow-sm hover:border-slate-300 dark:hover:border-slate-800 transition-all duration-200 text-left"
          >
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-7 w-7 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-705 dark:text-slate-300">
                  <Settings className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">Custom Hubs</span>
              </div>
              <h3 className="font-display text-base font-bold mb-1 text-slate-900 dark:text-white">Custom Categories</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
                Filter documents and checklists by workspace tags to fit your routine.
              </p>
            </div>

            {/* Tag configuration pills mockup */}
            <div className="flex flex-wrap gap-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2.5 font-mono text-[8px] font-bold rounded-xl shadow-xs">
              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Active CRM</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Design Sprint</span>
            </div>
          </motion.div>

        </motion.div>
      </div>
    </section>
  );
}
