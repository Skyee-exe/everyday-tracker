"use client";

import React, { useEffect, useRef, useState } from "react";
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
  ChevronLeft,
  Zap,
  Bell,
  HelpCircle,
  ChevronDown,
  Search,
  Plus,
  Users,
  Check,
  ExternalLink,
  Megaphone,
  ChevronUp,
  Crown,
} from "lucide-react";
import CommandPalette from "./command-palette";

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
      { label: "Tasks & Kanban", href: "/dashboard/tasks", icon: Kanban, color: "#dc2626", bg: "rgba(220,38,38,0.1)", badge: "5" },
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

/* ─────────────────── Workspaces ─────────────────── */
const WORKSPACES = [
  { name: "Soham's Workspace", plan: "Pro", active: true, initial: "S", color: "#2563eb" },
  { name: "Side Projects", plan: "Free", active: false, initial: "SP", color: "#0891b2" },
];

/* ─────────────────── Logo Dropdown ─────────────────── */
function LogoDropdown({ onClose, collapsed }: { onClose: () => void; collapsed: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    setTimeout(() => window.addEventListener("mousedown", handler), 0);
    return () => window.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className={`logo-dropdown${collapsed ? " logo-dropdown--collapsed" : ""}`}
      role="menu"
    >
      {/* Header */}
      <div className="logo-dd-header">
        <div className="logo-dd-ws-name">Soham&apos;s Workspace</div>
        <span className="logo-dd-plan">
          <Crown size={10} fill="currentColor" strokeWidth={0} />
          Pro
        </span>
      </div>

      <div className="logo-dd-divider" />

      {/* Workspaces */}
      <p className="logo-dd-section">Workspaces</p>
      {WORKSPACES.map((ws) => (
        <button key={ws.name} className="logo-dd-item logo-dd-item--ws">
          <span
            className="logo-dd-ws-dot"
            style={{ background: ws.color }}
          >
            {ws.initial}
          </span>
          <div className="logo-dd-ws-info">
            <span className="logo-dd-ws-label">{ws.name}</span>
            <span className="logo-dd-ws-plan">{ws.plan}</span>
          </div>
          {ws.active && <Check size={13} className="logo-dd-check" strokeWidth={2.5} />}
        </button>
      ))}

      <button className="logo-dd-item logo-dd-item--muted">
        <span className="logo-dd-icon-wrap logo-dd-icon-wrap--dashed">
          <Plus size={13} strokeWidth={2.5} />
        </span>
        <span>Add workspace</span>
      </button>

      <div className="logo-dd-divider" />

      {/* Actions */}
      <p className="logo-dd-section">Manage</p>
      <button className="logo-dd-item">
        <span className="logo-dd-icon-wrap" style={{ background: "rgba(37,99,235,0.1)", color: "#2563eb" }}>
          <Users size={13} strokeWidth={1.8} />
        </span>
        <span>Invite members</span>
        <ExternalLink size={11} className="logo-dd-ext" />
      </button>

      <button className="logo-dd-item">
        <span className="logo-dd-icon-wrap" style={{ background: "rgba(124,58,237,0.1)", color: "#7c3aed" }}>
          <Crown size={13} strokeWidth={1.8} />
        </span>
        <span>Upgrade plan</span>
        <span className="logo-dd-badge-tag">Save 30%</span>
      </button>

      <button className="logo-dd-item">
        <span className="logo-dd-icon-wrap" style={{ background: "rgba(14,165,233,0.1)", color: "#0ea5e9" }}>
          <Megaphone size={13} strokeWidth={1.8} />
        </span>
        <span>What&apos;s new</span>
        <span className="logo-dd-new-dot" />
      </button>

      <div className="logo-dd-divider" />

      {/* Footer */}
      <div className="logo-dd-footer">
        <span>Everyday Workspace</span>
        <span>v1.0.0</span>
      </div>
    </div>
  );
}

/* ─────────────────── Tooltip ─────────────────── */
function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="sb-tooltip-wrap">
      {children}
      <div className="sb-tooltip" role="tooltip">{label}</div>
    </div>
  );
}

/* ─────────────────── Nav Item ─────────────────── */
function NavLink({ item, collapsed, active }: { item: NavItem; collapsed: boolean; active: boolean }) {
  const Icon = item.icon;
  const inner = (
    <Link
      href={item.href}
      className={`sb-nav-item${active ? " sb-nav-item--active" : ""}`}
      style={{ "--item-color": item.color, "--item-bg": item.bg } as React.CSSProperties}
    >
      <span className="sb-nav-icon">
        <Icon size={16} strokeWidth={active ? 2.2 : 1.8} />
      </span>
      {!collapsed && (
        <>
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
        </>
      )}
    </Link>
  );
  if (collapsed) return <Tooltip label={item.label}>{inner}</Tooltip>;
  return inner;
}

/* ─────────────────── Main Sidebar ─────────────────── */
export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [logoOpen, setLogoOpen] = useState(false);
  const [generatedApps, setGeneratedApps] = useState<GeneratedSidebarApp[]>([]);
  const pathname = usePathname();

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
      <aside className={`sb-root${collapsed ? " sb-root--collapsed" : ""}`}>

        {/* ── Header ── */}
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

            {!collapsed && (
              <div className="sb-brand-text">
                <span className="sb-brand-name">Everyday</span>
                <span className="sb-brand-sub">Workspace</span>
              </div>
            )}

            {!collapsed && (
              <ChevronUp
                size={13}
                className="sb-brand-chevron"
                strokeWidth={2}
                style={{ transform: logoOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 200ms" }}
              />
            )}
          </button>

          {/* Collapse button — visible on sidebar hover */}
          {!collapsed && (
            <button
              className="sb-collapse-btn"
              onClick={() => setCollapsed(true)}
              aria-label="Collapse sidebar"
            >
              <ChevronLeft size={14} strokeWidth={2} />
            </button>
          )}

          {/* Logo Dropdown */}
          {logoOpen && (
            <LogoDropdown onClose={() => setLogoOpen(false)} collapsed={collapsed} />
          )}
        </div>

        {/* ── Search ── */}
        {!collapsed ? (
          <button className="sb-search" onClick={() => setCmdOpen(true)} aria-label="Open search (Ctrl+K)">
            <Search size={13} className="sb-search-icon" strokeWidth={2} />
            <span className="sb-search-text">Search...</span>
            <div className="sb-search-kbd-group">
              <span className="sb-search-kbd">Ctrl</span>
              <span className="sb-search-kbd">K</span>
            </div>
          </button>
        ) : (
          <Tooltip label="Search (Ctrl+K)">
            <button className="sb-search-icon-btn" onClick={() => setCmdOpen(true)} aria-label="Search">
              <Search size={15} strokeWidth={2} />
            </button>
          </Tooltip>
        )}

        {/* ── Nav ── */}
        <nav className="sb-nav">
          {NAV_GROUPS.map((group) => (
            <div key={group.groupLabel} className="sb-group">
              {!collapsed && <p className="sb-group-label">{group.groupLabel}</p>}
              {collapsed && <div className="sb-group-divider" />}
              {group.items.map((item) => (
                <NavLink key={item.href} item={item} collapsed={collapsed} active={isActive(item.href)} />
              ))}
            </div>
          ))}

          {(generatedApps.length > 0 || pathname.startsWith("/dashboard/ai-templates")) && (
            <div className="sb-group">
              {!collapsed && <p className="sb-group-label">Generated Apps</p>}
              {collapsed && <div className="sb-group-divider" />}
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
                    collapsed={collapsed}
                    active={isActive(appHref)}
                  />
                );
              })}
              {!collapsed && generatedApps.length >= 3 && (
                <div
                  style={{
                    margin: "5px 8px 2px",
                    padding: "7px 8px",
                    borderRadius: 7,
                    background: "rgba(217,119,6,0.09)",
                    color: "#92400e",
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    lineHeight: 1.35,
                  }}
                >
                  3 app limit reached
                </div>
              )}
            </div>
          )}
        </nav>

        {/* ── Bottom ── */}
        <div className="sb-bottom">
          <div className="sb-bottom-actions">
            {BOTTOM_ITEMS.map((item) => (
              <NavLink key={item.href} item={item} collapsed={collapsed} active={isActive(item.href)} />
            ))}
            {!collapsed ? (
              <button className="sb-nav-item" style={{ border: "none", width: "100%", background: "none", cursor: "pointer" }}>
                <span className="sb-nav-icon"><Bell size={16} strokeWidth={1.8} /></span>
                <span className="sb-nav-label">Notifications</span>
                <span className="sb-notif-dot" />
              </button>
            ) : (
              <Tooltip label="Notifications">
                <button className="sb-nav-item" style={{ border: "none", width: "100%", background: "none", cursor: "pointer", position: "relative" }}>
                  <span className="sb-nav-icon"><Bell size={16} strokeWidth={1.8} /></span>
                  <span className="sb-notif-dot sb-notif-dot--abs" />
                </button>
              </Tooltip>
            )}
            {!collapsed ? (
              <button className="sb-nav-item" style={{ border: "none", width: "100%", background: "none", cursor: "pointer" }}>
                <span className="sb-nav-icon"><HelpCircle size={16} strokeWidth={1.8} /></span>
                <span className="sb-nav-label">Help & Docs</span>
              </button>
            ) : (
              <Tooltip label="Help & Docs">
                <button className="sb-nav-item" style={{ border: "none", width: "100%", background: "none", cursor: "pointer" }}>
                  <span className="sb-nav-icon"><HelpCircle size={16} strokeWidth={1.8} /></span>
                </button>
              </Tooltip>
            )}
          </div>

          {/* Profile */}
          <div className="sb-profile-wrap">
            {collapsed && (
              <button className="sb-expand-btn" onClick={() => setCollapsed(false)} aria-label="Expand sidebar">
                <ChevronLeft size={13} strokeWidth={2.5} style={{ transform: "rotate(180deg)" }} />
              </button>
            )}
            <button className="sb-profile">
              <div className="sb-avatar">S</div>
              {!collapsed && (
                <>
                  <div className="sb-profile-info">
                    <span className="sb-profile-name">Soham</span>
                    <span className="sb-profile-plan">Pro workspace</span>
                  </div>
                  <ChevronDown size={13} className="sb-profile-chevron" strokeWidth={2} />
                </>
              )}
            </button>
          </div>
        </div>
      </aside>

      <CommandPalette isOpen={cmdOpen} onClose={() => setCmdOpen(false)} />
    </>
  );
}
