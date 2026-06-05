"use client";

import React, { useState, useEffect } from "react";
import {
  Terminal,
  Play,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "./theme-context";

interface AIWorkflowCommand {
  id: string;
  command: string;
  description: string;
  prompt: string;
  steps: Array<{
    type: "task" | "event" | "note" | "board";
    label: string;
    detail: string;
  }>;
}

export default function AIWorkflowsSection() {
  const [activeId, setActiveId] = useState("marketing");
  const [running, setRunning] = useState(false);
  const [visibleStepCount, setVisibleStepCount] = useState(0);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const workflows: AIWorkflowCommand[] = [
    {
      id: "marketing",
      command: "/create launch campaign",
      description: "Setup marketing pipeline, kickoff schedule, specifications wiki, and dev checklist.",
      prompt: "Draft launch campaign pipeline including marketing checklist, calendar, spec notes, and assign sprint board cards.",
      steps: [
        { type: "note", label: "Spec Notes", detail: "Created wiki 'Product Launch Strategy Guide'" },
        { type: "task", label: "Checklist", detail: "Generated 3 tasks: Press kit draft, Web assets, SEO config" },
        { type: "event", label: "Calendar Event", detail: "Scheduled 'Kickoff Meeting' for Mon at 10 AM" },
        { type: "board", label: "Board Card", detail: "Added task card to Marketing Sprint Column" },
      ],
    },
    {
      id: "sprint",
      command: "/setup development sprint",
      description: "Initialize Kanban board sprint cards, database migration alerts, and code cleanup times.",
      prompt: "Create sprint structures with schema push actions, code refactoring milestones, and test checks.",
      steps: [
        { type: "board", label: "Board Setup", detail: "Created board 'Sprint 15 Roadmap'" },
        { type: "task", label: "Checklist", detail: "Added: Drizzle schema push, ESLint cleanup, Unit tests run" },
        { type: "event", label: "Calendar Event", detail: "Scheduled 'Sprint Review' for Friday at 4 PM" },
      ],
    },
    {
      id: "personal",
      command: "/start morning routine",
      description: "Log habit trackers, physical stretch notifications, and daily calendar review outlines.",
      prompt: "Log streaks habits checklists, cardio run reminders, and daily journaling drafts.",
      steps: [
        { type: "task", label: "Habit list", detail: "Created habits: 5k Cardio run, 15 Pages reading, Hydrate" },
        { type: "note", label: "Journal Draft", detail: "Created daily log note page 'Morning Reflection'" },
        { type: "event", label: "Calendar Event", detail: "Scheduled 'Meditation Session' at 7:30 AM" },
      ],
    },
  ];

  const currentWorkflow = workflows.find((w) => w.id === activeId) || workflows[0];

  const handleRunWorkflow = () => {
    if (running) return;
    setRunning(true);
    setVisibleStepCount(0);
  };

  useEffect(() => {
    if (!running) return;

    if (visibleStepCount < currentWorkflow.steps.length) {
      const timer = setTimeout(() => {
        setVisibleStepCount((prev) => prev + 1);
      }, 900);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setRunning(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [running, visibleStepCount, currentWorkflow]);

  useEffect(() => {
    setRunning(false);
    setVisibleStepCount(0);
  }, [activeId]);

  return (
    <section className="py-28 transition-colors duration-300 bg-white dark:bg-[#050816] text-slate-900 dark:text-white relative border-t border-slate-200 dark:border-slate-900/40">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight mb-5"
          >
            AI Command Center
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-slate-500 dark:text-slate-400 text-base sm:text-lg"
          >
            Type slash commands to trigger workflows. Watch the AI auto-generate checklist tables, calendars, and specs inside your databases.
          </motion.p>
        </div>

        {/* Console layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch max-w-6xl mx-auto">
          
          {/* Left Panel: Workflow command lists */}
          <div className="col-span-12 lg:col-span-5 flex flex-col gap-4 text-left">
            <span className="text-[10px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-wider font-mono">Select AI Command</span>
            <div className="flex flex-col gap-3">
              {workflows.map((flow) => (
                <button
                  key={flow.id}
                  onClick={() => setActiveId(flow.id)}
                  className={`flex flex-col items-start gap-2 p-5 rounded-2xl border text-left transition-all cursor-pointer ${
                    activeId === flow.id
                      ? "bg-slate-100 dark:bg-slate-900 border-slate-205 dark:border-slate-800 shadow-xs"
                      : "bg-white border-slate-200 hover:border-slate-300 dark:bg-slate-900/20 dark:border-slate-900/60 dark:hover:border-slate-800/80"
                  }`}
                >
                  <span className={`font-mono text-xs font-bold ${
                    activeId === flow.id 
                      ? "text-blue-600 dark:text-blue-400" 
                      : "text-slate-500 dark:text-slate-400"
                  }`}>
                    {flow.command}
                  </span>
                  <p className="text-slate-500 dark:text-slate-550 text-xs leading-normal">{flow.description}</p>
                </button>
              ))}
            </div>

            {/* Run Button trigger */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleRunWorkflow}
              disabled={running}
              className="mt-2 w-full py-4.5 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Play className="h-4 w-4 fill-current" />
              {running ? "AI Command Executing..." : "Run AI Command"}
            </motion.button>
          </div>

          {/* Right Panel: Simulated Output Screen */}
          <div className="col-span-12 lg:col-span-7">
            <div className={`relative rounded-3xl border p-2.5 shadow-xl h-full transition-colors ${
              isDark ? "border-slate-850 bg-slate-900/20" : "border-slate-200 bg-slate-50/60"
            }`}>
              
              <div className={`relative rounded-2xl border p-6 min-h-[300px] flex flex-col justify-between overflow-hidden h-full transition-colors ${
                isDark ? "bg-slate-950 border-slate-900" : "bg-white border-slate-150"
              }`}>
                
                {/* Header */}
                <div className={`flex items-center justify-between pb-3.5 border-b mb-5 ${
                  isDark ? "border-slate-900" : "border-slate-100"
                }`}>
                  <div className="flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-blue-605 dark:text-blue-400" />
                    <span className="text-[9px] uppercase font-bold tracking-wider font-mono text-slate-400 dark:text-slate-500">Workspace Terminal</span>
                  </div>
                  <span className={`h-1.5 w-1.5 rounded-full ${running ? "bg-blue-600 dark:bg-blue-500 animate-ping" : "bg-slate-300 dark:bg-slate-800"}`}></span>
                </div>

                {/* Prompt box */}
                <div className={`border p-4 rounded-xl mb-4 font-mono text-xs text-left transition-colors ${
                  isDark 
                    ? "bg-[#0b101d] border-slate-850 text-slate-350" 
                    : "bg-slate-50 border-slate-200 text-slate-700"
                }`}>
                  <span className="text-blue-600 dark:text-blue-400 font-bold block text-[9px] uppercase tracking-wide mb-1">⚡ Terminal Input</span>
                  {currentWorkflow.command}
                </div>

                {/* Simulated Response */}
                <div className={`rounded-xl p-4 border min-h-[180px] flex flex-col justify-start gap-3.5 text-left transition-colors ${
                  isDark 
                    ? "bg-slate-950/40 border-slate-900/60" 
                    : "bg-slate-50/40 border-slate-150"
                }`}>
                  
                  {/* Prompt Output Loader */}
                  {!running && visibleStepCount === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 text-xs italic font-semibold">
                      Click &ldquo;Run AI Command&rdquo; to watch the generation.
                    </div>
                  )}

                  {/* Typing/Progress simulation */}
                  {running && visibleStepCount === 0 && (
                    <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 animate-pulse font-mono">
                      Running workspace indexing...
                    </div>
                  )}

                  {/* Render steps one by one */}
                  <AnimatePresence>
                    {currentWorkflow.steps.slice(0, visibleStepCount).map((step, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className={`flex items-start gap-3 p-3 rounded-lg border font-mono text-[10.5px] transition-colors ${
                          isDark 
                            ? "bg-slate-950/60 border-slate-850/60" 
                            : "bg-white border-slate-150 shadow-xs"
                        }`}
                      >
                        <div className="h-5 w-5 rounded bg-blue-600/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">
                          ✓
                        </div>
                        <div>
                          <span className="font-bold block text-[9px] uppercase tracking-wide text-blue-600 dark:text-blue-400">{step.type} created</span>
                          <span className={`${isDark ? "text-slate-300" : "text-slate-700"} mt-1 font-semibold`}>{step.detail}</span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
