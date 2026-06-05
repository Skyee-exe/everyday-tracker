"use client";

import React from "react";
import { SignUpButton } from "@clerk/nextjs";
import Link from "next/link";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

interface PricingSectionProps {
  userId: string | null;
}

export default function PricingSection({ userId }: PricingSectionProps) {
  return (
    <section id="pricing" className="py-28 bg-transparent text-slate-900 dark:text-white relative border-t border-slate-205 dark:border-slate-900/40">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight mb-5 text-slate-900 dark:text-white"
          >
            Simple, <span className="text-blue-600 dark:text-blue-500">transparent pricing</span>
          </motion.h2>
          <p className="text-slate-500 dark:text-slate-400 text-base sm:text-lg">
            Replace multiple productivity apps with one intelligent workspace.
          </p>
        </div>

        {/* Pricing Cards Grid (Exactly 2 Plans) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-3xl mx-auto px-4">
          
          {/* Plan 1: Free */}
          <motion.div
            initial={{ opacity: 0, x: -15 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-3xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-[#0F172A]/40 p-8 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-800 transition-all duration-200 relative group shadow-xs"
          >
            <div>
              <h3 className="font-display text-lg font-bold text-slate-800 dark:text-slate-100">Free</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-2.5 leading-relaxed">
                Essential tools for personal productivity and organization.
              </p>
              
              <div className="my-6 flex items-baseline gap-1">
                <span className="font-display text-4xl font-black text-slate-800 dark:text-white">$</span>
                <span className="font-display text-5xl font-black text-slate-800 dark:text-white">0</span>
                <span className="text-slate-400 dark:text-slate-500 text-xs font-semibold">/mo</span>
              </div>

              <div className="h-px bg-slate-100 dark:bg-slate-900 mb-6"></div>

              <ul className="space-y-4 mb-8">
                {[
                  "Notes Editor",
                  "Tasks & Reminders",
                  "Calendar Sync",
                  "Kanban Boards",
                  "Basic AI Access",
                  "Personal Workspace",
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
                    <Check className="h-4 w-4 text-blue-605 dark:text-blue-500 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              {userId ? (
                <Link
                  href="/dashboard"
                  className="w-full inline-flex items-center justify-center py-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white text-xs font-bold transition-all"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <SignUpButton mode="modal">
                  <button className="w-full inline-flex items-center justify-center py-3.5 rounded-2xl bg-slate-55 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white text-xs font-bold transition-all cursor-pointer font-sans">
                    Start Free
                  </button>
                </SignUpButton>
              )}
            </div>
          </motion.div>

          {/* Plan 2: Pro (Large, solid accent border highlight) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98, x: 15 }}
            whileInView={{ opacity: 1, scale: 1.01, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-3xl border-2 border-blue-600 bg-white dark:bg-[#0F172A]/60 p-8 flex flex-col justify-between relative shadow-lg"
          >
            {/* Most popular badge */}
            <div className="absolute top-0 right-8 -translate-y-1/2 inline-flex items-center gap-1 px-3.5 py-1 rounded-full bg-blue-600 text-[9px] font-black tracking-wider uppercase text-white shadow">
              Most Popular
            </div>

            <div>
              <h3 className="font-display text-lg font-bold text-slate-800 dark:text-slate-100">Pro</h3>
              <p className="text-slate-550 dark:text-slate-400 text-xs mt-2.5 leading-relaxed">
                Supercharged workspace with advanced AI templates and whiteboard canvasses.
              </p>
              
              <div className="my-6 flex items-baseline gap-1">
                <span className="font-display text-4xl font-black text-slate-850 dark:text-white">$</span>
                <span className="font-display text-5xl font-black text-slate-850 dark:text-white">9.99</span>
                <span className="text-slate-400 dark:text-slate-450 text-xs font-semibold">/mo</span>
              </div>

              <div className="h-px bg-slate-150 dark:bg-slate-800/80 mb-6"></div>

              <ul className="space-y-4 mb-8">
                {[
                  "Unlimited Notes",
                  "Unlimited Projects",
                  "Contextual AI Assistant",
                  "Infinite Whiteboard",
                  "AI Custom Templates",
                  "Multiplayer Collaboration",
                  "Priority customer support",
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-xs text-slate-700 dark:text-slate-200">
                    <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span className="font-semibold">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              {userId ? (
                <Link
                  href="/dashboard"
                  className="w-full inline-flex items-center justify-center py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-955 text-xs font-bold transition-all duration-200"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <SignUpButton mode="modal">
                  <button className="w-full inline-flex items-center justify-center py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-955 text-xs font-bold transition-all duration-200 cursor-pointer font-sans">
                    Upgrade to Pro
                  </button>
                </SignUpButton>
              )}
            </div>
          </motion.div>

        </div>

        {/* Future Plans note */}
        <div className="text-center mt-12">
          <p className="text-slate-400 dark:text-slate-500 text-[10px] sm:text-xs font-semibold uppercase tracking-wider">
            Team and Enterprise plans coming soon.
          </p>
        </div>

      </div>
    </section>
  );
}
