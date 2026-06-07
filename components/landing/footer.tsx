"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, Github, Twitter, MessageSquare } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const productLinks = [
    { name: "Features", href: "#features" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "Use Cases", href: "#use-cases" },
    { name: "Pricing Plans", href: "#pricing" },
  ];

  const resourceLinks = [
    { name: "Documentation", href: "/docs" },
    { name: "Help Center", href: "/dashboard/help" },
    { name: "API Reference", href: "/docs/api" },
  ];

  const companyLinks = [
    { name: "About Us", href: "/about" },
    { name: "Blog Updates", href: "/blog" },
    { name: "Careers", href: "/careers" },
  ];

  const legalLinks = [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
    { name: "Security Policy", href: "/security" },
  ];

  return (
    <footer className="bg-slate-50 dark:bg-[#050816] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-900 py-12 md:py-16 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-12 gap-8 md:gap-10 mb-12">
          
          {/* Brand Col */}
          <div className="col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-2 flex flex-col items-center lg:items-start text-center lg:text-left gap-4">
            <Link href="/" className="flex items-center gap-2 group w-fit">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 shadow-md shadow-blue-500/10 group-hover:scale-105 transition-transform duration-200">
                <Sparkles className="h-4.5 w-4.5 text-white" />
              </span>
              <span className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                Everyday<span className="text-blue-600 dark:text-blue-400 font-extrabold">.</span>
              </span>
            </Link>
            <p className="text-slate-405 dark:text-slate-500 text-xs sm:text-sm leading-relaxed max-w-sm">
              The unified AI-powered workspace combining notes, whiteboard drawing, Kanban project lists, and calendars into a single, cohesive hub.
            </p>
          </div>

          {/* Product links */}
          <div className="col-span-1 lg:col-span-2 flex flex-col items-center lg:items-start text-center lg:text-left gap-3">
            <h4 className="font-display text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">Product</h4>
            {productLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-xs sm:text-sm hover:text-slate-900 dark:hover:text-white transition-colors duration-155"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Resources Links */}
          <div className="col-span-1 lg:col-span-2 flex flex-col items-center lg:items-start text-center lg:text-left gap-3">
            <h4 className="font-display text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">Resources</h4>
            {resourceLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-xs sm:text-sm hover:text-slate-900 dark:hover:text-white transition-colors duration-155"
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Company Links */}
          <div className="col-span-1 lg:col-span-2 flex flex-col items-center lg:items-start text-center lg:text-left gap-3">
            <h4 className="font-display text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">Company</h4>
            {companyLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-xs sm:text-sm hover:text-slate-900 dark:hover:text-white transition-colors duration-155"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Legal Links */}
          <div className="col-span-1 lg:col-span-2 flex flex-col items-center lg:items-start text-center lg:text-left gap-3">
            <h4 className="font-display text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">Legal</h4>
            {legalLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-xs sm:text-sm hover:text-slate-900 dark:hover:text-white transition-colors duration-155"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Socials */}
          <div className="col-span-1 lg:col-span-2 flex flex-col items-center lg:items-start text-center lg:text-left gap-3">
            <h4 className="font-display text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">Connect</h4>
            <div className="flex gap-3">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-750 transition-colors"
              >
                <Github className="h-4.5 w-4.5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-750 transition-colors"
              >
                <Twitter className="h-4.5 w-4.5" />
              </a>
              <a
                href="https://discord.com"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-750 transition-colors"
              >
                <MessageSquare className="h-4.5 w-4.5" />
              </a>
            </div>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="border-t border-slate-200 dark:border-slate-900 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-xs text-slate-400 dark:text-slate-500">
          <p>© {currentYear} Everyday Tracker. All rights reserved.</p>
          <p>
            Designed and engineered for everyday momentum.
          </p>
        </div>

      </div>
    </footer>
  );
}
