"use client";

import React from "react";
import { Folder, Terminal, Share2 } from "lucide-react";
import { motion } from "framer-motion";

export default function HowItWorks() {
  const steps = [
    {
      number: "01",
      icon: <Folder className="h-6 w-6 text-blue-600 dark:text-blue-500" />,
      title: "Organize your workspace",
      description: "Set up spaces for your personal notes, project boards, and team documents. Structure them exactly how your brain works. Organize categories and drag elements with ease.",
      accent: "bg-blue-600 dark:bg-blue-550",
      align: "left",
      visual: (
        <div className="relative h-48 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A]/60 p-4 overflow-hidden flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-2">
            <span className="text-[10px] text-slate-405 dark:text-slate-500 font-bold uppercase tracking-wider font-mono">Workspace Directory</span>
            <span className="h-2 w-2 rounded-full bg-blue-600"></span>
          </div>
          <div className="flex flex-col gap-2 my-2">
            <div className="h-8 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-850 flex items-center justify-between px-3 text-xs text-slate-700 dark:text-slate-350">
              <span className="flex items-center gap-2">📂 Product Design Wiki</span>
              <span className="text-[8px] font-mono text-blue-600 dark:text-blue-450 font-bold border border-blue-500/15 px-1.5 py-0.5 rounded bg-blue-500/5">Space</span>
            </div>
            <div className="h-8 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-850 flex items-center justify-between px-3 text-xs text-slate-700 dark:text-slate-350 pl-6 border-l-2 border-l-blue-600/30">
              <span>📋 Kanban Project Board</span>
              <span className="text-[8px] font-mono text-blue-600 dark:text-blue-450 font-bold border border-blue-500/15 px-1.5 py-0.5 rounded bg-blue-500/5">Board</span>
            </div>
          </div>
          <div className="h-8 rounded-lg bg-slate-50/20 dark:bg-slate-900/40 border border-slate-150 dark:border-slate-850 flex items-center px-3 text-xs text-slate-400 dark:text-slate-500">
            <span>➕ Create new workspace space...</span>
          </div>
        </div>
      ),
    },
    {
      number: "02",
      icon: <Terminal className="h-6 w-6 text-blue-600 dark:text-blue-500" />,
      title: "Let AI help plan and create",
      description: "Type commands to generate checklist pipelines, refine drafts, outline whiteboard diagrams, and automate templates in seconds. The assistant lives inside your database and acts on your context.",
      accent: "bg-blue-600 dark:bg-blue-550",
      align: "right",
      visual: (
        <div className="relative h-48 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A]/60 p-4 overflow-hidden flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-2">
            <span className="text-[10px] text-slate-405 dark:text-slate-500 font-bold uppercase tracking-wider font-mono">AI Task Builder</span>
            <span className="h-2 w-2 rounded-full bg-blue-600"></span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-150 dark:border-slate-850 text-[11px] text-slate-700 dark:text-slate-300 font-mono italic">
            &ldquo;Convert this memo text into a weekly task board with due dates.&rdquo;
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-500/5 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/30 py-2.5 rounded-xl">
            <span>AI is building your pipeline...</span>
          </div>
        </div>
      ),
    },
    {
      number: "03",
      icon: <Share2 className="h-6 w-6 text-blue-600 dark:text-blue-500" />,
      title: "Collaborate and track progress",
      description: "Share workspaces with teams, monitor updates in real-time, comment directly on boards, and work simultaneously. Active cursor tracking ensures sync is immediate and clear.",
      accent: "bg-blue-600 dark:bg-blue-550",
      align: "left",
      visual: (
        <div className="relative h-48 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A]/60 p-4 overflow-hidden flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-2">
            <span className="text-[10px] text-slate-405 dark:text-slate-500 font-bold uppercase tracking-wider font-mono">Collaborative Sync</span>
            <div className="flex -space-x-1.5">
              <span className="h-5 w-5 rounded-full bg-slate-800 border border-white dark:border-[#0F172A] text-[8px] font-bold flex items-center justify-center text-white">S</span>
              <span className="h-5 w-5 rounded-full bg-slate-600 border border-white dark:border-[#0F172A] text-[8px] font-bold flex items-center justify-center text-white">L</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-150 dark:border-slate-850 flex items-center justify-between text-[11px] shadow-xs">
              <span className="text-slate-605 dark:text-slate-350">Soham updated note <span className="font-bold text-slate-850 dark:text-white">Project Specs</span></span>
              <span className="text-slate-400 dark:text-slate-500 text-[9px]">Just now</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-150 dark:border-slate-850 flex items-center justify-between text-[11px] shadow-xs">
              <span className="text-slate-655 dark:text-slate-350">Lucas commented on Kanban item...</span>
              <span className="text-slate-400 dark:text-slate-500 text-[9px]">2m ago</span>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <section id="how-it-works" className="py-12 md:py-28 transition-colors duration-300 bg-white dark:bg-[#050816] text-slate-900 dark:text-white relative border-t border-slate-200 dark:border-slate-900/40">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-24">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight mb-5"
          >
            How it works in <span className="text-blue-600 dark:text-blue-500">3 simple steps</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-slate-500 dark:text-slate-400 text-base sm:text-lg"
          >
            Everyday Tracker simplifies your workflow. Learn how our unified workspace powers you from sketch to checklist resolution.
          </motion.p>
        </div>

        {/* ── TIMELINE Visual Journey ── */}
        <div className="relative max-w-5xl mx-auto">
          
          {/* Vertical Connecting Line */}
          <div className="absolute left-6 md:left-1/2 top-8 bottom-8 w-0.5 bg-slate-200 dark:bg-slate-800 md:-translate-x-1/2 z-0"></div>

          {/* Timeline Steps */}
          <div className="flex flex-col gap-24 md:gap-32">
            {steps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center"
              >
                
                {/* Timeline node dot */}
                <div className="absolute left-6 md:left-1/2 top-4 -translate-x-1/2 z-20 flex items-center justify-center">
                  <div className="h-[22px] w-[22px] md:h-10 md:w-10 rounded-full bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-md">
                    <span className={`h-2 md:h-3 w-2 md:w-3 rounded-full ${step.accent}`}></span>
                  </div>
                </div>

                {/* Left aligned Layout */}
                {step.align === "left" ? (
                  <>
                    {/* Text Column */}
                    <div className="flex flex-col gap-4 text-left pl-12 md:pl-0">
                      <div className="flex items-center justify-between md:justify-start gap-4">
                        <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs shrink-0">
                          {step.icon}
                        </div>
                        <span className="font-display text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-900/40">
                          Step {parseInt(step.number)}
                        </span>
                      </div>
                      <h3 className="font-display text-2xl font-bold text-slate-855 dark:text-slate-100">{step.title}</h3>
                      <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-md">{step.description}</p>
                    </div>

                    {/* Visual Mockup Column */}
                    <div className="relative group pl-12 md:pl-0">
                      <div className="relative border border-slate-200 dark:border-slate-850 rounded-2xl bg-white dark:bg-[#0F172A]/40 overflow-hidden p-2 shadow-xs">
                        {step.visual}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Visual Mockup Column (Alternated on Left for Desktop) */}
                    <div className="order-2 md:order-1 relative group pl-12 md:pl-0">
                      <div className="relative border border-slate-200 dark:border-slate-850 rounded-2xl bg-white dark:bg-[#0F172A]/40 overflow-hidden p-2 shadow-xs">
                        {step.visual}
                      </div>
                    </div>

                    {/* Text Column (Alternated on Right for Desktop) */}
                    <div className="order-1 md:order-2 flex flex-col gap-4 text-left md:pl-10 pl-12">
                      <div className="flex items-center justify-between md:justify-start gap-4">
                        <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs shrink-0">
                          {step.icon}
                        </div>
                        <span className="font-display text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-900/40">
                          Step {parseInt(step.number)}
                        </span>
                      </div>
                      <h3 className="font-display text-2xl font-bold text-slate-855 dark:text-slate-100">{step.title}</h3>
                      <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-md">{step.description}</p>
                    </div>
                  </>
                )}

              </motion.div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
