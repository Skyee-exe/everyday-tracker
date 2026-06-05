"use client";

import React from "react";
import { Star } from "lucide-react";
import { motion } from "framer-motion";

interface Testimonial {
  name: string;
  role: string;
  company: string;
  quote: string;
  rating: number;
  avatarChar: string;
  avatarBg: string;
  tag: "Founder" | "Student" | "Creator";
}

export default function TestimonialsSection() {
  const testimonials: Testimonial[] = [
    {
      name: "Marcus Vance",
      role: "Founder & CEO",
      company: "Aether AI",
      tag: "Founder",
      quote: "Everyday Tracker replaced three separate monthly subscriptions for us. Our developers sketch workflows on the whiteboard, engineers review specs in notes, and project managers coordinate Kanban boards in one tab. It is a game changer.",
      rating: 5,
      avatarChar: "M",
      avatarBg: "bg-[#0F172A] dark:bg-slate-800",
    },
    {
      name: "Alex Mercer",
      role: "Biology Student",
      company: "Stanford University",
      tag: "Student",
      quote: "Organizing notes by semester course folder spaces and scheduling upcoming lab reports in the calendar hub has completely streamlined my grades. The AI summaries help me understand complex lecture topics.",
      rating: 5,
      avatarChar: "A",
      avatarBg: "bg-[#0F172A] dark:bg-slate-800",
    },
    {
      name: "Clara Reynolds",
      role: "Indie Creator",
      company: "Self-Employed",
      tag: "Creator",
      quote: "I use the Notion-style notes for scripting, the calendar for planning video releases, and the AI Assistant for refining title hooks. Having my entire workflow in one workspace makes consistency ten times easier.",
      rating: 5,
      avatarChar: "C",
      avatarBg: "bg-[#0F172A] dark:bg-slate-800",
    },
  ];

  return (
    <section className="py-28 bg-transparent text-slate-900 dark:text-white relative border-t border-slate-205 dark:border-slate-900/40">
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
            Loved by <span className="text-blue-600 dark:text-blue-500">builders & creatives</span>
          </motion.h2>
          <p className="text-slate-500 dark:text-slate-400 text-base sm:text-lg">
            See how founders, students, and creators organize their routines with Everyday Tracker.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((test, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.05 }}
              className="rounded-3xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-[#0F172A]/40 p-8 flex flex-col justify-between hover:border-slate-350 dark:hover:border-slate-800 transition-all duration-200 shadow-xs"
            >
              <div>
                {/* Rating & Tag */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex gap-0.5">
                    {[...Array(test.rating)].map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-slate-400 dark:fill-slate-500 text-slate-400 dark:text-slate-500" />
                    ))}
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-wider bg-slate-50 dark:bg-slate-900 px-2 py-0.5 rounded text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
                    {test.tag}
                  </span>
                </div>
                {/* Quote */}
                <p className="text-slate-605 dark:text-slate-305 text-xs sm:text-sm leading-relaxed italic mb-6">
                  &ldquo;{test.quote}&rdquo;
                </p>
              </div>

              {/* User Bio */}
              <div className="flex items-center gap-3.5 pt-6 border-t border-slate-150 dark:border-slate-900">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm text-white ${test.avatarBg} shrink-0 border border-slate-200 dark:border-slate-700`}>
                  {test.avatarChar}
                </div>
                <div>
                  <h4 className="font-display text-sm font-bold text-slate-850 dark:text-slate-100">{test.name}</h4>
                  <p className="text-slate-450 dark:text-slate-500 text-[10px] uppercase font-bold tracking-wider mt-0.5">
                    {test.role} • {test.company}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
