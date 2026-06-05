"use client";

import React, { useRef } from "react";
import { SignUpButton } from "@clerk/nextjs";
import Link from "next/link";
import {
  ArrowRight,
  Play,
  CheckCircle,
  FileText,
  Calendar as CalendarIcon,
  Layers,
  Users,
  Compass,
  Star,
  Activity,
  ArrowUpRight,
} from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useTheme } from "./theme-context";

interface HeroSectionProps {
  userId: string | null;
}

export default function HeroSection({ userId }: HeroSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  
  // Parallax scroll effect for floating dashboard layers
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const mainY = useTransform(scrollYProgress, [0, 1], [0, 15]);
  const leftFloatY = useTransform(scrollYProgress, [0, 1], [0, -10]);
  const rightFloatY = useTransform(scrollYProgress, [0, 1], [0, -8]);
  const farFloatY = useTransform(scrollYProgress, [0, 1], [0, -12]);

  return (
    <section 
      ref={containerRef}
      className={`relative pt-32 pb-24 md:pt-40 md:pb-36 overflow-hidden transition-colors duration-300 ${
        isDark ? "bg-[#050816] text-white" : "bg-white text-slate-900"
      }`}
    >
      {/* Grid Overlay */}
      <div className={`absolute inset-0 bg-[size:4.5rem_4.5rem] opacity-[0.04] pointer-events-none ${
        isDark 
          ? "bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)]"
          : "bg-[linear-gradient(to_right,#0f1624_1px,transparent_1px),linear-gradient(to_bottom,#0f1624_1px,transparent_1px)]"
      }`}></div>
      
      {/* Noise Texture Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.012] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      ></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* ── HERO TEXT CONTENT ── */}
        <div className="text-center max-w-5xl mx-auto">
          {/* Trust/Category badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider mb-6 ${
              isDark 
                ? "border-slate-800 bg-slate-900/60 text-slate-400" 
                : "border-slate-200 bg-slate-50 text-slate-500"
            }`}
          >
            <span>The Operating System For Modern Work</span>
          </motion.div>

          {/* Large Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
            className="font-display text-[42px] leading-[1.05] sm:text-[64px] sm:leading-[1.02] md:text-[80px] font-semibold tracking-tight mb-8"
          >
            One Workspace. Every Tool. <br className="hidden sm:inline" />
            <span className="text-blue-600 dark:text-blue-505">
              Powered by AI.
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className={`text-base sm:text-lg max-w-3xl mx-auto mb-10 font-normal leading-relaxed ${
              isDark ? "text-slate-400" : "text-slate-500"
            }`}
          >
            Replace your fragmented productivity stack. Organize project trackers, notes, infinite canvases, and team calendars in a unified workspace with a contextual AI assistant.
          </motion.p>

          {/* Call to Action buttons */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4.5 mb-10"
          >
            {userId ? (
              <Link
                href="/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4.5 rounded-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-950 font-bold text-sm shadow-md transition-all duration-200"
              >
                Go to Dashboard
                <ArrowRight className="h-4.5 w-4.5" />
              </Link>
            ) : (
              <SignUpButton mode="modal">
                <button className={`w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4.5 rounded-full font-bold text-sm shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer ${
                  isDark ? "bg-slate-100 hover:bg-white text-slate-950" : "bg-slate-900 hover:bg-slate-800 text-white"
                }`}>
                  Start for Free
                  <ArrowRight className="h-4.5 w-4.5" />
                </button>
              </SignUpButton>
            )}
            <a
              href="#showcase"
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4.5 rounded-full border text-sm font-bold transition-all duration-200 ${
                isDark 
                  ? "border-slate-800 bg-slate-900/40 text-slate-350 hover:text-white hover:bg-slate-900/80" 
                  : "border-slate-205 bg-white text-slate-650 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Play className="h-4 w-4 fill-current text-blue-600 dark:text-blue-500" />
              Watch Demo
            </a>
          </motion.div>

          {/* ── Social Proof Row ── */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className={`flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 mb-20 text-xs ${
              isDark ? "text-slate-500" : "text-slate-400"
            }`}
          >
            {/* User Avatars List */}
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2.5">
                {["#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"].map((bg, idx) => (
                  <div 
                    key={idx} 
                    style={{ backgroundColor: bg }}
                    className={`h-7 w-7 rounded-full flex items-center justify-center text-[9px] font-black text-white border ${
                      isDark ? "border-[#050816]" : "border-white"
                    }`}
                  >
                    {["F", "S", "C", "T", "P"][idx]}
                  </div>
                ))}
              </div>
              <span className={`font-semibold ${isDark ? "text-slate-405" : "text-slate-650"}`}>
                10,000+ workspaces created
              </span>
            </div>

            <span className={`hidden sm:block ${isDark ? "text-slate-800" : "text-slate-200"}`}>|</span>

            {/* Stars rating */}
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className={`font-semibold ${isDark ? "text-slate-405" : "text-slate-650"}`}>
                Rated by early users
              </span>
            </div>

            <span className={`hidden sm:block ${isDark ? "text-slate-800" : "text-slate-200"}`}>|</span>

            <span className={`font-semibold ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              Built for teams & individuals
            </span>
          </motion.div>
        </div>

        {/* ── DASHBOARD SHOWCASE (Layered Parallax Mockup) ── */}
        <div className="relative mx-auto max-w-5xl px-4 md:px-0">
          
          {/* Main Central Dashboard Frame */}
          <motion.div
            style={{ y: mainY }}
            className={`relative rounded-2xl border p-2 shadow-xl z-20 group transition-colors duration-300 ${
              isDark 
                ? "border-slate-850 bg-[#090d16] shadow-[#030610]/50" 
                : "border-slate-200/80 bg-slate-50/50 shadow-slate-100"
            }`}
          >
            <div className={`relative rounded-xl border overflow-hidden h-[300px] sm:h-[400px] md:h-[480px] grid grid-cols-12 transition-colors duration-300 ${
              isDark ? "bg-[#0b111e] border-slate-900" : "bg-white border-slate-150"
            }`}>
              {/* Internal Sidebar Mock */}
              <div className={`col-span-3 border-r p-3 hidden md:flex flex-col gap-4 transition-colors duration-300 ${
                isDark ? "border-slate-900 bg-[#0a0f1b]/60" : "border-slate-200/40 bg-slate-50/60"
              }`}>
                <div className="flex items-center gap-1.5 px-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                </div>
                <div className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border text-[10px] font-bold transition-colors ${
                  isDark ? "bg-slate-900/60 border-slate-800 text-slate-350" : "bg-white border-slate-200 text-slate-700"
                }`}>
                  <div className="h-5.5 w-5.5 rounded-lg bg-blue-600 flex items-center justify-center text-[9px] font-bold text-white shadow">E</div>
                  <span>Smart Workspace</span>
                </div>
                <div className={`flex flex-col gap-1 text-[11px] px-1 ${
                  isDark ? "text-slate-400" : "text-slate-500"
                }`}>
                  <div className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-colors ${
                    isDark ? "bg-slate-900 border-slate-800 text-slate-200" : "bg-slate-100 border-slate-200 text-slate-800"
                  }`}>
                    <Layers className="h-4 w-4 text-blue-600 dark:text-blue-500" />
                    <span>Command Hub</span>
                  </div>
                  <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg">
                    <FileText className="h-4 w-4 text-slate-400" />
                    <span>Notes Wiki</span>
                  </div>
                  <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-slate-400" />
                    <span>Sprint Board</span>
                  </div>
                </div>
              </div>

              {/* Main Content Area Mock */}
              <div className="col-span-12 md:col-span-9 p-4 flex flex-col justify-between">
                {/* Header */}
                <div className={`flex items-center justify-between pb-3.5 border-b ${
                  isDark ? "border-slate-900" : "border-slate-150"
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black font-mono">Workspace</span>
                    <span className="text-slate-400 text-xs">/</span>
                    <span className={`text-xs font-bold ${isDark ? "text-slate-300" : "text-slate-705"}`}>Command Center</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-1.5">
                      <span className={`h-5 w-5 rounded-full text-[8px] font-black flex items-center justify-center border ${
                        isDark ? "bg-slate-800 border-[#0b111e] text-slate-200" : "bg-slate-200 border-white text-slate-800"
                      }`}>S</span>
                      <span className={`h-5 w-5 rounded-full text-[8px] font-black flex items-center justify-center border ${
                        isDark ? "bg-slate-700 border-[#0b111e] text-slate-200" : "bg-slate-100 border-white text-slate-800"
                      }`}>L</span>
                    </div>
                    <span className="text-[9px] text-slate-450 dark:text-slate-500 font-semibold">Live sync</span>
                  </div>
                </div>

                {/* Dashboard Widgets */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 overflow-hidden">
                  <div className={`rounded-xl border p-4 ${
                    isDark ? "border-slate-900 bg-slate-950/40" : "border-slate-200 bg-slate-50/40"
                  }`}>
                    <p className="text-[10px] uppercase font-black tracking-wider text-slate-500">Pipeline Performance</p>
                    <p className={`text-3xl font-black mt-1.5 ${isDark ? "text-white" : "text-slate-900"}`}>88%</p>
                    <div className={`h-1.5 w-full rounded-full mt-3 overflow-hidden ${
                      isDark ? "bg-slate-900" : "bg-slate-200"
                    }`}>
                      <div className="h-full w-[88%] bg-blue-600 dark:bg-blue-500 rounded-full"></div>
                    </div>
                  </div>
                  <div className={`rounded-xl border p-4 ${
                    isDark ? "border-slate-900 bg-slate-950/40" : "border-slate-200 bg-slate-50/40"
                  }`}>
                    <p className="text-[10px] uppercase font-black tracking-wider text-slate-500">Milestone Due</p>
                    <div className={`flex items-center gap-2.5 mt-2 border p-2 rounded-lg ${
                      isDark ? "bg-slate-900/60 border-slate-900" : "bg-white border-slate-150"
                    }`}>
                      <div className="h-4.5 w-4.5 bg-blue-600/10 border border-blue-500/20 text-blue-600 dark:text-blue-500 rounded-md flex items-center justify-center"><Activity className="h-3 w-3" /></div>
                      <span className={`text-xs font-semibold ${isDark ? "text-slate-200" : "text-slate-700"}`}>Release beta app version</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Floating Layers Around Main Dashboard ── */}

          {/* Widget 1: AI Assistant (Floating Top Right) */}
          <motion.div
            style={{ y: rightFloatY }}
            whileHover={{ scale: 1.01, y: -4, zIndex: 30 }}
            className={`absolute -right-6 -top-10 w-64 rounded-xl border p-4 shadow-xl z-20 cursor-pointer hidden md:block transition-colors duration-300 ${
              isDark 
                ? "border-slate-800 bg-[#0F172A]/95" 
                : "border-slate-200 bg-white/95 text-slate-900 shadow-slate-200/40"
            }`}
          >
            <div className={`flex items-center gap-2 pb-2.5 border-b ${isDark ? "border-slate-900" : "border-slate-100"}`}>
              <div className="h-6 w-6 rounded bg-blue-600/10 flex items-center justify-center border border-blue-500/20">
                <Layers className="h-3.5 w-3.5 text-blue-600 dark:text-blue-500" />
              </div>
              <span className={`text-[10px] font-bold ${isDark ? "text-slate-200" : "text-slate-800"}`}>Everyday Assistant</span>
            </div>
            <p className={`text-[10.5px] leading-relaxed mt-2.5 italic ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              &ldquo;Draft a landing page campaign list and schedule task sync for Friday at 3 PM.&rdquo;
            </p>
            <div className="mt-3 py-1.5 px-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[9px] text-blue-600 dark:text-blue-300 font-mono flex items-center justify-between">
              <span>⚡ Generating checklist...</span>
              <span className="text-[8px] bg-blue-500/20 text-blue-600 dark:text-blue-400 font-black px-1 rounded">Tab</span>
            </div>
          </motion.div>

          {/* Widget 2: Notes Editor (Floating Top Left) */}
          <motion.div
            style={{ y: leftFloatY }}
            whileHover={{ scale: 1.01, y: -4, zIndex: 30 }}
            className={`absolute -left-12 -top-4 w-60 rounded-xl border p-4 shadow-xl z-10 cursor-pointer hidden lg:block transition-colors duration-300 ${
              isDark 
                ? "border-slate-800 bg-[#0F172A]/95" 
                : "border-slate-205 bg-white/95 shadow-slate-200/40"
            }`}
          >
            <div className={`flex items-center gap-2 pb-2 border-b ${isDark ? "border-slate-900" : "border-slate-100"}`}>
              <FileText className="h-4 w-4 text-blue-600 dark:text-blue-550" />
              <span className={`text-[10.5px] font-bold ${isDark ? "text-slate-200" : "text-slate-800"}`}>spec-summary.md</span>
            </div>
            <div className="mt-2.5 flex flex-col gap-2">
              <div className={`h-1.5 w-full rounded ${isDark ? "bg-slate-800" : "bg-slate-100"}`}></div>
              <div className={`h-1.5 w-5/6 rounded ${isDark ? "bg-slate-800" : "bg-slate-100"}`}></div>
              <div className={`h-1.5 w-4/6 rounded ${isDark ? "bg-slate-800/60" : "bg-slate-100/60"}`}></div>
            </div>
            <span className="inline-block text-[9px] text-blue-600 dark:text-blue-450 font-semibold mt-3">⚡ Click to refine with AI</span>
          </motion.div>

          {/* Widget 3: Whiteboard Connector (Floating Bottom Left) */}
          <motion.div
            style={{ y: farFloatY }}
            whileHover={{ scale: 1.01, y: -4, zIndex: 30 }}
            className={`absolute -left-8 -bottom-12 w-64 rounded-xl border p-4 shadow-xl z-20 cursor-pointer hidden md:block transition-colors duration-300 ${
              isDark 
                ? "border-slate-800 bg-[#0F172A]/95" 
                : "border-slate-205 bg-white/95 shadow-slate-200/40"
            }`}
          >
            <div className={`flex items-center justify-between pb-2 border-b mb-2 ${isDark ? "border-slate-900" : "border-slate-100"}`}>
              <span className={`text-[10px] font-bold ${isDark ? "text-slate-200" : "text-slate-800"}`}>Miro-style Canvas</span>
              <Compass className="h-4 w-4 text-blue-600 dark:text-blue-500" />
            </div>
            <div className={`h-20 border rounded-lg relative overflow-hidden flex items-center justify-center ${
              isDark 
                ? "border-slate-800 bg-slate-900 bg-[radial-gradient(#1e293b_1px,transparent_1px)] bg-[size:10px_10px]" 
                : "border-slate-150 bg-slate-50 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] bg-[size:10px_10px]"
            }`}>
              <div className="px-2.5 py-1.5 border border-blue-400 bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 text-[8px] font-mono rounded shadow-xs font-bold">
                User Auth Flow
              </div>
            </div>
          </motion.div>

          {/* Widget 4: Kanban Card (Floating Bottom Right) */}
          <motion.div
            style={{ y: rightFloatY }}
            whileHover={{ scale: 1.01, y: -4, zIndex: 30 }}
            className={`absolute -right-10 -bottom-8 w-56 rounded-xl border p-4 shadow-xl z-20 cursor-pointer hidden lg:block transition-colors duration-300 ${
              isDark 
                ? "border-slate-800 bg-[#0F172A]/95" 
                : "border-slate-205 bg-white/95 shadow-slate-200/40"
            }`}
          >
            <div className={`flex items-center justify-between pb-2 border-b mb-2 ${isDark ? "border-slate-900" : "border-slate-100"}`}>
              <span className={`text-[10px] font-bold ${isDark ? "text-slate-200" : "text-slate-800"}`}>Marketing Sprint</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-slate-500" />
            </div>
            <div className={`rounded-lg border p-2.5 ${isDark ? "bg-slate-900 border-slate-800" : "bg-slate-50 border-slate-150"}`}>
              <p className={`text-[10px] font-bold ${isDark ? "text-slate-200" : "text-slate-800"}`}>Design Web Banner</p>
              <div className="flex justify-between items-center mt-2.5">
                <span className="text-[8px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold">Design</span>
                <span className="text-[8px] text-slate-400">S. Patel</span>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
