"use client";

import React, { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BarChart3,
  BookOpen,
  Calendar,
  Check,
  ChevronRight,
  ListChecks,
  Loader2,
  Plus,
  Sparkles,
  Target,
  Trash2,
  Utensils,
  Wallet,
  Wand2,
  Pin,
  X,
  ExternalLink,
} from "lucide-react";
import type { GeneratedApp } from "@/db/schema";
import {
  deleteGeneratedApp,
  generateTemplateApp,
  markGeneratedAppOpened,
  toggleAppSidebar,
  updateGeneratedAppJson,
  type GeneratedAppJson,
} from "./actions";

type AppRecord = GeneratedApp & { appJson: GeneratedAppJson };

const iconMap = {
  Sparkles,
  Calendar,
  ListChecks,
  Wallet,
  BookOpen,
  Utensils,
  BarChart3,
  Target,
};

function formatTime(value: Date | string | null) {
  if (!value) return "Never opened";
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function GeneratedAppPreview({ 
  app, 
  isStandalone = false 
}: { 
  app: AppRecord; 
  isStandalone?: boolean; 
}) {
  const [appJson, setAppJson] = useState<GeneratedAppJson>(app.appJson);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [isSaving, startTransition] = useTransition();

  useEffect(() => {
    setAppJson(app.appJson);
    setFormValues({});
  }, [app]);

  const Icon = iconMap[appJson.icon as keyof typeof iconMap] ?? Sparkles;
  const firstRow = appJson.sampleData[0] ?? {};

  // Form value change handler
  const handleInputChange = (fieldLabel: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [fieldLabel]: value }));
  };

  // Perform Quick Add Action
  const handleQuickAdd = () => {
    const newItem: Record<string, string | number | boolean> = {};
    
    appJson.fields.forEach((field) => {
      const val = formValues[field.label] ?? "";
      if (field.type === "number") {
        newItem[field.label] = Number(val) || 0;
      } else if (field.type === "checkbox") {
        newItem[field.label] = val === "true" || val === "on" || val === "yes";
      } else {
        newItem[field.label] = val || (field.placeholder ?? `New ${field.label}`);
      }
    });

    // Extract primary field text to optionally add to checklists/lists
    const primaryTextField = appJson.fields.find((f) => f.type === "text")?.label || appJson.fields[0]?.label || "Title";
    const taskName = String(formValues[primaryTextField] || "New Item").trim();

    // Check if sections have checklists/lists and append if relevant
    const updatedSections = appJson.sections.map((section) => {
      if (section.type === "checklist" || section.type === "list") {
        const prefix = section.type === "checklist" ? "[ ] " : "";
        return {
          ...section,
          items: [...(section.items || []), prefix + taskName],
        };
      }
      return section;
    });

    const nextAppJson = {
      ...appJson,
      sampleData: [newItem, ...appJson.sampleData],
      sections: updatedSections,
    };

    setAppJson(nextAppJson);
    setFormValues({});

    startTransition(async () => {
      await updateGeneratedAppJson(app.id, nextAppJson);
    });
  };

  // Toggle checklist item checked status
  const toggleChecklist = (sectionIndex: number, itemIndex: number) => {
    const updatedSections = appJson.sections.map((section, sIndex) => {
      if (sIndex === sectionIndex && section.items) {
        const nextItems = [...section.items];
        let item = nextItems[itemIndex];
        if (item.startsWith("[x] ")) {
          item = "[ ] " + item.slice(4);
        } else if (item.startsWith("[ ] ")) {
          item = "[x] " + item.slice(4);
        } else {
          item = "[x] " + item;
        }
        nextItems[itemIndex] = item;
        return { ...section, items: nextItems };
      }
      return section;
    });

    const nextAppJson = {
      ...appJson,
      sections: updatedSections,
    };

    setAppJson(nextAppJson);
    startTransition(async () => {
      await updateGeneratedAppJson(app.id, nextAppJson);
    });
  };

  // Delete checklist item
  const deleteChecklistItem = (sectionIndex: number, itemIndex: number) => {
    const updatedSections = appJson.sections.map((section, sIndex) => {
      if (sIndex === sectionIndex && section.items) {
        const nextItems = section.items.filter((_, idx) => idx !== itemIndex);
        return { ...section, items: nextItems };
      }
      return section;
    });

    const nextAppJson = {
      ...appJson,
      sections: updatedSections,
    };

    setAppJson(nextAppJson);
    startTransition(async () => {
      await updateGeneratedAppJson(app.id, nextAppJson);
    });
  };

  // Delete row from sampleData
  const deleteTableRow = (rowIndex: number) => {
    const nextAppJson = {
      ...appJson,
      sampleData: appJson.sampleData.filter((_, idx) => idx !== rowIndex),
    };

    setAppJson(nextAppJson);
    startTransition(async () => {
      await updateGeneratedAppJson(app.id, nextAppJson);
    });
  };

  // Dynamic stat calculator
  const getStatValue = (label: string, index: number) => {
    const lower = label.toLowerCase();

    // Check count of items
    if (lower.includes("total") || lower.includes("count") || lower.includes("items") || lower.includes("habits") || lower.includes("meals")) {
      return appJson.sampleData.length;
    }

    // Check completed count
    if (lower.includes("completed") || lower.includes("done") || lower.includes("checked") || lower.includes("streak")) {
      let doneCount = 0;
      appJson.sections.forEach((sec) => {
        if (sec.type === "checklist" && sec.items) {
          doneCount += sec.items.filter((i) => i.startsWith("[x] ")).length;
        }
      });
      if (doneCount > 0) return doneCount;

      const completedRows = appJson.sampleData.filter((row) => {
        const val = String(row.status || row.completed || row.Done || row.Status || "").toLowerCase();
        return val === "done" || val === "completed" || val === "true" || val === "yes";
      });
      return completedRows.length || 3;
    }

    // Check progress
    if (lower.includes("progress") || lower.includes("rate") || lower.includes("percent")) {
      let total = 0;
      let done = 0;
      appJson.sections.forEach((sec) => {
        if (sec.type === "checklist" && sec.items) {
          total += sec.items.length;
          done += sec.items.filter((i) => i.startsWith("[x] ")).length;
        }
      });
      if (total > 0) {
        return `${Math.round((done / total) * 100)}%`;
      }
      return `${Math.min(100, Math.round(appJson.sampleData.length * 15))}%`;
    }

    // Look for numeric sums (Calorie tracking, budget amounts, hours, etc.)
    for (const key of Object.keys(firstRow)) {
      if (lower.includes(key.toLowerCase())) {
        const sum = appJson.sampleData.reduce((acc, row) => {
          const val = Number(row[key]);
          return acc + (isNaN(val) ? 0 : val);
        }, 0);
        return sum || 1200;
      }
    }

    return appJson.sampleData.length ? appJson.sampleData.length + index : index + 1;
  };

  // Dynamic progress calculator
  const getProgressVal = (item: string, index: number) => {
    const lowerItem = item.toLowerCase();
    
    // Check if matches a checklist section title
    const checklistSec = appJson.sections.find(s => s.type === "checklist" && s.title.toLowerCase().includes(lowerItem));
    if (checklistSec && checklistSec.items && checklistSec.items.length > 0) {
      const done = checklistSec.items.filter(i => i.startsWith("[x] ")).length;
      return Math.round((done / checklistSec.items.length) * 100);
    }

    // Check if matches row name in sampleData
    const row = appJson.sampleData.find((r) => 
      Object.values(r).some((v) => String(v).toLowerCase().includes(lowerItem))
    );
    if (row) {
      for (const k of Object.keys(row)) {
        if (k.toLowerCase().includes("prog") || k.toLowerCase().includes("percent") || typeof row[k] === "number") {
          const val = Number(row[k]);
          if (!isNaN(val)) return Math.min(100, val <= 1 ? val * 100 : val);
        }
      }
    }

    return Math.min(100, 35 + index * 18);
  };

  // Dynamic chart height mapping
  const getChartHeight = (item: string, index: number) => {
    let numericKey = "";
    if (appJson.sampleData.length > 0) {
      const first = appJson.sampleData[0];
      for (const key of Object.keys(first)) {
        if (typeof first[key] === "number" || (!isNaN(Number(first[key])) && first[key] !== "")) {
          numericKey = key;
          break;
        }
      }
    }

    if (numericKey && appJson.sampleData[index]) {
      const val = Number(appJson.sampleData[index][numericKey]);
      if (!isNaN(val)) {
        const values = appJson.sampleData.map((r) => Number(r[numericKey]) || 0);
        const maxVal = Math.max(...values, 1);
        const pct = val / maxVal;
        return `${Math.max(15, Math.min(130, pct * 120))}px`;
      }
    }

    return `${38 + index * 14}px`;
  };

  return (
    <section 
      className={`ait-preview ${isStandalone ? "ait-preview--standalone" : ""}`} 
      style={{ "--app-color": app.color } as React.CSSProperties}
    >
      <header className="ait-preview-head">
        <div className="ait-preview-title">
          <span className="ait-preview-icon">
            <Icon size={22} />
          </span>
          <div>
            <h2>{appJson.appName}</h2>
            <p>{appJson.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isSaving && <span className="text-[10px] text-slate-400 font-semibold uppercase animate-pulse">Saving...</span>}
          <span className="ait-tag">{appJson.layout}</span>
        </div>
      </header>

      <div className="ait-render-grid">
        <aside className="ait-form-panel">
          <h3>Quick Add</h3>
          <div className="ait-fields">
            {appJson.fields.map((field) => (
              <label key={field.label} className="ait-field">
                <span>{field.label}</span>
                {field.type === "select" ? (
                  <select 
                    value={formValues[field.label] ?? ""}
                    onChange={(e) => handleInputChange(field.label, e.target.value)}
                  >
                    <option value="" disabled>
                      Choose
                    </option>
                    {(field.options?.length ? field.options : ["Planned", "Active", "Done"]).map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                ) : field.type === "checkbox" ? (
                  <input 
                    type="checkbox" 
                    checked={formValues[field.label] === "true"}
                    onChange={(e) => handleInputChange(field.label, e.target.checked ? "true" : "false")}
                  />
                ) : (
                  <input 
                    type={field.type} 
                    placeholder={field.placeholder ?? field.label} 
                    value={formValues[field.label] ?? ""}
                    onChange={(e) => handleInputChange(field.label, e.target.value)}
                  />
                )}
              </label>
            ))}
          </div>
          <div className="ait-action-stack">
            {(appJson.actions.length ? appJson.actions : ["Add item"]).map((action, index) => (
              <button 
                key={action} 
                className={index === 0 ? "ait-btn ait-btn--primary w-full" : "ait-btn ait-btn--ghost w-full"}
                onClick={index === 0 ? handleQuickAdd : undefined}
              >
                {index === 0 ? <Plus size={15} /> : <Check size={15} />}
                {action}
              </button>
            ))}
          </div>
        </aside>

        <div className="ait-section-grid">
          {appJson.sections.map((section, sectionIndex) => (
            <article key={`${section.title}-${sectionIndex}`} className="ait-mini-section">
              <div className="ait-mini-head">
                <h3>{section.title}</h3>
                {section.description && <p>{section.description}</p>}
              </div>

              {section.type === "stats" && (
                <div className="ait-stats">
                  {(section.items?.length ? section.items : Object.keys(firstRow).slice(0, 3)).slice(0, 3).map((item, index) => (
                    <div key={item} className="ait-stat">
                      <span>{item}</span>
                      <strong>{getStatValue(item, index)}</strong>
                    </div>
                  ))}
                </div>
              )}

              {section.type === "progress" && (
                <div className="ait-progress-list">
                  {(section.items?.length ? section.items : ["Planning", "In progress", "Done"]).slice(0, 4).map((item, index) => (
                    <div key={item} className="ait-progress-row">
                      <span>{item}</span>
                      <div><i style={{ width: `${getProgressVal(item, index)}%` }} /></div>
                    </div>
                  ))}
                </div>
              )}

              {section.type === "table" && (
                <div className="ait-table">
                  <div className="ait-table-row ait-table-row--head">
                    {(section.columns?.length ? section.columns : Object.keys(firstRow).slice(0, 3)).slice(0, 4).map((column) => (
                      <span key={column}>{column}</span>
                    ))}
                    <span style={{ width: "30px", flexShrink: 0 }}></span>
                  </div>
                  {appJson.sampleData.map((row, rowIndex) => (
                    <div key={rowIndex} className="ait-table-row group relative">
                      {(section.columns?.length ? section.columns : Object.keys(row).slice(0, 3)).slice(0, 4).map((column) => (
                        <span key={column} className="truncate" title={String(row[column] ?? row[column.toLowerCase()] ?? "")}>
                          {String(row[column] ?? row[column.toLowerCase()] ?? "—")}
                        </span>
                      ))}
                      <button 
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity p-1 ml-auto"
                        onClick={() => deleteTableRow(rowIndex)}
                        title="Delete entry"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                  {appJson.sampleData.length === 0 && (
                    <div className="text-center p-4 text-xs text-slate-400">No data entries. Use Quick Add.</div>
                  )}
                </div>
              )}

              {(section.type === "list" || section.type === "checklist") && (
                <div className="ait-checks">
                  {(section.items?.length ? section.items : ["Capture item", "Review item", "Complete item"]).map((item, index) => {
                    const isChecked = item.startsWith("[x] ");
                    const cleanText = item.startsWith("[x] ") || item.startsWith("[ ] ") ? item.slice(4) : item;
                    return (
                      <div key={index} className="flex items-center justify-between group py-0.5 border-b border-slate-100 last:border-0">
                        <label className="flex items-center gap-2 cursor-pointer flex-1 select-none">
                          <input 
                            type="checkbox" 
                            checked={isChecked} 
                            onChange={() => toggleChecklist(sectionIndex, index)}
                          />
                          <span style={isChecked ? { textDecoration: "line-through", color: "hsl(222 10% 60%)" } : {}}>
                            {cleanText}
                          </span>
                        </label>
                        <button
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity p-1"
                          onClick={() => deleteChecklistItem(sectionIndex, index)}
                          title="Delete item"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  })}
                  {(!section.items || section.items.length === 0) && (
                    <div className="text-center p-4 text-xs text-slate-400">No list items. Add one in Quick Add.</div>
                  )}
                </div>
              )}

              {section.type === "form" && (
                <div className="ait-inline-fields">
                  {appJson.fields.slice(0, 3).map((field) => (
                    <input key={field.label} placeholder={field.placeholder ?? field.label} disabled />
                  ))}
                  <p className="text-[10px] text-slate-400 italic">Use &quot;Quick Add&quot; panel on left side to add active entries.</p>
                </div>
              )}

              {section.type === "chart" && (
                <div className="ait-bars">
                  {(section.items?.length ? section.items : ["Mon", "Tue", "Wed", "Thu", "Fri"]).slice(0, 5).map((item, index) => (
                    <span 
                      key={item} 
                      style={{ height: getChartHeight(item, index) }} 
                      title={`${item}: ${getStatValue(item, index)}`} 
                    />
                  ))}
                </div>
              )}

              {section.type === "buttons" && (
                <div className="ait-chip-row">
                  {(section.items?.length ? section.items : appJson.actions).slice(0, 5).map((item) => (
                    <button key={item} disabled>{item}</button>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function AiTemplateBuilder({
  initialApps,
  initialAppId,
  plan = "Free",
}: {
  initialApps: GeneratedApp[];
  initialAppId: number | null;
  plan?: string;
}) {
  const router = useRouter();
  const [apps, setApps] = useState<AppRecord[]>(initialApps.map(asApp));
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState("");
  const [selectedAppId, setSelectedAppId] = useState<number | null>(
    initialAppId && initialApps.some((app) => app.id === initialAppId)
      ? initialAppId
      : initialApps[0]?.id ?? null
  );
  const [isPending, startTransition] = useTransition();

  const selectedApp = useMemo(
    () => apps.find((app) => app.id === selectedAppId) ?? null,
    [apps, selectedAppId]
  );
  
  // Dynamic limits based on workspace subscription tier
  const maxApps = plan === "Free" ? 1 : 3;
  const limitReached = apps.length >= maxApps;
  const sidebarAppsCount = useMemo(() => apps.filter(app => app.inSidebar).length, [apps]);

  const openApp = (app: AppRecord) => {
    setSelectedAppId(app.id);
    router.push(`/dashboard/ai-templates?app=${app.id}`);
    startTransition(async () => {
      await markGeneratedAppOpened(app.id);
    });
  };

  const generate = () => {
    if (!prompt.trim() || limitReached) return;
    setError("");
    startTransition(async () => {
      try {
        const app = asApp(await generateTemplateApp(prompt));
        setApps((current) => [app, ...current]);
        setSelectedAppId(app.id);
        setPrompt("");
        router.push(`/dashboard/ai-templates?app=${app.id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to generate template");
      }
    });
  };

  const removeApp = (id: number) => {
    if (confirm("Are you sure you want to delete this app template? This cannot be undone.")) {
      startTransition(async () => {
        await deleteGeneratedApp(id);
        
        // Notify sidebar in case it was pinned
        window.dispatchEvent(new Event("sidebar-update"));
        
        const nextApps = apps.filter((app) => app.id !== id);
        setApps(nextApps);
        
        if (selectedAppId === id) {
          const nextId = nextApps[0]?.id ?? null;
          setSelectedAppId(nextId);
          router.push(nextId ? `/dashboard/ai-templates?app=${nextId}` : "/dashboard/ai-templates");
        }
      });
    }
  };

  const handleToggleSidebar = (app: AppRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    setError("");
    const nextInSidebar = !app.inSidebar;

    startTransition(async () => {
      try {
        await toggleAppSidebar(app.id, nextInSidebar);
        
        setApps((current) =>
          current.map((item) => {
            if (item.id === app.id) {
              return { ...item, inSidebar: nextInSidebar };
            }
            return item;
          })
        );
        
        // Dispatches global event to update the sidebar instantaneously
        window.dispatchEvent(new Event("sidebar-update"));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to toggle sidebar status");
      }
    });
  };

  return (
    <main className="ait-workspace">
      <style>{`
        .ait-workspace { min-height: 100vh; padding: 28px; background: var(--background); color: var(--foreground); }
        .ait-shell { width: min(1320px, 100%); margin: 0 auto; display: grid; grid-template-columns: minmax(320px, 420px) minmax(0, 1fr); gap: 18px; }
        .ait-panel, .ait-preview, .ait-card, .ait-empty { background: var(--card); border: 1px solid var(--border); border-radius: 8px; box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04); }
        .ait-panel { padding: 18px; }
        .ait-kicker { display: inline-flex; align-items: center; gap: 7px; color: #0ea5e9; font-size: .75rem; font-weight: 800; text-transform: uppercase; }
        .ait-panel h1 { margin: 8px 0 6px; font-family: var(--font-display); font-size: 1.85rem; line-height: 1.05; }
        .ait-panel p { margin: 0; color: var(--muted-foreground); font-size: .9rem; line-height: 1.45; }
        .ait-prompt { display: grid; gap: 10px; margin-top: 18px; }
        .ait-prompt textarea { min-height: 110px; resize: vertical; border: 1px solid var(--border); border-radius: 8px; padding: 12px; font: inherit; font-size: .9rem; outline: none; color: var(--foreground); background: var(--background); }
        .ait-prompt textarea:focus { border-color: #0ea5e9; box-shadow: 0 0 0 3px rgba(14, 165, 233, .12); }
        .ait-btn { min-height: 36px; border-radius: 8px; border: 1px solid transparent; padding: 0 13px; display: inline-flex; align-items: center; justify-content: center; gap: 7px; font: inherit; font-size: .825rem; font-weight: 750; cursor: pointer; white-space: nowrap; transition: all 150ms; }
        .ait-btn:disabled { opacity: .55; cursor: not-allowed; }
        .ait-btn--primary { color: #fff; background: linear-gradient(135deg, #2563eb, #0891b2); box-shadow: 0 1px 3px rgba(37, 99, 235, .26); }
        .ait-btn--primary:hover:not(:disabled) { opacity: 0.95; transform: translateY(-0.5px); }
        .ait-btn--ghost { color: var(--foreground); background: var(--card); border-color: var(--border); }
        .ait-btn--ghost:hover:not(:disabled) { background: var(--sb-hover-bg); border-color: var(--border); }
        .ait-btn--pinned { color: #16a34a; background: hsl(142 76% 96%); border-color: hsl(142 60% 86%); }
        .ait-btn--pinned:hover:not(:disabled) { background: hsl(142 76% 93%); }
        .ait-limit { margin-top: 12px; padding: 10px; border-radius: 8px; background: rgba(217, 119, 6, .09); color: #92400e; font-size: .8rem; font-weight: 650; }
        .ait-error { margin-top: 12px; padding: 10px; border-radius: 8px; background: rgba(220, 38, 38, .08); color: #b91c1c; font-size: .82rem; font-weight: 650; }
        .ait-created { margin-top: 22px; }
        .ait-created-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 10px; }
        .ait-created-head h2 { margin: 0; font-family: var(--font-display); font-size: 1.05rem; }
        .ait-count { color: var(--muted-foreground); font-size: .75rem; font-weight: 750; }
        .ait-card-list { display: grid; gap: 10px; }
        .ait-card { padding: 12px; display: grid; gap: 10px; border-left: 4px solid var(--app-color); transition: transform 150ms; }
        .ait-card:hover { transform: scale(1.005); }
        .ait-card-main { width: 100%; border: none; background: transparent; padding: 0; display: flex; align-items: flex-start; gap: 10px; text-align: left; cursor: pointer; }
        .ait-app-icon, .ait-preview-icon { width: 40px; height: 40px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; color: var(--app-color); background: color-mix(in srgb, var(--app-color) 11%, white); flex-shrink: 0; }
        .ait-card h3 { margin: 0; color: var(--foreground); font-size: .96rem; line-height: 1.25; }
        .ait-card p { margin: 4px 0 0; color: var(--muted-foreground); font-size: .8rem; line-height: 1.4; }
        .ait-card-meta { display: flex; flex-wrap: wrap; gap: 6px; color: var(--muted-foreground); font-size: .72rem; font-weight: 700; border-top: 1px dashed var(--border); padding-top: 6px; }
        .ait-card-actions { display: flex; flex-wrap: wrap; gap: 7px; border-top: 1px solid var(--border); padding-top: 8px; }
        .ait-icon-btn { width: 34px; height: 34px; border: 1px solid var(--border); border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; background: var(--card); color: var(--foreground); cursor: pointer; transition: all 150ms; }
        .ait-icon-btn:hover { color: #dc2626; background: rgba(220, 38, 38, .08); border-color: rgba(220, 38, 38, .2); }
        .ait-empty { padding: 28px; min-height: 260px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; text-align: center; color: var(--muted-foreground); }
        .ait-empty h2 { margin: 0; color: var(--foreground); font-family: var(--font-display); font-size: 1.15rem; }
        
        .ait-preview { padding: 22px; min-height: calc(100vh - 56px); border-top: 4px solid var(--app-color); }
        .ait-preview--standalone { min-height: calc(100vh - 100px); max-width: 1300px; margin: 0 auto; border: 1px solid var(--border); border-radius: 12px; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05); }
        
        .ait-preview-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 20px; border-bottom: 1px solid var(--border); padding-bottom: 14px; }
        .ait-preview-title { display: flex; align-items: center; gap: 12px; min-width: 0; }
        .ait-preview h2 { margin: 0; font-family: var(--font-display); font-size: 1.55rem; line-height: 1.1; }
        .ait-preview p { margin: 4px 0 0; color: var(--muted-foreground); font-size: .875rem; }
        .ait-tag { padding: 5px 9px; border-radius: 999px; color: var(--app-color); background: color-mix(in srgb, var(--app-color) 10%, white); font-size: .72rem; font-weight: 800; }
        .ait-render-grid { display: grid; grid-template-columns: 280px minmax(0, 1fr); gap: 18px; align-items: start; }
        .ait-form-panel, .ait-mini-section { border: 1px solid var(--border); border-radius: 8px; background: var(--background); padding: 16px; }
        .ait-form-panel h3, .ait-mini-section h3 { margin: 0; font-family: var(--font-display); font-size: 1rem; color: var(--foreground); border-bottom: 1px solid var(--border); padding-bottom: 8px; }
        .ait-fields, .ait-action-stack, .ait-section-grid { display: grid; gap: 12px; }
        .ait-fields { margin-top: 12px; }
        .ait-field { display: grid; gap: 6px; color: hsl(222 12% 42%); font-size: .72rem; font-weight: 800; text-transform: uppercase; }
        .ait-field input:not([type="checkbox"]), .ait-field select, .ait-inline-fields input { height: 36px; border: 1px solid var(--border); border-radius: 8px; background: var(--card); color: var(--foreground); padding: 0 10px; font: inherit; font-size: .82rem; outline: none; text-transform: none; }
        .ait-field input:focus, .ait-field select:focus, .ait-inline-fields input:focus { border-color: var(--app-color); }
        .ait-field input[type="checkbox"] { width: 18px; height: 18px; border-radius: 4px; border: 1px solid var(--border); background: var(--card); cursor: pointer; }
        .ait-action-stack { margin-top: 12px; }
        .ait-section-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .ait-mini-head { margin-bottom: 12px; }
        .ait-mini-head p { margin: 4px 0 0; color: var(--muted-foreground); font-size: 0.78rem; }
        .ait-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .ait-stat { padding: 10px; border-radius: 8px; background: var(--card); border: 1px solid var(--border); }
        .ait-stat span { display: block; color: var(--muted-foreground); font-size: .72rem; font-weight: 700; }
        .ait-stat strong { display: block; margin-top: 4px; color: var(--app-color); font-size: 1.25rem; }
        .ait-progress-list, .ait-checks, .ait-inline-fields { display: grid; gap: 9px; margin-top: 12px; }
        .ait-progress-row { display: grid; gap: 5px; color: var(--foreground); font-size: .8rem; font-weight: 700; }
        .ait-progress-row div { height: 8px; border-radius: 999px; background: var(--muted); overflow: hidden; }
        .ait-progress-row i { display: block; height: 100%; border-radius: inherit; background: var(--app-color); transition: width 200ms; }
        .ait-table { overflow-x: auto; margin-top: 12px; }
        .ait-table-row { min-width: 420px; display: flex; gap: 12px; min-height: 34px; align-items: center; border-bottom: 1px solid var(--border); color: var(--foreground); font-size: .78rem; padding: 4px 6px; }
        .ait-table-row--head { color: var(--muted-foreground); font-weight: 800; text-transform: uppercase; font-size: .68rem; background: var(--background); border-radius: 4px; margin-bottom: 4px; }
        .ait-table-row > span { flex: 1; min-width: 0; }
        .ait-checks label { display: flex; align-items: center; gap: 8px; color: var(--foreground); font-size: .84rem; font-weight: 650; }
        .ait-checks input[type="checkbox"] { width: 15px; height: 15px; border-radius: 4px; border: 1px solid var(--border); background: var(--card); }
        .ait-bars { height: 150px; display: flex; align-items: end; gap: 10px; padding-top: 10px; border-bottom: 1px solid var(--border); margin-top: 12px; }
        .ait-bars span { flex: 1; min-width: 26px; border-radius: 7px 7px 0 0; background: linear-gradient(180deg, var(--app-color), color-mix(in srgb, var(--app-color) 45%, white)); transition: height 250ms; }
        .ait-chip-row { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
        .ait-chip-row button { border: 1px solid var(--border); border-radius: 999px; padding: 6px 10px; background: var(--card); color: var(--foreground); font-weight: 700; font-size: .78rem; }
        @media (max-width: 1200px) { .ait-shell, .ait-render-grid { grid-template-columns: 1fr; } .ait-preview { min-height: auto; } }
        @media (max-width: 760px) { .ait-workspace { padding: 18px; } .ait-panel h1 { font-size: 1.5rem; } .ait-section-grid, .ait-stats { grid-template-columns: 1fr; } .ait-preview-head { flex-direction: column; } }
      `}</style>

      <div className="ait-shell">
        <section className="ait-panel">
          <div className="ait-kicker">
            <Wand2 size={15} />
            AI Template Builder
          </div>
          <h1>Generate a single-page app</h1>
          <p>Describe a tracker, planner, budget, study board, or any small workflow. The AI returns structured JSON and saves the generated app to your workspace.</p>

          <div className="ait-prompt">
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Create a meal planner with weekly meals, grocery checklist, nutrition stats, and prep tasks."
              disabled={isPending || limitReached}
            />
            <button className="ait-btn ait-btn--primary" onClick={generate} disabled={isPending || !prompt.trim() || limitReached}>
              {isPending ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
              Generate
            </button>
          </div>

          {limitReached && (
            <div className="ait-limit">
              {plan === "Free"
                ? "Free plan is limited to 1 generated app. Upgrade to Pro to generate more."
                : `You have reached the ${maxApps} app limit. Delete an app to generate another.`}
            </div>
          )}
          {error && <div className="ait-error">{error}</div>}

          <section className="ait-created">
            <div className="ait-created-head">
              <h2>Created Apps</h2>
              <span className="ait-count">{apps.length}/{maxApps}</span>
            </div>
            {apps.length ? (
              <div className="ait-card-list">
                {apps.map((app) => {
                  const Icon = iconMap[app.icon as keyof typeof iconMap] ?? Sparkles;
                  return (
                    <article key={app.id} className="ait-card" style={{ "--app-color": app.color } as React.CSSProperties}>
                      {/* Clicking the main body opens the standalone full-screen route */}
                      <button className="ait-card-main" onClick={() => router.push(`/dashboard/ai-templates/${app.id}`)}>
                        <span className="ait-app-icon"><Icon size={18} /></span>
                        <span>
                          <h3>{app.appName}</h3>
                          <p>{app.description}</p>
                        </span>
                        <ChevronRight size={16} className="text-muted-foreground hover:text-foreground" />
                      </button>
                      <div className="ait-card-meta">
                        <span>{app.appJson.appType}</span>
                        <span>Created {formatTime(app.createdAt)}</span>
                        <span>Opened {formatTime(app.lastOpenedAt)}</span>
                      </div>
                      <div className="ait-card-actions">
                        <button className="ait-btn ait-btn--ghost" onClick={() => router.push(`/dashboard/ai-templates/${app.id}`)}>
                          <BookOpen size={14} />
                          Preview
                        </button>

                        <button 
                          className={`ait-btn ${app.inSidebar ? "ait-btn--pinned" : "ait-btn--ghost"}`}
                          onClick={(e) => handleToggleSidebar(app, e)}
                        >
                          <Pin size={14} fill={app.inSidebar ? "currentColor" : "none"} />
                          {app.inSidebar ? "Pinned to Sidebar" : "Pin to Sidebar"}
                        </button>

                        <button className="ait-icon-btn" onClick={() => removeApp(app.id)} aria-label={`Delete ${app.appName}`}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="ait-empty">
                <Sparkles size={26} />
                <h2>No generated apps yet</h2>
                <p>Your saved AI apps will appear here and in the main sidebar.</p>
              </div>
            )}
          </section>
        </section>

        {selectedApp ? (
          <div>
            <div className="flex justify-between items-center mb-2 px-1">
              <span className="text-xs text-slate-500 font-semibold uppercase">Interactive Preview Panel</span>
              <Link 
                href={`/dashboard/ai-templates/${selectedApp.id}`}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
              >
                Open Fullscreen
                <ExternalLink size={12} />
              </Link>
            </div>
            <GeneratedAppPreview app={selectedApp} />
          </div>
        ) : (
          <section className="ait-empty">
            <Wand2 size={30} />
            <h2>Prompt to create your first app</h2>
            <p>The generated JSON preview opens here after creation.</p>
          </section>
        )}
      </div>
    </main>
  );
}

function asApp(app: GeneratedApp): AppRecord {
  return app as AppRecord;
}
