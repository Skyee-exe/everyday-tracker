"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { UserButton, SignInButton, SignUpButton } from "@clerk/nextjs";
import { Sparkles, Menu, X, ArrowRight, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "./theme-context";

interface NavbarProps {
  userId: string | null;
}

export default function Navbar({ userId }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Features", href: "#features" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "Showcase", href: "#showcase" },
    { name: "Use Cases", href: "#use-cases" },
    { name: "Pricing", href: "#pricing" },
    { name: "FAQ", href: "#faq" },
  ];

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? isDark
            ? "bg-[#050816]/80 backdrop-blur-xl border-b border-slate-900/60 shadow-lg py-3"
            : "bg-white/85 backdrop-blur-xl border-b border-slate-200/60 shadow-sm py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center gap-2.5 group">
              <motion.span 
                whileHover={{ scale: 1.05, rotate: 3 }}
                whileTap={{ scale: 0.95 }}
                className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-md shadow-blue-500/15"
              >
                <span className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                <Sparkles className="h-5 w-5 text-white" />
              </motion.span>
              <span className={`font-display text-xl font-bold tracking-tight transition-colors ${
                isDark ? "text-white" : "text-slate-900"
              }`}>
                Everyday<span className="text-blue-600 dark:text-blue-400 font-extrabold">.</span>
              </span>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <div className={`hidden md:flex items-center gap-2 border rounded-full px-2.5 py-1 backdrop-blur-sm ${
            isDark ? "bg-slate-900/40 border-slate-800/40" : "bg-slate-100 border-slate-200"
          }`}>
            {navLinks.map((link, idx) => (
              <a
                key={link.name}
                href={link.href}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`text-xs font-semibold transition-colors duration-200 relative px-4 py-2 rounded-full ${
                  isDark ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {hoveredIndex === idx && (
                  <motion.span
                    layoutId="navHoverBackdrop"
                    className={`absolute inset-0 rounded-full -z-10 border ${
                      isDark 
                        ? "bg-slate-800/60 border-slate-750/30" 
                        : "bg-white border-slate-200 shadow-xs"
                    }`}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                {link.name}
              </a>
            ))}
          </div>

          {/* Authentication Actions */}
          <div className="hidden md:flex items-center gap-4">
            {/* Theme Toggle Switch */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                isDark 
                  ? "bg-slate-900/40 border-slate-800 text-slate-400 hover:text-white" 
                  : "bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-950"
              }`}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>

            {userId ? (
              <>
                <Link
                  href="/dashboard"
                  className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-950 text-xs font-bold shadow-md hover:shadow-lg transition-all duration-200"
                >
                  Dashboard
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <div className="border-l border-slate-800 pl-4 h-8 flex items-center">
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: `h-9 w-9 rounded-full border transition-colors ${
                          isDark ? "border-slate-850 hover:border-slate-700" : "border-slate-250 hover:border-slate-400"
                        }`,
                      },
                    }}
                  />
                </div>
              </>
            ) : (
              <>
                <SignInButton mode="modal">
                  <button className={`text-xs font-bold transition-colors duration-200 cursor-pointer ${
                    isDark ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
                  }`}>
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <motion.button 
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    className={`px-5 py-2.5 rounded-full text-xs font-bold shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer ${
                      isDark 
                        ? "bg-slate-100 hover:bg-white text-slate-950" 
                        : "bg-slate-900 hover:bg-slate-800 text-white"
                    }`}
                  >
                    Get Started
                  </motion.button>
                </SignUpButton>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-3">
            {/* Mobile Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                isDark 
                  ? "bg-slate-900/40 border-slate-800 text-slate-400" 
                  : "bg-slate-100 border-slate-200 text-slate-600"
              }`}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900/60 focus:outline-none transition-colors duration-255"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className={`md:hidden border-b overflow-hidden ${
              isDark 
                ? "border-slate-800/80 bg-[#090d16]/95 backdrop-blur-xl" 
                : "border-slate-200/80 bg-white/95 backdrop-blur-xl"
            }`}
          >
            <div className="px-4 pt-2 pb-6 space-y-2">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`block px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    isDark 
                      ? "text-slate-400 hover:text-white hover:bg-slate-900/60" 
                      : "text-slate-600 hover:text-slate-950 hover:bg-slate-100"
                  }`}
                >
                  {link.name}
                </a>
              ))}
              <div className={`pt-4 border-t flex flex-col gap-3 px-4 ${
                isDark ? "border-slate-800/80" : "border-slate-200/80"
              }`}>
                {userId ? (
                  <div className="flex items-center justify-between">
                    <Link
                      href="/dashboard"
                      onClick={() => setIsOpen(false)}
                      className="w-full text-center px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-950 text-xs font-bold transition-all duration-200"
                    >
                      Go to Dashboard
                    </Link>
                    <div className="ml-4">
                      <UserButton />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <SignInButton mode="modal">
                      <button
                        onClick={() => setIsOpen(false)}
                        className={`w-full py-3 rounded-xl border text-xs font-bold transition-colors cursor-pointer font-sans ${
                          isDark 
                            ? "border-slate-800 text-slate-400 hover:text-white" 
                            : "border-slate-200 text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Sign In
                      </button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <button
                        onClick={() => setIsOpen(false)}
                        className={`w-full py-3 rounded-xl text-xs font-bold transition-all cursor-pointer font-sans ${
                          isDark 
                            ? "bg-slate-100 hover:bg-white text-slate-950" 
                            : "bg-slate-900 hover:bg-slate-800 text-white"
                        }`}
                      >
                        Sign Up
                      </button>
                    </SignUpButton>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
