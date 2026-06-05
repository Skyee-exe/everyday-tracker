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
      question: "How does the AI Assistant help inside the workspace?",
      answer: "The built-in AI copilot acts as a context-aware assistant. It can read your notes, draft task pipelines, build custom template trackers, structure calendar schedules, and answer questions. Since it connects directly to your notes and kanban, you don't need to copy-paste prompts repeatedly.",
    },
    {
      question: "How does real-time collaboration work?",
      answer: "Our multiplayer backend, built using Liveblocks, synchronizes updates instantly. You'll see real-time cursor pointers of coworkers on the whiteboard canvas, inline typing status indicator bubbles on shared notes, and live state updates as sprint cards shift columns.",
    },
    {
      question: "Can I organize notes like Notion?",
      answer: "Yes! The note editor features rich text block styling similar to Notion. You can customize text sizes, add header tags, highlight content, embed code files, format lists, and sync deadlines directly into your schedule pipeline.",
    },
    {
      question: "Is the visual whiteboard canvas infinite like Miro?",
      answer: "Absolutely. The whiteboard operates on an infinite canvas grid. You can sketch connections, attach visual flowchart wires, add shape nodes, write on sticky notes, and work simultaneously with other team members in real-time.",
    },
    {
      question: "How is the Pricing structured?",
      answer: "We offer two simple plans: Free ($0/mo) for individuals starting out, and Pro ($9.99/mo) which unlocks infinite project spaces, whiteboards, templates, advanced collaboration features, and 500 AI queries.",
    },
    {
      question: "How do you protect my data privacy?",
      answer: "We prioritize security. Your personal databases and notes are fully encrypted in transit and at rest. We use Clerk for secure identity management, and we never share your workspace data or sell it to external companies.",
    },
  ];

  return (
    <section id="faq" className="py-28 bg-transparent text-slate-900 dark:text-white relative border-t border-slate-205 dark:border-slate-900/40">
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
            Frequently asked <span className="text-blue-600 dark:text-blue-500">questions</span>
          </motion.h2>
          <p className="text-slate-500 dark:text-slate-400 text-base sm:text-lg">
            Find answers to common questions about features, pricing, collaboration safety, and AI toolkits.
          </p>
        </div>

        {/* FAQ Accordion List */}
        <div className="max-w-3xl mx-auto flex flex-col gap-4.5">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-[#0F172A]/40 overflow-hidden transition-all duration-200 hover:border-slate-350 dark:hover:border-slate-800"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left font-display font-bold text-sm sm:text-base text-slate-750 dark:text-slate-100 hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer focus:outline-none"
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`h-5 w-5 text-slate-400 dark:text-slate-500 transition-transform duration-300 ${
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
                      <div className="px-6 pb-5 text-slate-500 dark:text-slate-400 text-xs sm:text-sm leading-relaxed border-t border-slate-100 dark:border-slate-900/60 pt-4 bg-slate-50/30 dark:bg-slate-950/10">
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
