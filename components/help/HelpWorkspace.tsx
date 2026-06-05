"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  X,
  LayoutDashboard,
  Sparkles,
  Calendar,
  Kanban,
  NotebookPen,
  PenTool,
  BookOpen,
  Users,
  Settings2,
  HelpCircle,
  ChevronDown,
  Mail,
  Plus,
  Clock,
  ArrowRight,
} from "lucide-react";

/* ─────────────────── Data Types ─────────────────── */
interface DocSection {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  description: string;
  features: string[];
  steps: string[];
  tips: string;
  comingSoon?: boolean;
}

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

interface QuickLink {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  targetSection: string;
  color: string;
  bg: string;
}

/* ─────────────────── Component ─────────────────── */
export default function HelpWorkspace() {
  const [activeSection, setActiveSection] = useState<string>("getting-started");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [openFaqs, setOpenFaqs] = useState<Record<string, boolean>>({});

  // Collapsible FAQ toggler
  const toggleFaq = (id: string) => {
    setOpenFaqs((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Documentation sections data
  const sections: DocSection[] = useMemo(
    () => [
      {
        id: "getting-started",
        title: "Getting Started",
        icon: HelpCircle,
        description:
          "Welcome to Everyday Workspace! This guide will help you set up your workspace, learn the primary layout, and discover how to organize your day efficiently.",
        features: [
          "Interactive central Dashboard for a daily summary",
          "Seamless sidebar navigation to access all workspaces",
          "Workspace Switcher to separate different project areas",
          "Global Command Palette (Ctrl + K) for rapid page switching",
        ],
        steps: [
          "Visit the Dashboard to get a visual summary of your day's schedule and tasks.",
          "Navigate to the Tasks & Kanban board to start mapping out your items.",
          "Open settings to customize your workspace categories and colors.",
          "Add your first collaborative workspace and start working with team members.",
        ],
        tips: "Press Ctrl + K anywhere in the application to open the Command Palette and navigate rapidly between tools without using your mouse.",
      },
      {
        id: "dashboard",
        title: "Dashboard",
        icon: LayoutDashboard,
        description:
          "The Dashboard is your main cockpit in Everyday Workspace, summarizing your calendar events, task progression, recent notes, and active generated applications in a single premium view.",
        features: [
          "Daily goal progress counter",
          "Upcoming calendar event previews for today",
          "Recent files and notes shortcuts",
          "Dynamic list of custom AI templates and generated apps",
        ],
        steps: [
          "Open the Dashboard tab from the sidebar.",
          "Review the daily goals checklist and calendar agenda cards.",
          "Click on any recent note card to immediately jump into editing.",
          "Access your customized sidebar mini-apps directly from the dashboard lists.",
        ],
        tips: "Review your dashboard first thing in the morning to align on your objectives and see what meetings or deadlines are scheduled.",
      },
      {
        id: "calendar",
        title: "Calendar",
        icon: Calendar,
        description:
          "The Calendar view manages your schedule, calendar events, and time-block tasks. Fully integrated with your reminders and custom categories.",
        features: [
          "Dynamic Month, Week, and Day layouts",
          "Context-aware event categories (work, personal, etc.)",
          "Drag-and-drop planning to reschedule items on the grid",
          "Integrated calendar sync with Tasks & Kanban boards",
        ],
        steps: [
          "Navigate to the Calendar page.",
          "Click the 'New Event' button in the upper right header.",
          "Enter your event title, select its category, and specify the duration.",
          "To adjust timings, simply drag the event block up/down or across dates.",
        ],
        tips: "When creating an item, toggle the 'Type' switch between Task and Reminder to automatically swap the category dropdown options to match.",
      },
      {
        id: "tasks-kanban",
        title: "Tasks & Kanban",
        icon: Kanban,
        description:
          "Manage projects, backlogs, and workflows using dynamic Kanban boards. Complete with real-time multiplayer synchronization and discussion threads.",
        features: [
          "Custom boards and drag-and-drop status columns",
          "Interactive task detail drawers with category tagging",
          "Real-time presence avatars of online collaborators",
          "Inline comment discussion threads for team collaboration",
        ],
        steps: [
          "Open the Tasks & Kanban tab.",
          "Click 'New Task' inside any column to open the task creator.",
          "Add details, assign a category, set the priority, and click save.",
          "Drag and drop task cards across columns as they progress.",
        ],
        tips: "Checking off the completed circle on task cards immediately updates the board progression rates and metrics in the insights header.",
      },
      {
        id: "notes",
        title: "Notes",
        icon: NotebookPen,
        description:
          "A rich document editor designed for clean drafting, dynamic category tagging, sidebar filtering, and inline AI Refine helper utilities.",
        features: [
          "Header category tagging with customizable colors",
          "Sidebar folderless category list filter",
          "Contextual AI Refine text assistant tool",
          "Automatic background saving of notes",
        ],
        steps: [
          "Go to the Notes page.",
          "Click the 'New Note' button to create a blank document.",
          "Assign a category in the editor header for quick organization.",
          "Start writing – the app automatically saves your changes in real-time.",
        ],
        tips: "Select any phrase or block of text in the editor to activate the floating AI Refine menu and translate, rephrase, format, or clean up your text.",
      },
      {
        id: "whiteboards",
        title: "Whiteboards",
        icon: PenTool,
        description:
          "Brainstorm, draw diagrams, sketch ideas, and collaborate visually with your team on an infinite digital canvas.",
        features: [
          "Infinite drawing canvas with pen, shape, and note tools",
          "Multi-user multiplayer visual presence cursors",
          "Configurable colors, strokes, and font styles",
          "Exporting capabilities to save boards as images or PDFs",
        ],
        steps: [
          "Navigate to the Whiteboard page.",
          "Select the brush or shape tool from the top toolbar.",
          "Click and drag on the canvas to draw shapes, lines, or stick notes.",
          "Share the whiteboard link with coworkers to draw together.",
        ],
        tips: "Hold the Shift key while drawing shapes or lines to lock them into clean 45-degree angles or straight paths.",
      },
      {
        id: "pages-spaces",
        title: "Pages & Spaces",
        icon: BookOpen,
        description:
          "Organize large-scale text content, team knowledge bases, wikis, and structured spaces without file system clutter.",
        features: [
          "Collaborative Spaces to group related documentation pages",
          "Nested tree architecture for multi-level child pages",
          "Rich markdown editing support",
          "Full-text search indexing across pages",
        ],
        steps: [
          "Go to the Pages & Spaces page.",
          "Click 'New Space' or select an existing document folder.",
          "Click the '+' button next to a page to nest a sub-page beneath it.",
          "Type content in the editor and invite others to edit live.",
        ],
        tips: "Use Spaces to keep team policies, design guidelines, and personal guides clearly separated from each other.",
      },
      {
        id: "collaboration",
        title: "Collaboration",
        icon: Users,
        description:
          "Work with team members simultaneously. The workspace provides deep multiplayer collaboration across kanbans, whiteboards, and documents.",
        features: [
          "Real-time multiplayer cursors and text updates",
          "Live presence list showing active users in the room",
          "Shared discussion comments and status indicators",
          "Granular roles and permission settings (Viewer vs Editor)",
        ],
        steps: [
          "Open a board, whiteboard, or page that you want to share.",
          "Click the 'Collaborators' button in the upper header.",
          "Type the collaborator's email address and choose their role.",
          "Send the invitation and watch their presence avatar appear.",
        ],
        tips: "Check the badge indicator on cards and folders to quickly see how many active comments or changes occurred while you were offline.",
      },
      {
        id: "ai-assistant",
        title: "AI Assistant",
        icon: Sparkles,
        description:
          "Everyday Workspace is powered by premium AI settings that automate writing tasks and build custom tools. The chat-style AI Assistant is currently in development.",
        features: [
          "AI Refine for notes formatting, summarizing, and translating",
          "AI Template Builder to generate custom productivity tools",
          "Selectable AI models (such as Gemini) in user settings",
          "Conversational AI Assistant (Coming Soon – Stay Tuned!)",
        ],
        steps: [
          "Go to Settings -> AI Settings.",
          "Configure your default model, writing tone, and behavior style.",
          "Select text in any note to trigger inline AI rephrasing.",
          "Use the Template Builder in the sidebar to generate specialized apps.",
        ],
        tips: "You can toggle specific AI tools off in your settings if you prefer a simplified, traditional writing workspace.",
        comingSoon: true,
      },
      {
        id: "account-settings",
        title: "Account & Settings",
        icon: Settings2,
        description:
          "Configure settings, manage billing plans, customize workspace categories, and control data security preferences.",
        features: [
          "Editable Category Scopes to configure global colors and icons",
          "Pro plan subscription management & invoices",
          "Security alerts and email notifications configuration",
          "Workspace data exporter (supports JSON and CSV)",
        ],
        steps: [
          "Click 'Settings' at the bottom of the sidebar menu.",
          "Modify your profile information, subscription status, or notification options.",
          "Scroll to 'Categories' to adjust colors and icons for Note and Calendar tags.",
          "Click save to apply changes globally across your account.",
        ],
        tips: "Renaming a category in the settings page will immediately cascade and update all associated notes and calendar events in real-time.",
      },
    ],
    []
  );

  // FAQ Items
  const faqs: FaqItem[] = useMemo(
    () => [
      {
        id: "faq-task",
        question: "How do I create a task?",
        answer:
          "To create a task, navigate to the Tasks & Kanban page. Choose your active board, then click the 'New Task' button in the top header (or click 'Add a task' at the bottom of any column). Provide a title, choose a category, set the priority, and click 'Create Task'.",
      },
      {
        id: "faq-note",
        question: "How do I restore a deleted note?",
        answer:
          "Currently, note deletion is permanent. Make sure to double-check before confirming deletion. We are planning to release a Trash Bin feature in a future update that will hold deleted notes for 30 days before cleaning them.",
      },
      {
        id: "faq-invite",
        question: "How do I invite collaborators?",
        answer:
          "Open a collaborative space (such as a Kanban board or a Whiteboard) and click the collaborate icon cluster in the header. Enter the email address of the team member you wish to invite, specify their permission level (Editor or Viewer), and click invite.",
      },
      {
        id: "faq-sync",
        question: "How does calendar sync work?",
        answer:
          "When creating or editing a task inside the Kanban Task Drawer, toggle the 'Sync with Calendar' switch. The app automatically pushes a corresponding event onto your Calendar workspace. If you modify dates or times, the sync updates automatically.",
      },
      {
        id: "faq-refine",
        question: "How do I use AI Refine?",
        answer:
          "Open any note in the editor, highlight the text block you wish to edit, and click the 'AI Refine' button that appears on the toolbar. Select a modification (such as rephrasing, translating, or condensing) and apply it to replace the text.",
      },
      {
        id: "faq-categories",
        question: "How do I create custom categories?",
        answer:
          "Open Settings from the sidebar and scroll down to the 'Categories' card. Select the scope (Calendar, Tasks, Notes, or Reminders) and click 'Add Category'. You can customize the name, choose a color swatch, and assign a unique icon.",
      },
      {
        id: "faq-export",
        question: "Can I export my workspace data?",
        answer:
          "Yes. Go to Settings, scroll to the 'Other import settings' card, and locate the data export preference. Select your file type (JSON or CSV) and click 'Export Workspace' to download your database records locally.",
      },
    ],
    []
  );

  // Quick Links
  const quickLinks: QuickLink[] = useMemo(
    () => [
      {
        title: "Getting Started",
        description: "Learn core tools and set up your workspace.",
        icon: HelpCircle,
        targetSection: "getting-started",
        color: "#2563eb",
        bg: "rgba(37,99,235,0.08)",
      },
      {
        title: "Create Your First Task",
        description: "Organize project goals on a Kanban board.",
        icon: Kanban,
        targetSection: "tasks-kanban",
        color: "#dc2626",
        bg: "rgba(220,38,38,0.08)",
      },
      {
        title: "Create Your First Note",
        description: "Draft documents with dynamic tags.",
        icon: NotebookPen,
        targetSection: "notes",
        color: "#0ea5e9",
        bg: "rgba(14,165,233,0.08)",
      },
      {
        title: "Plan Your Week",
        description: "Schedule events and block calendar time.",
        icon: Calendar,
        targetSection: "calendar",
        color: "#7c3aed",
        bg: "rgba(124,58,237,0.08)",
      },
      {
        title: "Invite Collaborators",
        description: "Invite members to edit visual boards.",
        icon: Users,
        targetSection: "collaboration",
        color: "#16a34a",
        bg: "rgba(22,163,74,0.08)",
      },
    ],
    []
  );

  // Search logic
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const query = searchQuery.toLowerCase().trim();

    const matchedSections = sections
      .filter(
        (s) =>
          s.title.toLowerCase().includes(query) ||
          s.description.toLowerCase().includes(query) ||
          s.features.some((f) => f.toLowerCase().includes(query))
      )
      .map((s) => ({
        type: "article",
        id: s.id,
        title: s.title,
        icon: s.icon,
        snippet: s.description,
        comingSoon: s.comingSoon,
      }));

    const matchedFaqs = faqs
      .filter(
        (f) =>
          f.question.toLowerCase().includes(query) ||
          f.answer.toLowerCase().includes(query)
      )
      .map((f) => ({
        type: "faq",
        id: "faq",
        title: f.question,
        icon: HelpCircle,
        snippet: f.answer,
        comingSoon: false,
      }));

    return [...matchedSections, ...matchedFaqs];
  }, [searchQuery, sections, faqs]);

  // Find active section object
  const activeSectionData = useMemo(() => {
    return sections.find((s) => s.id === activeSection) || sections[0];
  }, [activeSection, sections]);

  return (
    <div className="help-container">
      {/* ── Header with Search ── */}
      <header className="help-header">
        <div className="help-title-section">
          <h1>Help & Documentation</h1>
          <p>Learn core features, find step-by-step guides, and search answers to common questions.</p>
        </div>
        <div className="help-search-wrapper">
          <Search size={16} className="help-search-icon" />
          <input
            type="text"
            className="help-search-input"
            placeholder="Search docs, features, FAQs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="help-search-clear"
              onClick={() => setSearchQuery("")}
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </header>

      {/* ── Quick Links Grid (Hide when search results are showing) ── */}
      {!searchQuery && activeSection === "getting-started" && (
        <section className="help-section-block">
          <h3>Quick Links</h3>
          <div className="help-quicklinks-grid">
            {quickLinks.map((link, i) => {
              const Icon = link.icon;
              return (
                <button
                  key={i}
                  className="help-quicklink-card"
                  onClick={() => setActiveSection(link.targetSection)}
                >
                  <div
                    className="help-quicklink-icon-wrapper"
                    style={{ color: link.color, background: link.bg }}
                  >
                    <Icon size={18} />
                  </div>
                  <h4>{link.title}</h4>
                  <p>{link.description}</p>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Main Workspace Layout ── */}
      <div className="help-workspace-grid">
        {/* Left Navigation Sidebar */}
        <aside className="help-sidebar">
          {sections.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id && !searchQuery;
            return (
              <button
                key={sec.id}
                className={`help-nav-item${isActive ? " help-nav-item--active" : ""}`}
                onClick={() => {
                  setActiveSection(sec.id);
                  setSearchQuery("");
                }}
              >
                <Icon size={15} />
                <span>{sec.title}</span>
                {sec.comingSoon && (
                  <span className="help-badge-soon">Soon</span>
                )}
              </button>
            );
          })}
          {/* FAQ Shortcut Button */}
          <button
            className={`help-nav-item${activeSection === "faq" && !searchQuery ? " help-nav-item--active" : ""}`}
            onClick={() => {
              setActiveSection("faq");
              setSearchQuery("");
            }}
          >
            <HelpCircle size={15} />
            <span>FAQs</span>
          </button>
        </aside>

        {/* Content Area */}
        <main className="help-content-card">
          {/* SEARCH RESULTS VIEW */}
          {searchQuery && searchResults && (
            <div>
              <div className="help-section-header">
                <h2>Search Results</h2>
                <p className="help-search-results-header">
                  Showing {searchResults.length} results matching &quot;{searchQuery}&quot;
                </p>
              </div>

              {searchResults.length > 0 ? (
                <div className="help-search-results-list">
                  {searchResults.map((res, idx) => (
                    <button
                      key={idx}
                      className="help-search-result-item"
                      onClick={() => {
                        if (res.id === "faq") {
                          setActiveSection("faq");
                        } else {
                          setActiveSection(res.id);
                        }
                        setSearchQuery("");
                      }}
                    >
                      <h3>
                        <res.icon size={16} style={{ color: "#2563eb" }} />
                        {res.title}
                        {res.comingSoon && (
                          <span className="help-badge-soon">Soon</span>
                        )}
                      </h3>
                      <p>{res.snippet}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="help-search-no-results">
                  <p>No documentation found for &quot;{searchQuery}&quot;</p>
                  <span>Try searching for other terms like calendar, note, task, categories, or collaborate.</span>
                </div>
              )}
            </div>
          )}

          {/* NORMAL TAB CONTENT */}
          {!searchQuery && activeSection !== "faq" && activeSectionData && (
            <>
              {/* Section Header */}
              <div className="help-section-header">
                <h2>
                  {activeSectionData.title}
                  {activeSectionData.comingSoon && (
                    <span className="help-badge-soon" style={{ marginLeft: "12px", verticalAlign: "middle" }}>
                      Coming Soon
                    </span>
                  )}
                </h2>
                <p>{activeSectionData.description}</p>
              </div>

              {/* Key Features */}
              <div className="help-section-block">
                <h3>Key Features</h3>
                <ul className="help-features-list">
                  {activeSectionData.features.map((feature, idx) => (
                    <li key={idx}>{feature}</li>
                  ))}
                </ul>
              </div>

              {/* Step-by-Step Guide */}
              <div className="help-section-block">
                <h3>Step-by-Step Guide</h3>
                <ol className="help-steps-list">
                  {activeSectionData.steps.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </div>

              {/* Tips & Tricks */}
              <div className="help-tip-box">
                <strong>Tip:</strong> {activeSectionData.tips}
              </div>
            </>
          )}

          {/* FAQ SECTION CONTENT */}
          {!searchQuery && activeSection === "faq" && (
            <div>
              <div className="help-section-header">
                <h2>Frequently Asked Questions</h2>
                <p>Quick answers to common questions about workflows, categories, and account synchronization.</p>
              </div>

              <div className="help-faq-list" style={{ marginTop: "20px" }}>
                {faqs.map((faq) => {
                  const isExpanded = !!openFaqs[faq.id];
                  return (
                    <div
                      key={faq.id}
                      className={`help-faq-item${isExpanded ? " help-faq-item--expanded" : ""}`}
                    >
                      <button
                        className="help-faq-trigger"
                        onClick={() => toggleFaq(faq.id)}
                        aria-expanded={isExpanded}
                      >
                        <span>{faq.question}</span>
                        <ChevronDown size={15} className="help-faq-chevron" />
                      </button>
                      <div className="help-faq-content">
                        <p>{faq.answer}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* persistent Contact Support bottom section */}
          <div className="help-support-card">
            <h3>Need more help?</h3>
            <p>Our support team is here to assist. If you didn&apos;t find what you were looking for, reach out to us directly.</p>
            <a
              href="mailto:support@everydayworkspace.com?subject=Everyday Workspace Support Request"
              className="help-support-btn"
            >
              <Mail size={15} />
              Email Support
            </a>
          </div>
        </main>
      </div>
    </div>
  );
}
