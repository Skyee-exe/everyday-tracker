"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Sparkles,
  Calendar,
  Kanban,
  NotebookPen,
  PenTool,
  BookOpen,
  Wand2,
  ListChecks,
  Wallet,
  Utensils,
  BarChart3,
  Target,
  Settings2,
  Zap,
  Bell,
  HelpCircle,
  ChevronDown,
  Search,
  ChevronUp,
  Menu,
  X,
} from "lucide-react";
import CommandPalette from "./command-palette";
import { useNotifications } from "./notifications/NotificationContext";
import WorkspaceSwitcher from "./workspaces/WorkspaceSwitcher";
import { useWorkspace } from "./workspaces/WorkspaceProvider";
import { useUser } from "@clerk/nextjs";

/* ─────────────────── Types ─────────────────── */
interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  badge?: string;
}

interface NavGroup {
  groupLabel: string;
  items: NavItem[];
}

interface GeneratedSidebarApp {
  id: number;
  appName: string;
  description: string;
  icon: string;
  color: string;
}

/* ─────────────────── Nav Config ─────────────────── */
const NAV_GROUPS: NavGroup[] = [
  {
    groupLabel: "General",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, color: "#2563eb", bg: "rgba(37,99,235,0.1)" },
    ],
  },
  {
    groupLabel: "Intelligence",
    items: [
      { label: "AI Templates", href: "/dashboard/ai-templates", icon: Wand2, color: "#7c3aed", bg: "rgba(124,58,237,0.1)" },
    ],
  },
  {
    groupLabel: "Workspace",
    items: [
      { label: "Calendar", href: "/dashboard/calendar", icon: Calendar, color: "#2563eb", bg: "rgba(37,99,235,0.1)" },
      { label: "Tasks", href: "/dashboard/tasks", icon: Kanban, color: "#dc2626", bg: "rgba(220,38,38,0.1)", badge: "5" },
      { label: "Notes", href: "/dashboard/notes", icon: NotebookPen, color: "#0891b2", bg: "rgba(8,145,178,0.1)" },
      { label: "Whiteboard", href: "/dashboard/whiteboard", icon: PenTool, color: "#0ea5e9", bg: "rgba(14,165,233,0.1)" },
    ],
  },
  {
    groupLabel: "Content",
    items: [
      { label: "Pages & Spaces", href: "/dashboard/pages", icon: BookOpen, color: "#1d4ed8", bg: "rgba(29,78,216,0.1)" },
    ],
  },
];

const BOTTOM_ITEMS: NavItem[] = [
  { label: "Settings", href: "/dashboard/settings", icon: Settings2, color: "#64748b", bg: "rgba(100,116,139,0.1)" },
];

const GENERATED_ICON_MAP: Record<string, React.ElementType> = {
  Sparkles,
  Calendar,
  ListChecks,
  Wallet,
  BookOpen,
  Utensils,
  BarChart3,
  Target,
};



/* ─────────────────── Tooltip ─────────────────── */
function Tooltip({ children }: { label: string; children: React.ReactNode }) {
  return <>{children}</>;
}

/* ─────────────────── Nav Item ─────────────────── */
function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Tooltip label={item.label}>
      <Link
        href={item.href}
        className={`sb-nav-item${active ? " sb-nav-item--active" : ""}`}
        style={{ "--item-color": item.color, "--item-bg": item.bg } as React.CSSProperties}
      >
        <span className="sb-nav-icon">
          <Icon size={16} strokeWidth={active ? 2.2 : 1.8} />
        </span>
        <span className="sb-nav-label">{item.label}</span>
        {item.badge && (
          <span
            className="sb-badge"
            style={isNaN(Number(item.badge))
              ? { background: item.color }
              : { background: "rgba(100,116,139,0.15)", color: "#64748b" }}
          >
            {item.badge}
          </span>
        )}
      </Link>
    </Tooltip>
  );
}

/* ─────────────────── Main Sidebar ─────────────────── */
export default function Sidebar() {
  const [cmdOpen, setCmdOpen] = useState(false);
  const [logoOpen, setLogoOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [generatedApps, setGeneratedApps] = useState<GeneratedSidebarApp[]>([]);
  const pathname = usePathname();
  const { unreadCount, isOpen, setIsOpen } = useNotifications();
  const { activeWorkspace } = useWorkspace();
  const { user } = useUser();

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  /* Ctrl+K */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "k") { e.preventDefault(); setCmdOpen((o) => !o); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    let alive = true;
    const fetchApps = () => {
      fetch("/api/ai-templates/apps")
        .then((response) => response.json())
        .then((data) => {
          if (alive && Array.isArray(data.apps)) setGeneratedApps(data.apps);
        })
        .catch(() => {
          if (alive) setGeneratedApps([]);
        });
    };

    fetchApps();

    const handleUpdate = () => {
      fetchApps();
    };

    window.addEventListener("sidebar-update", handleUpdate);

    return () => {
      alive = false;
      window.removeEventListener("sidebar-update", handleUpdate);
    };
  }, [pathname]);

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href) && (href === "/dashboard/ai-templates" ? !/^\/dashboard\/ai-templates\/\d+/.test(pathname) : true));

  return (
    <>
      {/* Sticky Mobile Header */}
      <header className="sb-mobile-header">
        <button
          className="sb-mobile-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation drawer"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div className="sb-mobile-brand">
          <div className="sb-logo" style={{ width: 22, height: 22 }}>
            <Zap size={12} fill="currentColor" strokeWidth={0} className="sb-logo-zap" />
          </div>
          <span className="sb-mobile-title">Everyday</span>
        </div>

        <div className="sb-mobile-right">
          <button
            className="sb-mobile-notif-btn"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && <span className="sb-notif-dot" />}
          </button>
        </div>
      </header>

      {/* Backdrop overlay for mobile drawer */}
      {mobileOpen && (
        <div
          className="sb-mobile-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`sb-root${mobileOpen ? " sb-root--mobile-open" : ""}`}
      >

        {/* ── Top Section ── */}
        <div className="sb-top-section flex flex-col shrink-0">
          {/* Logo / Header */}
          <div className="sb-header" style={{ position: "relative" }}>
            <button
              className={`sb-brand-btn${logoOpen ? " sb-brand-btn--open" : ""}`}
              onClick={() => setLogoOpen((o) => !o)}
              aria-label="Open workspace menu"
              aria-expanded={logoOpen}
            >
              {/* Animated logo mark */}
              <div className="sb-logo">
                <Zap size={15} fill="currentColor" strokeWidth={0} className="sb-logo-zap" />
                {/* Pulse ring */}
                <span className="sb-logo-pulse" />
              </div>

              <div className="sb-brand-text">
                <span className="sb-brand-name">Everyday</span>
                <span className="sb-brand-sub">Workspace</span>
              </div>

              <ChevronUp
                size={13}
                className="sb-brand-chevron"
                strokeWidth={2}
                style={{ transform: logoOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 200ms" }}
              />
            </button>

            {/* Close button inside mobile drawer */}
            <button
              className="sb-mobile-close-btn"
              onClick={() => setMobileOpen(false)}
              aria-label="Close sidebar drawer"
            >
              <X size={16} />
            </button>

            {/* Logo Dropdown */}
            {logoOpen && (
              <WorkspaceSwitcher onClose={() => setLogoOpen(false)} />
            )}
          </div>

          {/* Search */}
          <Tooltip label="Search (Ctrl+K)">
            <button className="sb-search" onClick={() => setCmdOpen(true)} aria-label="Open search (Ctrl+K)">
              <Search size={13} className="sb-search-icon" strokeWidth={2} />
              <span className="sb-search-text">Search...</span>
              <div className="sb-search-kbd-group">
                <span className="sb-search-kbd">Ctrl</span>
                <span className="sb-search-kbd">K</span>
              </div>
            </button>
          </Tooltip>
        </div>

        {/* ── Main Navigation ── */}
        <nav className="sb-nav">
          {NAV_GROUPS.map((group) => (
            <div key={group.groupLabel} className="sb-group">
              <p className="sb-group-label">{group.groupLabel}</p>
              <div className="sb-group-divider" />
              {group.items.map((item) => (
                <NavLink key={item.href} item={item} active={isActive(item.href)} />
              ))}
            </div>
          ))}

          {(generatedApps.length > 0 || pathname.startsWith("/dashboard/ai-templates")) && (
            <div className="sb-group">
              <p className="sb-group-label">Generated Apps</p>
              <div className="sb-group-divider" />
              {generatedApps.map((app) => {
                const Icon = GENERATED_ICON_MAP[app.icon] ?? Sparkles;
                const appHref = `/dashboard/ai-templates/${app.id}`;
                return (
                  <NavLink
                    key={app.id}
                    item={{
                      label: app.appName,
                      href: appHref,
                      icon: Icon,
                      color: app.color,
                      bg: `${app.color}1a`,
                    }}
                    active={isActive(appHref)}
                  />
                );
              })}
              {generatedApps.length >= 3 && (
                <div className="sb-limit-badge">
                  3 app limit reached
                </div>
              )}
            </div>
          )}
        </nav>

        {/* ── Spacer ── */}
        <div className="sb-spacer flex-1" style={{ flex: 1 }} />

        {/* ── Bottom Section ── */}
        <div className="sb-bottom-section flex flex-col shrink-0">
          <div className="sb-bottom-actions" style={{ borderTop: "1px solid var(--sb-border)", flexShrink: 0 }}>
            {BOTTOM_ITEMS.map((item) => (
              <NavLink key={item.href} item={item} active={isActive(item.href)} />
            ))}
            
            <Tooltip label="Notifications">
              <button
                className={`sb-nav-item${isOpen ? " sb-nav-item--active" : ""}`}
                onClick={() => setIsOpen(!isOpen)}
                style={{
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  position: "relative",
                }}
              >
                <span className="sb-nav-icon"><Bell size={16} strokeWidth={1.8} /></span>
                <span className="sb-nav-label">Notifications</span>
                {unreadCount > 0 && (
                  <span
                    className="sb-badge"
                    style={{ background: "#2563eb", color: "#ffffff", marginLeft: "auto" }}
                  >
                    {unreadCount}
                  </span>
                )}
                {unreadCount > 0 && <span className="sb-notif-dot sb-notif-dot--abs" />}
              </button>
            </Tooltip>

            <NavLink
              item={{
                label: "Help & Docs",
                href: "/dashboard/help",
                icon: HelpCircle,
                color: "#64748b",
                bg: "rgba(100,116,139,0.1)",
              }}
              active={isActive("/dashboard/help")}
            />
          </div>

          {/* Profile & Collapse Toggle */}
          <div className="sb-profile-wrap" style={{ flexShrink: 0 }}>
            <button className="sb-profile" onClick={() => setLogoOpen((o) => !o)} type="button">
              <div className="sb-avatar" style={{ padding: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {user?.imageUrl ? (
                  <img src={user.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  (user?.fullName || user?.primaryEmailAddress?.emailAddress || "U").slice(0, 1).toUpperCase()
                )}
              </div>
              <div className="sb-profile-info">
                <span className="sb-profile-name">{user?.fullName || user?.primaryEmailAddress?.emailAddress || "Soham"}</span>
                <span className="sb-profile-plan">{activeWorkspace?.plan ? `${activeWorkspace.plan} workspace` : "Free workspace"}</span>
              </div>
              <ChevronDown size={13} className="sb-profile-chevron" strokeWidth={2} />
            </button>
          </div>
        </div>
      </aside>

      <CommandPalette isOpen={cmdOpen} onClose={() => setCmdOpen(false)} />
    </>
  );
}
