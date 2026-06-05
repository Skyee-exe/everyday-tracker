"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useTheme } from "./theme-context";

interface StatItem {
  target: number;
  suffix: string;
  label: string;
  color: string;
}

function Counter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!isInView) return;
    
    let startTime: number | null = null;
    const duration = 1500; // 1.5 seconds animation

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * value));
      
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  }, [isInView, value]);

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(0) + "K";
    }
    return num.toString();
  };

  return (
    <span ref={ref} className="font-display font-black tracking-tight">
      {formatNumber(count)}
      {suffix}
    </span>
  );
}

export default function TrustStats() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const stats: StatItem[] = [
    { target: 50000, suffix: "+", label: "Notes Created", color: "text-slate-900 dark:text-slate-100" },
    { target: 120000, suffix: "+", label: "Tasks Managed", color: "text-slate-900 dark:text-slate-100" },
    { target: 15000, suffix: "+", label: "AI Requests Processed", color: "text-slate-900 dark:text-slate-100" },
    { target: 8000, suffix: "+", label: "Workspaces Created", color: "text-slate-900 dark:text-slate-100" },
  ];

  return (
    <section className="py-24 transition-colors duration-300 bg-white dark:bg-[#050816] text-slate-900 dark:text-white relative border-t border-slate-200 dark:border-slate-900/40">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="font-display font-extrabold tracking-widest text-xs text-slate-400 dark:text-slate-500 uppercase"
          >
            Trusted by people building the future
          </motion.h2>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.05 }}
              className={`flex flex-col items-center justify-center p-6 rounded-2xl border relative group shadow-xs transition-all ${
                isDark ? "border-slate-850 bg-[#0F172A]/40" : "border-slate-200 bg-white"
              }`}
            >
              {/* Counter Value */}
              <div className={`text-4xl sm:text-5xl font-black ${stat.color} mb-2`}>
                <Counter value={stat.target} suffix={stat.suffix} />
              </div>
              
              {/* Label */}
              <span className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-semibold text-center">
                {stat.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
