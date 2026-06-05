"use client";

import React, { useState } from "react";
import {
  Award,
  BookOpen,
  Users,
  Video,
  ClipboardList,
  Compass,
} from "lucide-react";

interface UseCase {
  id: string;
  icon: React.ReactNode;
  label: string;
  headline: string;
  description: string;
  benefits: string[];
  mockCard: React.ReactNode;
}

export default function UseCasesSection() {
  const [activeTab, setActiveTab] = useState("founders");

  const useCases: UseCase[] = [
    {
      id: "founders",
      icon: <Award className="h-4 w-4" />,
      label: "Founders",
      headline: "Scale your startup operations in one hub",
      description: "Draft pitch decks, maintain investor trackers, organize product specs, and run quick team standups without jumping across platforms.",
      benefits: [
        "Store specs in Notion-style document wikis",
        "Track investment CRM boards in Kanban",
        "Map architectural pipelines on whiteboards",
        "Summarize feedback with AI assistant insights"
      ],
      mockCard: (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 font-mono text-[11px] h-full flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-900 mb-3">
              <span className="text-slate-400 dark:text-slate-500 font-bold uppercase text-[9px]">Founder CRM Tracker</span>
              <span className="text-blue-600 dark:text-blue-500 font-bold uppercase text-[9px]">Seed Round</span>
            </div>
            <div className="flex flex-col gap-2">
              <div className="p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-850 flex justify-between">
                <span className="text-slate-700 dark:text-slate-300">Y-Combinator Demo prep</span>
                <span className="text-slate-500 dark:text-slate-400 font-bold">Pitch Drafted</span>
              </div>
              <div className="p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-850 flex justify-between">
                <span className="text-slate-700 dark:text-slate-300">Sequoia Capital follow-up</span>
                <span className="text-blue-600 dark:text-blue-500 font-bold">Meeting scheduled</span>
              </div>
            </div>
          </div>
          <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold mt-4">⚡ AI Suggestion: Follow up with warm introductions.</div>
        </div>
      ),
    },
    {
      id: "teams",
      icon: <Users className="h-4 w-4" />,
      label: "Teams & Startups",
      headline: "Unify cross-functional coordination",
      description: "Break down barriers between design and engineering. Work together on canvas sketches while linking spec checklists directly.",
      benefits: [
        "Live multiplayer canvas draws & flowchart wires",
        "Direct inline comment threads on sprint cards",
        "Synced calendars to coordinate due milestones",
        "Live blocks structure keeps states updated"
      ],
      mockCard: (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 p-4 font-mono text-[11px] h-full flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-900 mb-3">
              <span className="text-slate-400 dark:text-slate-500 font-bold uppercase text-[9px]">Team Board Status</span>
              <span className="text-blue-600 dark:text-blue-500 font-bold uppercase text-[9px]">Active Sync</span>
            </div>
            <div className="flex flex-col gap-2">
              <div className="p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-850 flex items-center justify-between">
                <span className="text-slate-700 dark:text-slate-300">UX Review: Whiteboard Sketch</span>
                <div className="flex -space-x-1.5">
                  <span className="h-4.5 w-4.5 rounded-full bg-slate-800 text-[8px] font-bold flex items-center justify-center text-white">S</span>
                  <span className="h-4.5 w-4.5 rounded-full bg-slate-600 text-[8px] font-bold flex items-center justify-center text-white">A</span>
                </div>
              </div>
            </div>
          </div>
          <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold mt-4">✓ 2 collaborators editing note.</div>
        </div>
      ),
    },
    {
      id: "creators",
      icon: <Video className="h-4 w-4" />,
      label: "Creators",
      headline: "Publish consistency with content calendars",
      description: "Manage copywriting drafts, script notes, publication schedules, and post metrics in one visual place.",
      benefits: [
        "Plan layouts in Kanban board columns",
        "Write video scripts in clean document pads",
        "Track publish dates on drag calendar cards",
        "Refine title hooks using AI rephrase prompts"
      ],
      mockCard: (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 p-4 font-mono text-[11px] h-full flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-900 mb-3">
              <span className="text-slate-400 dark:text-slate-500 font-bold uppercase text-[9px]">Content calendar</span>
              <span className="text-blue-650 dark:text-blue-500 font-bold uppercase text-[9px]">YouTube</span>
            </div>
            <div className="flex flex-col gap-2">
              <div className="p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-850 flex justify-between">
                <span className="text-slate-700 dark:text-slate-300">SaaS App Review Video</span>
                <span className="text-slate-500 dark:text-slate-400 font-bold">Scripting</span>
              </div>
            </div>
          </div>
          <div className="text-[10px] text-slate-550 dark:text-slate-400 mt-4">📅 Scheduled: Friday at 2:00 PM</div>
        </div>
      ),
    },
    {
      id: "students",
      icon: <BookOpen className="h-4 w-4" />,
      label: "Students",
      headline: "Supercharge study notes and tracking",
      description: "Consolidate course specs, organize semester syllabi, structure class outlines, and keep deadlines clear.",
      benefits: [
        "Separate folders for individual course notes",
        "Outline diagram mappings on visual boards",
        "Ask AI to summarize complicated research items",
        "List assignments and toggle calendar due times"
      ],
      mockCard: (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 p-4 font-mono text-[11px] h-full flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-900 mb-3">
              <span className="text-slate-400 dark:text-slate-500 font-bold uppercase text-[9px]">Study Guide Syllabus</span>
              <span className="text-blue-650 dark:text-blue-500 font-bold uppercase text-[9px]">Biology</span>
            </div>
            <div className="p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-850">
              <p className="text-slate-700 dark:text-slate-200">🧬 Chapter 4 Summary Notes</p>
              <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded mt-2"></div>
              <div className="h-1.5 w-4/5 bg-slate-200 dark:bg-slate-800 rounded mt-1"></div>
            </div>
          </div>
          <button className="text-[9px] bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 py-1.5 rounded font-bold mt-4">⚡ Summarize Chapters with AI</button>
        </div>
      ),
    },
    {
      id: "pms",
      icon: <ClipboardList className="h-4 w-4" />,
      label: "Project Managers",
      headline: "Deliver complex projects on time",
      description: "Coordinate pipelines, define milestone deadlines, track team velocity, and align contributors on specs.",
      benefits: [
        "Full Kanban sprints customized by assignee",
        "Review calendar blockages and assign status",
        "Generate progress flowcharts automatically",
        "Track milestone metrics and focus stats"
      ],
      mockCard: (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 p-4 font-mono text-[11px] h-full flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-900 mb-3">
              <span className="text-slate-405 dark:text-slate-500 font-bold uppercase text-[9px]">Sprint Roadmap</span>
              <span className="text-blue-650 dark:text-blue-550 font-bold uppercase text-[9px]">Beta Release</span>
            </div>
            <div className="flex flex-col gap-1 text-[10px]">
              <div className="flex items-center justify-between text-slate-705 dark:text-slate-300">
                <span>Database Sync</span>
                <span className="text-blue-600 dark:text-blue-400 font-bold">100%</span>
              </div>
              <div className="flex items-center justify-between text-slate-705 dark:text-slate-300">
                <span>UI Cleanups</span>
                <span className="text-slate-500 dark:text-slate-400 font-bold">45%</span>
              </div>
            </div>
          </div>
          <div className="text-[9px] text-slate-400 dark:text-slate-500 mt-4">🏁 Target: June 15, 2026</div>
        </div>
      ),
    },
    {
      id: "personal",
      icon: <Compass className="h-4 w-4" />,
      label: "Personal Productivity",
      headline: "Streamline your daily life schedule",
      description: "Keep a journal, maintain fitness routines, log finance trackers, and clear daily checklist tasks.",
      benefits: [
        "Daily dashboard highlights due items",
        "Track custom categories like workouts or budget",
        "Write thoughts in simple Notion-style notes",
        "Ask AI to generate workout templates"
      ],
      mockCard: (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 p-4 font-mono text-[11px] h-full flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-900 mb-3">
              <span className="text-slate-405 dark:text-slate-500 font-bold uppercase text-[9px]">Habit Tracker</span>
              <span className="text-blue-650 dark:text-blue-550 font-bold uppercase text-[9px]">Streaks</span>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-slate-705 dark:text-slate-300">
                <span>🏃 5km Morning Run</span>
                <span className="text-blue-600 dark:text-blue-400 font-bold">✓ Done</span>
              </div>
              <div className="flex justify-between items-center text-slate-705 dark:text-slate-300">
                <span>📚 Read 15 pages</span>
                <span className="text-slate-400 dark:text-slate-500">Pending</span>
              </div>
            </div>
          </div>
          <div className="text-[10px] text-blue-650 dark:text-blue-400 font-bold mt-4">🔥 5-day streak active!</div>
        </div>
      ),
    },
  ];

  const activeUseCase = useCases.find((u) => u.id === activeTab) || useCases[0];

  return (
    <section id="use-cases" className="py-24 bg-transparent text-slate-900 dark:text-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-18">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-slate-900 dark:text-white">
            Built for how <span className="text-blue-600 dark:text-blue-500">you work</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-405 text-base sm:text-lg">
            Everyday Tracker adapts to your routine. Select a use case below to see how different people supercharge their productivity.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap justify-center gap-2 mb-12 max-w-4xl mx-auto">
          {useCases.map((uc) => (
            <button
              key={uc.id}
              onClick={() => setActiveTab(uc.id)}
              className={`flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                activeTab === uc.id
                  ? "bg-slate-100 dark:bg-slate-900 border-slate-205 dark:border-slate-750 text-slate-900 dark:text-slate-100 shadow-xs"
                  : "bg-transparent border-transparent text-slate-500 dark:text-slate-450 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {uc.icon}
              {uc.label}
            </button>
          ))}
        </div>

        {/* Outer Presentation Box */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-850 bg-slate-50/50 dark:bg-[#0F172A]/40 p-6 md:p-10 max-w-5xl mx-auto relative overflow-hidden">

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
            
            {/* Description Info */}
            <div className="md:col-span-7 flex flex-col justify-center gap-5">
              <h3 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                {activeUseCase.headline}
              </h3>
              
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                {activeUseCase.description}
              </p>

              {/* Checklists */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                {activeUseCase.benefits.map((b, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-350">
                    <span className="text-blue-600 dark:text-blue-500 font-extrabold text-sm shrink-0">✓</span>
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Interactive Mockup Card */}
            <div className="md:col-span-5 h-[220px] md:h-auto">
              <div className="relative h-full rounded-2xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 p-2 shadow-sm">
                <div className="relative h-full min-h-[180px]">
                  {activeUseCase.mockCard}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
