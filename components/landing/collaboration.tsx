"use client";

import React, { useEffect, useState } from "react";
import { Users, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "./theme-context";

interface CollaboratorCursor {
  name: string;
  color: string;
  x: number;
  y: number;
  label: string;
  avatar: string;
}

export default function CollaborationSection() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [cursors, setCursors] = useState<CollaboratorCursor[]>([
    { name: "Soham", color: "bg-blue-600 border-blue-500 text-white", x: 120, y: 70, label: "Editing spec...", avatar: "S" },
    { name: "Durgasri", color: "bg-slate-700 border-slate-600 text-white", x: 260, y: 150, label: "Drawing flowchart", avatar: "D" },
    { name: "Lucas", color: "bg-slate-800 border-slate-700 text-white", x: 80, y: 200, label: "Adding task", avatar: "L" },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCursors((prev) =>
        prev.map((c) => {
          // Wander cursor coordinate slightly
          const dx = Math.floor(Math.random() * 31) - 15;
          const dy = Math.floor(Math.random() * 31) - 15;
          let newX = c.x + dx;
          let newY = c.y + dy;
          if (newX < 20) newX = 20;
          if (newX > 320) newX = 320;
          if (newY < 20) newY = 20;
          if (newY > 210) newY = 210;
          return { ...c, x: newX, y: newY };
        })
      );
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-28 transition-colors duration-300 bg-white dark:bg-[#050816] text-slate-900 dark:text-white relative border-t border-slate-200 dark:border-slate-900/40 overflow-hidden">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Column Left: Visual Canvas representing multiplayer */}
          <motion.div
            initial={{ opacity: 0, x: -15 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className={`relative rounded-3xl border p-2.5 shadow-xl transition-colors ${
              isDark ? "border-slate-850 bg-slate-900/20" : "border-slate-200 bg-slate-50/60"
            }`}
          >
            {/* Mock Collaborative Board */}
            <div className={`relative rounded-2xl border p-6 min-h-[300px] overflow-hidden transition-colors ${
              isDark 
                ? "bg-slate-950 border-slate-900 bg-[radial-gradient(#1e293b_1px,transparent_1px)] bg-[size:20px_20px]" 
                : "bg-white border-slate-150 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] bg-[size:20px_20px]"
            }`}>
              
              {/* Fake Note / Box 1 */}
              <div className={`absolute left-6 top-8 w-44 p-3.5 rounded-xl border text-left transition-colors ${
                isDark 
                  ? "border-blue-900/30 bg-blue-950/20" 
                  : "border-blue-500/20 bg-blue-50/40 shadow-xs"
              }`}>
                <span className="text-[8px] uppercase font-bold text-blue-600 dark:text-blue-400 font-mono">Document Spec</span>
                <p className={`text-[10px] font-bold mt-1 ${isDark ? "text-slate-100" : "text-slate-900"}`}>Sprint 12 Specifications</p>
                <div className={`h-1.5 w-16 rounded mt-3 ${isDark ? "bg-slate-800" : "bg-slate-100"}`}></div>
                <div className={`h-1.5 w-24 rounded mt-1.5 ${isDark ? "bg-slate-800" : "bg-slate-100"}`}></div>
              </div>

              {/* Fake Shape 2 */}
              <div className={`absolute right-8 top-16 w-28 p-3 rounded-full border flex items-center justify-center text-center shadow-xs transition-colors ${
                isDark 
                  ? "border-slate-800 bg-slate-900/40 text-slate-350" 
                  : "border-slate-200 bg-slate-50/60 text-slate-700 font-semibold text-xs"
              }`}>
                <span>Whiteboard Hub</span>
              </div>

              {/* Fake comment thread */}
              <div className={`absolute right-10 bottom-6 w-48 p-3 rounded-xl border text-[10px] leading-relaxed shadow-lg text-left transition-colors ${
                isDark 
                  ? "border-slate-800 bg-slate-950" 
                  : "border-slate-205 bg-white shadow"
              }`}>
                <div className={`flex items-center gap-1 pb-1.5 border-b mb-1.5 ${isDark ? "border-slate-850" : "border-slate-100"}`}>
                  <MessageSquare className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                  <span className={`font-bold ${isDark ? "text-slate-200" : "text-slate-800"}`}>Discussion</span>
                </div>
                <p className={isDark ? "text-slate-405" : "text-slate-600"}>
                  <span className="font-bold text-blue-600 dark:text-blue-400">Durgasri:</span> Added details.
                </p>
              </div>

              {/* Animated Floating Cursors */}
              {cursors.map((cursor, idx) => (
                <div
                  key={idx}
                  style={{ left: `${cursor.x}px`, top: `${cursor.y}px` }}
                  className="absolute transition-all duration-1000 ease-out pointer-events-none flex flex-col items-start gap-1 z-35 animate-none"
                >
                  {/* Cursor pointer arrow */}
                  <svg
                    className={`h-4 w-4 drop-shadow-sm ${
                      cursor.name === "Soham" ? "fill-blue-500 text-blue-500" : "fill-slate-600 text-slate-600"
                    }`}
                    viewBox="0 0 24 24"
                  >
                    <path d="M2.01 2.01v14.19l3.82-3.82 2.76 6.45 2.51-1.07-2.76-6.45 4.93-.1z" />
                  </svg>
                  {/* Cursor Label tag */}
                  <div className={`px-2 py-0.5 rounded text-[8px] font-bold border ${cursor.color} flex items-center gap-1 shadow`}>
                    <span>{cursor.name}</span>
                    {cursor.label && <span className="opacity-75 font-normal block truncate max-w-[80px]">{cursor.label}</span>}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Column Right: Description Copy */}
          <motion.div
            initial={{ opacity: 0, x: 15 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="order-1 lg:order-2 flex flex-col gap-6 text-left"
          >
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
              <Users className="h-6 w-6" />
            </div>
            
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
              Real-time synchronization, <span className="text-blue-600 dark:text-blue-500">powered by Liveblocks</span>
            </h2>
            
            <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed">
              Experience seamless collaboration with your colleagues. See instant text typing indicators, active cursor movements on whiteboards, and feedback logs directly embedded on Kanban tasks.
            </p>

            <div className="flex flex-col gap-4 border-t border-slate-200 dark:border-slate-900 pt-6">
              <div className="flex items-start gap-3">
                <div className={`h-6 w-6 rounded border flex items-center justify-center text-xs shrink-0 mt-0.5 font-bold ${
                  isDark ? "bg-slate-900 border-slate-800 text-blue-400" : "bg-slate-100 border-slate-200 text-blue-600"
                }`}>✓</div>
                <div>
                  <h4 className="font-display text-sm font-bold text-slate-800 dark:text-slate-200">Active Presence Indicators</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-405 mt-1">See exactly who is browsing the workspace and which notes are currently open.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className={`h-6 w-6 rounded border flex items-center justify-center text-xs shrink-0 mt-0.5 font-bold ${
                  isDark ? "bg-slate-900 border-slate-800 text-blue-400" : "bg-slate-100 border-slate-200 text-blue-600"
                }`}>✓</div>
                <div>
                  <h4 className="font-display text-sm font-bold text-slate-800 dark:text-slate-200">Shared Interactive Kanban</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-405 mt-1">Drag task blocks across columns and see updates sync instantly for every teammate.</p>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
