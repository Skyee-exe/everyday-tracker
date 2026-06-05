"use client";

import React, { useMemo, useState, useTransition } from "react";
import { useClerk, Show } from "@clerk/nextjs";
import { CheckoutButton, SubscriptionDetailsButton, useSubscription } from "@clerk/nextjs/experimental";
import {
  Bell,
  BookOpen,
  Bot,
  Brain,
  Briefcase,
  CalendarDays,
  Check,
  ChevronRight,
  CreditCard,
  Download,
  FileText,
  Flag,
  Heart,
  Loader2,
  Lock,
  Mail,
  NotebookPen,
  Palette,
  Pencil,
  Plus,
  Shield,
  Sparkles,
  Tag,
  Trash2,
  User,
  Wand2,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { UserCategory, UserSettings } from "@/db/schema";
import {
  createUserCategory,
  deleteUserCategory,
  updateUserCategory,
  updateUserSettings,
  type CategoryScope,
  type SettingsPayload,
} from "./actions";

type Profile = {
  name: string;
  email: string;
  imageUrl: string;
};

type Props = {
  profile: Profile;
  initialSettings: UserSettings;
  initialCategories: UserCategory[];
  initialUsage: {
    generatedApps: number;
    notesCount?: number;
    spacesCount?: number;
    aiActionsCount?: number;
  };
};

type SectionId = "profile" | "categories" | "ai" | "preferences";

const SECTIONS: { id: SectionId; label: string; icon: LucideIcon }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "categories", label: "Categories", icon: Tag },
  { id: "ai", label: "AI Settings", icon: Brain },
  { id: "preferences", label: "Preferences", icon: Palette },
];

const CATEGORY_SCOPES: { id: CategoryScope; label: string; icon: LucideIcon }[] = [
  { id: "calendar", label: "Calendar events", icon: CalendarDays },
  { id: "tasks", label: "Tasks / Kanban", icon: Briefcase },
  { id: "notes", label: "Notes", icon: NotebookPen },
  { id: "reminders", label: "Reminders", icon: Bell },
];



const ICONS: Record<string, LucideIcon> = {
  Bell,
  BookOpen,
  Bot,
  Brain,
  Briefcase,
  CalendarDays,
  FileText,
  Flag,
  Heart,
  Lock,
  Mail,
  NotebookPen,
  Palette,
  Shield,
  Sparkles,
  Tag,
  User,
  Wand2,
  Zap,
};

const COLOR_SWATCHES = ["#2563eb", "#dc2626", "#0891b2", "#7c3aed", "#16a34a", "#d97706", "#0f766e", "#be123c"];

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="settings-field-label">{children}</span>;
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="settings-field">
      <FieldLabel>{label}</FieldLabel>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ToggleRow({
  icon: Icon,
  title,
  description,
  checked,
  onChange,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="settings-toggle-row">
      <span className="settings-toggle-icon">
        <Icon size={16} />
      </span>
      <span className="settings-toggle-copy">
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span className="settings-switch" />
    </label>
  );
}

function BillingPanel({ usage }: { usage: Props["initialUsage"] }) {
  const proPlanId = process.env.NEXT_PUBLIC_CLERK_PRO_PLAN_ID;
  const freePlanId = process.env.NEXT_PUBLIC_CLERK_FREE_PLAN_ID;
  const subscription = useSubscription({ for: "user" });
  const data = subscription.data as any;
  const items = Array.isArray(data?.subscriptionItems) ? data.subscriptionItems : [];
  const activePlan = items.find((item: any) => item?.plan?.id === proPlanId) ?? items.find((item: any) => item?.plan?.id === freePlanId) ?? items[0];
  const isPro = Boolean(proPlanId && activePlan?.plan?.id === proPlanId);
  const nextPaymentDate = data?.nextPayment?.date ? new Date(data.nextPayment.date).toLocaleDateString() : "Not scheduled";
  const generatedAppLimit = isPro ? "Unlimited" : "3";

  return (
    <div className="settings-section-grid">
      <div className="settings-card settings-card--wide">
        <div className="settings-card-head">
          <span className="settings-card-icon settings-card-icon--blue">
            <CreditCard size={18} />
          </span>
          <div>
            <h2>Subscription</h2>
            <p>Clerk Billing manages your plan and payment details.</p>
          </div>
        </div>

        <div className="settings-plan-strip">
          <div>
            <span className="settings-eyebrow">Current plan</span>
            <strong>{subscription.isFetching ? "Loading..." : isPro ? "Everyday Pro" : "Everyday Free"}</strong>
            <small>Status: {data?.status || (subscription.error ? "billing unavailable" : "active")}</small>
          </div>
          <div>
            <span className="settings-eyebrow">Renewal</span>
            <strong>{nextPaymentDate}</strong>
            <small>{isPro ? "Full workspace access" : "Free workspace limits"}</small>
          </div>
        </div>

        {subscription.error && (
          <div className="settings-warning">
            Clerk Billing could not load subscription details. Plan actions remain available when Billing is configured.
          </div>
        )}

        <div className="settings-action-row">
          <Show when="signed-in">
            <SubscriptionDetailsButton>
              <button className="settings-btn settings-btn--ghost" type="button">
                <CreditCard size={15} />
                Manage plan
              </button>
            </SubscriptionDetailsButton>
          </Show>
          {proPlanId ? (
            <Show when="signed-in">
              <CheckoutButton planId={proPlanId} planPeriod="month">
                <button className="settings-btn settings-btn--primary" type="button" disabled={isPro || subscription.isFetching}>
                  <Sparkles size={15} />
                  {subscription.isFetching ? "Loading..." : isPro ? "Pro active" : "Upgrade to Pro"}
                </button>
              </CheckoutButton>
            </Show>
          ) : (
            <button className="settings-btn settings-btn--primary" type="button" disabled>
              <Sparkles size={15} />
              Pro plan ID missing
            </button>
          )}
        </div>
      </div>

      <div className="settings-card">
        <h3>Usage limits</h3>
        <div className="settings-usage-list">
          <div>
            <span>Active notes</span>
            <strong>
              {usage.notesCount ?? 0} / {isPro ? "Unlimited" : "10"}
            </strong>
          </div>
          <div>
            <span>Active spaces</span>
            <strong>
              {usage.spacesCount ?? 0} / {isPro ? "Unlimited" : "2"}
            </strong>
          </div>
          <div>
            <span>Daily AI actions</span>
            <strong>
              {usage.aiActionsCount ?? 0} / {isPro ? "Unlimited" : "5"}
            </strong>
          </div>
          <div>
            <span>AI template builder</span>
            <strong>{isPro ? "Enabled" : "Disabled (Paid only)"}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsWorkspace({ profile, initialSettings, initialCategories, initialUsage }: Props) {
  const { openUserProfile } = useClerk();
  const [activeSection, setActiveSection] = useState<SectionId>("profile");
  const [settings, setSettings] = useState<UserSettings>(initialSettings);
  const [categories, setCategories] = useState<UserCategory[]>(initialCategories);
  const [scope, setScope] = useState<CategoryScope>("calendar");
  const [draft, setDraft] = useState({ name: "", color: COLOR_SWATCHES[0], icon: "Tag" });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const avatarInitial = (profile.name || profile.email || "U").slice(0, 1).toUpperCase();
  const visibleCategories = useMemo(() => {
    return categories.filter((category) => category.scope === scope);
  }, [categories, scope]);

  function patchSettings(data: SettingsPayload) {
    const optimistic = { ...settings, ...data, updatedAt: new Date() };
    setSettings(optimistic);
    setMessage("");
    startTransition(async () => {
      try {
        const updated = await updateUserSettings(data);
        setSettings(updated);
        setMessage("Settings saved");
      } catch (error) {
        setSettings(settings);
        setMessage(error instanceof Error ? error.message : "Could not save settings");
      }
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft({ name: "", color: COLOR_SWATCHES[0], icon: "Tag" });
    setMessage("");
  }

  function saveCategory() {
    const name = draft.name.trim().toLowerCase();
    if (!name) return;

    const existing = categories.find((c) => c.scope === scope && c.name.toLowerCase() === name && c.id !== editingId);
    if (existing) {
      setMessage(`Category "${draft.name.trim()}" already exists.`);
      return;
    }

    console.log("saveCategory called. editingId:", editingId, "scope:", scope, "draft:", draft);
    setMessage("");
    startTransition(async () => {
      try {
        if (editingId) {
          console.log("Calling updateUserCategory with:", editingId, { scope, ...draft });
          const updated = await updateUserCategory(editingId, { scope, ...draft });
          console.log("updateUserCategory returned:", updated);
          setCategories((current) => current.map((item) => (item.id === updated.id ? updated : item)));
        } else {
          const position = categories.filter((category) => category.scope === scope).length;
          console.log("Calling createUserCategory with:", { scope, ...draft, position });
          const created = await createUserCategory({
            scope,
            ...draft,
            position,
          });
          console.log("createUserCategory returned:", created);
          setCategories((current) => [...current, created]);
        }
        setDraft({ name: "", color: COLOR_SWATCHES[0], icon: "Tag" });
        setEditingId(null);
        setMessage("Category saved");
      } catch (error) {
        console.error("Error in saveCategory:", error);
        setMessage(error instanceof Error ? error.message : "Could not save category");
      }
    });
  }

  function editCategory(category: UserCategory) {
    console.log("editCategory called with:", category);
    setScope(category.scope as CategoryScope);
    setEditingId(category.id);
    setDraft({ name: category.name, color: category.color, icon: category.icon });
  }

  function removeCategory(id: number) {
    console.log("removeCategory called with id:", id);
    setMessage("");
    startTransition(async () => {
      try {
        console.log("Calling deleteUserCategory with:", id);
        await deleteUserCategory(id);
        console.log("deleteUserCategory completed successfully");
        setCategories((current) => current.filter((category) => category.id !== id));
        setMessage("Category deleted");
      } catch (error) {
        console.error("Error in removeCategory:", error);
        setMessage(error instanceof Error ? error.message : "Could not delete category");
      }
    });
  }

  const renderSection = () => {
    if (activeSection === "profile") {
      return (
        <div className="settings-section-grid">
          <div className="settings-card settings-card--wide">
            <div className="settings-profile-hero">
              {profile.imageUrl ? (
                <img src={profile.imageUrl} alt="" />
              ) : (
                <span>{avatarInitial}</span>
              )}
              <div>
                <span className="settings-eyebrow">Signed in as</span>
                <h2>{profile.name}</h2>
                <p>{profile.email}</p>
              </div>
            </div>
            <div className="settings-action-row">
              <button className="settings-btn settings-btn--primary" type="button" onClick={() => openUserProfile()}>
                <Pencil size={15} />
                Edit in Clerk
              </button>
              <button className="settings-btn settings-btn--ghost" type="button" onClick={() => openUserProfile()}>
                <Shield size={15} />
                Account settings
              </button>
            </div>
          </div>
          <div className="settings-card">
            <h3>Profile source</h3>
            <p className="settings-muted">Name, avatar, email, and account security are managed by Clerk. The local database only stores app-specific preferences.</p>
          </div>
        </div>
      );
    }

    

    if (activeSection === "categories") {
      return (
        <div className="settings-section-grid">
          <div className="settings-card settings-card--wide">
            <div className="settings-card-head">
              <span className="settings-card-icon settings-card-icon--teal">
                <Tag size={18} />
              </span>
              <div>
                <h2>Custom categories</h2>
                <p>Create categories for each part of your workspace.</p>
              </div>
            </div>

            <div className="settings-scope-tabs">
              {CATEGORY_SCOPES.map((item) => {
                const Icon = item.icon;
                return (
                  <button 
                    key={item.id} 
                    className={scope === item.id ? "is-active" : ""} 
                    onClick={() => {
                      setScope(item.id);
                      cancelEdit();
                    }} 
                    type="button"
                  >
                    <Icon size={14} />
                    {item.label}
                  </button>
                );
              })}
            </div>

            <div className="settings-category-list">
              {visibleCategories.map((category) => {
                const Icon = ICONS[category.icon] ?? Tag;
                return (
                  <div key={`${category.scope}-${category.name}-${category.id}`} className="settings-category-row">
                    <span className="settings-category-icon" style={{ color: category.color, background: `${category.color}14` }}>
                      <Icon size={15} />
                    </span>
                    <div>
                      <strong>{category.name}</strong>
                      <small>Category</small>
                    </div>
                    <div className="settings-icon-actions">
                      <button type="button" onClick={() => editCategory(category as UserCategory)} aria-label="Edit category">
                        <Pencil size={14} />
                      </button>
                      <button type="button" onClick={() => removeCategory((category as UserCategory).id)} aria-label="Delete category">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="settings-card">
            <h3>{editingId ? "Edit category" : "New category"}</h3>
            <label className="settings-field">
              <FieldLabel>Name</FieldLabel>
              <input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Deep work" />
            </label>
            <label className="settings-field">
              <FieldLabel>Icon</FieldLabel>
              <select value={draft.icon} onChange={(event) => setDraft((current) => ({ ...current, icon: event.target.value }))}>
                {Object.keys(ICONS).map((icon) => (
                  <option key={icon} value={icon}>
                    {icon}
                  </option>
                ))}
              </select>
            </label>
            <div className="settings-field">
              <FieldLabel>Color</FieldLabel>
              <div className="settings-swatches">
                {COLOR_SWATCHES.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={draft.color === color ? "is-active" : ""}
                    style={{ background: color }}
                    onClick={() => setDraft((current) => ({ ...current, color }))}
                    aria-label={`Use ${color}`}
                  >
                    {draft.color === color && <Check size={14} />}
                  </button>
                ))}
              </div>
            </div>
            {editingId ? (
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button className="settings-btn settings-btn--ghost settings-btn--full" type="button" onClick={cancelEdit} disabled={isPending}>
                  Cancel edit
                </button>
                <button className="settings-btn settings-btn--primary settings-btn--full" type="button" onClick={saveCategory} disabled={!draft.name.trim() || isPending}>
                  {isPending ? <Loader2 size={15} className="settings-spin" /> : <Check size={15} />}
                  Save category
                </button>
              </div>
            ) : (
              <button className="settings-btn settings-btn--primary settings-btn--full" type="button" onClick={saveCategory} disabled={!draft.name.trim() || isPending}>
                {isPending ? <Loader2 size={15} className="settings-spin" /> : <Plus size={15} />}
                Add category
              </button>
            )}
          </div>
        </div>
      );
    }

    if (activeSection === "ai") {
      return (
        <div className="settings-section-grid">
          <div className="settings-card settings-card--wide">
            <div className="settings-card-head">
              <span className="settings-card-icon settings-card-icon--purple">
                <Brain size={18} />
              </span>
              <div>
                <h2>AI model settings</h2>
                <p>Choose the default AI behavior for writing, assistant, and template workflows.</p>
              </div>
            </div>
            <div className="settings-form-grid">
              <SelectField
                label="Default model"
                value={settings.aiDefaultModel}
                onChange={(value) => patchSettings({ aiDefaultModel: value })}
                options={[
                  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
                  { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
                  { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
                ]}
              />
              <SelectField
                label="Default behavior"
                value={settings.aiBehavior}
                onChange={(value) => patchSettings({ aiBehavior: value })}
                options={[
                  { value: "balanced", label: "Balanced" },
                  { value: "creative", label: "Creative" },
                  { value: "precise", label: "Precise" },
                ]}
              />
              <SelectField
                label="Response style"
                value={settings.aiResponseStyle}
                onChange={(value) => patchSettings({ aiResponseStyle: value })}
                options={[
                  { value: "concise", label: "Concise" },
                  { value: "detailed", label: "Detailed" },
                  { value: "friendly", label: "Friendly" },
                  { value: "formal", label: "Formal" },
                ]}
              />
            </div>
          </div>
          <div className="settings-card">
            <h3>Enabled AI tools</h3>
            <ToggleRow icon={Wand2} title="AI Refine" description="Improve notes and page text." checked={settings.aiRefineEnabled} onChange={(value) => patchSettings({ aiRefineEnabled: value })} />
            <ToggleRow icon={Sparkles} title="AI Template Builder" description="Generate small productivity apps." checked={settings.aiTemplateBuilderEnabled} onChange={(value) => patchSettings({ aiTemplateBuilderEnabled: value })} />
          </div>
        </div>
      );
    }

    return (
      <div className="settings-section-grid">
        <div className="settings-card settings-card--wide">
          <div className="settings-card-head">
            <span className="settings-card-icon settings-card-icon--blue">
              <Palette size={18} />
            </span>
            <div>
              <h2>Other import settings</h2>
              <p>Defaults for calendar, tasks, notifications, privacy, and export behavior.</p>
            </div>
          </div>
          <div className="settings-form-grid">
            <SelectField
              label="Theme preference"
              value={settings.theme}
              onChange={(value) => patchSettings({ theme: value })}
              options={[
                { value: "system", label: "System" },
                { value: "light", label: "Light" },
                { value: "dark", label: "Dark" },
              ]}
            />
            <SelectField
              label="Default calendar view"
              value={settings.defaultCalendarView}
              onChange={(value) => patchSettings({ defaultCalendarView: value })}
              options={[
                { value: "week", label: "Week" },
                { value: "month", label: "Month" },
              ]}
            />
            <SelectField
              label="Default task priority"
              value={settings.defaultTaskPriority}
              onChange={(value) => patchSettings({ defaultTaskPriority: value })}
              options={[
                { value: "low", label: "Low" },
                { value: "medium", label: "Medium" },
                { value: "high", label: "High" },
                { value: "critical", label: "Critical" },
              ]}
            />
            <SelectField
              label="Data export"
              value={settings.dataExportPreference}
              onChange={(value) => patchSettings({ dataExportPreference: value })}
              options={[
                { value: "json", label: "JSON" },
                { value: "csv", label: "CSV" },
                { value: "markdown", label: "Markdown" },
              ]}
            />
          </div>
        </div>
        <div className="settings-card">
          <h3>Privacy and automation</h3>
          <ToggleRow icon={Bell} title="Notifications" description="Allow reminders and app notices." checked={settings.notificationsEnabled} onChange={(value) => patchSettings({ notificationsEnabled: value })} />
          <ToggleRow icon={Zap} title="Autosave" description="Save workspace changes automatically." checked={settings.autosaveEnabled} onChange={(value) => patchSettings({ autosaveEnabled: value })} />
          <ToggleRow icon={Lock} title="Privacy mode" description="Reduce visible sensitive metadata." checked={settings.privacyModeEnabled} onChange={(value) => patchSettings({ privacyModeEnabled: value })} />
          <ToggleRow icon={Shield} title="Security alerts" description="Notify me about account events." checked={settings.securityAlertsEnabled} onChange={(value) => patchSettings({ securityAlertsEnabled: value })} />
        </div>
      </div>
    );
  };

  return (
    <main className="settings-page">
      <header className="settings-header">
        <div>
          <span className="settings-kicker">
            <Sparkles size={14} />
            Workspace controls
          </span>
          <h1>Settings</h1>
          <p>Manage your account, plans, categories, preferences, and AI defaults.</p>
        </div>
        <div className="settings-save-state">
          {isPending ? <Loader2 size={14} className="settings-spin" /> : <Check size={14} />}
          {isPending ? "Saving" : message || "Ready"}
        </div>
      </header>

      <div className="settings-layout">
        <aside className="settings-nav" aria-label="Settings sections">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                className={activeSection === section.id ? "is-active" : ""}
                type="button"
                onClick={() => setActiveSection(section.id)}
              >
                <Icon size={16} />
                <span>{section.label}</span>
                <ChevronRight size={14} />
              </button>
            );
          })}
        </aside>

        <section className="settings-content">{renderSection()}</section>
      </div>
    </main>
  );
}
