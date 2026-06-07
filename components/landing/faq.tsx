"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FAQItem {
  question: string;
  answer: string;
}

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    {
      question: "How does AI work?",
      answer: "Everyday Tracker utilizes advanced contextual AI models. It securely reads the context of your currently open workspace page, note database, or checklist, and generates relevant schedules, summaries, action plans, or visual flows without ever requiring you to copy-paste prompts.",
    },
    {
      question: "Can I collaborate with others?",
      answer: "Yes! Real-time collaboration is fully supported. You can invite team members to any workspace to view and edit together simultaneously. The visual whiteboard shows multiplayer cursors, notes display inline typing indicators, and sprint boards sync task state transitions immediately.",
    },
    {
      question: "Does it support mobile?",
      answer: "Yes. Everyday Tracker is designed to be fully responsive and optimized for mobile browsers across all viewport sizes (from 320px up to 430px+). You can review your daily dashboard, read notes, drag tasks on the pipeline, and run AI commands on the go.",
    },
    {
      question: "Can I export my data?",
      answer: "Absolutely. We believe you should always own your data. You can export your rich notes and documents as Markdown or PDF files, export task lists and project boards as CSV files, and export visual whiteboard canvasses as PNG/SVG diagrams anytime.",
    },
    {
      question: "Is there a free plan?",
      answer: "Yes, we offer a Free plan forever. It includes basic productivity features like simple notes, task boards, calendar integrations, and a limited AI command sandbox. To unlock unlimited project workspaces, whiteboards, custom templates, and premium AI features, you can upgrade to Pro.",
    },
  ];

  return (
    <section id="faq" className="py-12 md:py-28 bg-transparent text-slate-900 dark:text-white relative border-t border-slate-200 dark:border-slate-900/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 md:mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight mb-5 text-slate-900 dark:text-white"
          >
            Frequently asked <span className="text-blue-600 dark:text-blue-500">questions</span>
          </motion.h2>
          <p className="text-slate-500 dark:text-slate-400 text-base sm:text-lg">
            Find answers to common questions about features, pricing, collaboration safety, and AI toolkits.
          </p>
        </div>

        {/* FAQ Accordion List */}
        <div className="max-w-3xl mx-auto flex flex-col gap-3 sm:gap-4.5 px-4 sm:px-0">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-[#0F172A]/40 overflow-hidden transition-all duration-200 hover:border-slate-350 dark:hover:border-slate-800"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full px-4 py-4 sm:px-6 sm:py-5 flex items-center justify-between text-left font-display font-bold text-sm sm:text-base text-slate-750 dark:text-slate-100 hover:text-slate-955 dark:hover:text-white transition-colors cursor-pointer focus:outline-none"
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`h-5 w-5 text-slate-405 dark:text-slate-500 transition-transform duration-305 ${
                      isOpen ? "rotate-180 text-blue-600 dark:text-blue-500" : ""
                    }`}
                  />
                </button>
                
                {/* Smooth Framer Motion Collapse */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                      <div className="px-4 pb-4 sm:px-6 sm:pb-5 text-slate-550 dark:text-slate-400 text-xs sm:text-sm leading-relaxed border-t border-slate-100 dark:border-slate-900/60 pt-4 bg-slate-50/30 dark:bg-slate-955/10">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
