"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  CheckSquare,
  Calendar,
  Bell,
  NotebookPen,
  PenTool,
  BookOpen,
  Sparkles,
  Trash2,
  Check,
  X,
  RefreshCw,
} from "lucide-react";
import { useNotifications } from "./NotificationContext";
import type { Notification } from "@/db/schema";

/* ─────────────────── Helpers ─────────────────── */
function getNotificationIcon(type: string) {
  switch (type) {
    case "comment":
    case "mention":
      return MessageSquare;
    case "task":
      return CheckSquare;
    case "calendar":
      return Calendar;
    case "reminder":
      return Bell;
    case "note":
      return NotebookPen;
    case "whiteboard":
      return PenTool;
    case "page":
      return BookOpen;
    case "system":
    default:
      return Sparkles;
  }
}

function formatRelativeTime(dateInput: Date | string) {
  const date = new Date(dateInput);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${diffDays}d ago`;
}

/* ─────────────────── Component ─────────────────── */
export default function NotificationCenter() {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    loading,
    isOpen,
    setIsOpen,
    markRead,
    markAllRead,
    removeNotification,
    triggerMock,
  } = useNotifications();

  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");

  if (!isOpen) return null;

  // Filter list by tab
  const filtered = activeTab === "unread" ? notifications.filter((n) => !n.isRead) : notifications;

  const handleOpenRelated = (item: Notification) => {
    setIsOpen(false);
    // Mark as read automatically when opened
    if (!item.isRead) {
      markRead(item.id);
    }

    // Navigation mapping
    switch (item.entityType) {
      case "task":
      case "board":
        router.push("/dashboard/tasks");
        break;
      case "note":
        router.push("/dashboard/notes");
        break;
      case "calendar":
      case "reminder":
        router.push("/dashboard/calendar");
        break;
      case "whiteboard":
        router.push("/dashboard/whiteboard");
        break;
      case "page":
        router.push("/dashboard/pages");
        break;
      default:
        // do nothing
        break;
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="nc-backdrop" onClick={() => setIsOpen(false)} />

      {/* Slide-over Panel */}
      <aside className="nc-panel" role="dialog" aria-label="Notification center">
        {/* Header */}
        <div className="nc-header">
          <div className="nc-title-row">
            <h2>Notifications</h2>
            <button className="nc-close-btn" onClick={() => setIsOpen(false)} title="Close panel">
              <X size={16} />
            </button>
          </div>

          <div className="nc-tabs-row">
            <div className="nc-tabs">
              <button
                className={`nc-tab${activeTab === "all" ? " nc-tab--active" : ""}`}
                onClick={() => setActiveTab("all")}
              >
                All
                <span className="nc-tab-count">{notifications.length}</span>
              </button>
              <button
                className={`nc-tab${activeTab === "unread" ? " nc-tab--active" : ""}`}
                onClick={() => setActiveTab("unread")}
              >
                Unread
                {unreadCount > 0 && <span className="nc-tab-count nc-tab-count--unread">{unreadCount}</span>}
              </button>
            </div>

            {unreadCount > 0 && (
              <button className="nc-readall-btn" onClick={markAllRead}>
                <Check size={13} />
                Mark all read
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="nc-body">
          {loading && notifications.length === 0 ? (
            <div className="nc-loading">
              <RefreshCw size={24} className="nc-loading-spinner" />
              <p>Loading notifications...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="nc-empty">
              <Bell size={36} className="nc-empty-icon" />
              <p className="nc-empty-title">You&apos;re all caught up</p>
              <p className="nc-empty-desc">No new notifications here.</p>
              
              <button className="nc-demo-btn" onClick={triggerMock}>
                Trigger Demo Notifications
              </button>
            </div>
          ) : (
            <div className="nc-list">
              {filtered.map((item) => {
                const Icon = getNotificationIcon(item.type);
                return (
                  <div
                    key={item.id}
                    className={`nc-item${!item.isRead ? " nc-item--unread" : ""}`}
                    onClick={() => handleOpenRelated(item)}
                    style={{ cursor: item.entityType ? "pointer" : "default" }}
                  >
                    {/* Unread indicator dot */}
                    {!item.isRead && <div className="nc-unread-dot" />}

                    {/* Icon wrapper */}
                    <div className="nc-item-icon-wrapper" style={{ color: !item.isRead ? "#2563eb" : "#64748b" }}>
                      <Icon size={16} />
                    </div>

                    {/* Content */}
                    <div className="nc-item-content">
                      <div className="nc-item-title-row">
                        <span className="nc-item-title">{item.title}</span>
                        <span className="nc-item-time">{formatRelativeTime(item.createdAt)}</span>
                      </div>
                      <p className="nc-item-message">{item.message}</p>
                      
                      {/* Action buttons (only show if related item exists) */}
                      {item.entityType && (
                        <div className="nc-item-actions">
                          <span className="nc-item-link">
                            Open {item.entityType.charAt(0).toUpperCase() + item.entityType.slice(1)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions Panel on Hover */}
                    <div className="nc-hover-actions" onClick={(e) => e.stopPropagation()}>
                      {!item.isRead && (
                        <button
                          className="nc-hover-btn"
                          onClick={() => markRead(item.id)}
                          title="Mark as read"
                        >
                          <Check size={14} />
                        </button>
                      )}
                      <button
                        className="nc-hover-btn nc-hover-btn--danger"
                        onClick={() => removeNotification(item.id)}
                        title="Delete notification"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}

              <div style={{ padding: "0 20px 20px" }}>
                <button className="nc-demo-btn nc-demo-btn--outline" onClick={triggerMock}>
                  Trigger More Demo Notifications
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
