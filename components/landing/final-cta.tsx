"use client";

import React from "react";
import { SignUpButton } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { motion } from "framer-motion";

interface FinalCTASectionProps {
  userId: string | null;
}

export default function FinalCTASection({ userId }: FinalCTASectionProps) {
  return (
    <section className="py-24 bg-transparent text-slate-900 dark:text-white relative overflow-hidden">
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Glowing Banner Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65 }}
          className="relative rounded-3xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-[#0F172A]/40 p-8 md:p-16 text-center overflow-hidden shadow-xs group"
        >
          <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center gap-6">
            
            {/* Promo Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 text-[10px] font-black uppercase tracking-wider">
              <span>Start organizing in seconds</span>
            </div>

            {/* Emotional Headline */}
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight text-slate-900 dark:text-white">
              Everything you need. <br />
              <span className="text-blue-600 dark:text-blue-500">
                Nothing you don&apos;t.
              </span>
            </h2>

            {/* Subheadline */}
            <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base max-w-xl">
              Replace your fragmented productivity stack with one intelligent workspace. Maintain momentum with notes, boards, and AI.
            </p>

            {/* CTA Buttons */}
            <div className="mt-4 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              {userId ? (
                <Link
                  href="/dashboard"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-105 dark:hover:bg-white text-white dark:text-slate-950 font-bold text-sm shadow-md transition-all duration-200"
                >
                  Go to Dashboard
                  <ArrowRight className="h-4.5 w-4.5" />
                </Link>
              ) : (
                <SignUpButton mode="modal">
                  <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-950 font-bold text-sm shadow-md transition-all duration-200 cursor-pointer font-sans">
                    Start Free
                    <ArrowRight className="h-4.5 w-4.5" />
                  </button>
                </SignUpButton>
              )}
              <a
                href="#showcase"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-900/80 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white font-semibold text-sm transition-all"
              >
                <Play className="h-4 w-4 fill-current text-blue-600 dark:text-blue-500" />
                Watch Demo
              </a>
            </div>

            <p className="text-slate-450 dark:text-slate-500 text-[10px] font-semibold tracking-wide uppercase mt-4">
              Secure authentication • Encrypted database rows
            </p>

          </div>
        </motion.div>
      </div>
    </section>
  );
}
