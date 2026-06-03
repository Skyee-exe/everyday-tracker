# Everyday — Your Unified Workspace

**Everyday** is a premium productivity platform built by **Soham** — combining the structured power of Notion with the visual freedom of Miro into one fast, focused workspace.

---

## ✨ What is Everyday?

Everyday is where your thinking, tasks, and collaboration live together. It's built for people who want a workspace that feels as good as it works — clean, fast, and actually enjoyable to spend time in.

- **Dashboard** — A live command center that shows what matters now, what's next, and what you've shipped
- **AI Assistant** — An intelligent co-pilot woven into your workflow, not bolted on as an afterthought
- **Kanban & Tasks** — Visual task management with urgency-aware layouts
- **Notes** — Rich text notes that feel as quick as a scratchpad
- **Whiteboard** — A free-form canvas for ideas that don't fit in a list
- **Pages & Spaces** — Structured docs for your projects and teams
- **AI Templates** — Pre-built intelligent templates that adapt to your context
- **Calendar** — Your schedule, contextually aware of your tasks and deadlines

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Language** | TypeScript + React 19 |
| **Styling** | Vanilla CSS + Tailwind CSS v4 |
| **Auth** | Clerk (seamless SaaS-grade authentication) |
| **Database** | Neon Serverless PostgreSQL |
| **ORM** | Drizzle ORM |
| **Icons** | Lucide React |

---

## ⚙️ Project Structure

```text
everyday/
├── app/
│   ├── dashboard/          # Main workspace shell
│   │   ├── page.tsx        # Command center dashboard
│   │   └── layout.tsx      # Dashboard layout with sidebar
│   ├── globals.css         # Design system & component styles
│   ├── layout.tsx          # Root layout with auth & user sync
│   └── page.tsx            # Landing page
├── components/
│   ├── sidebar.tsx         # Collapsible sidebar with workspace switcher
│   └── command-palette.tsx # Ctrl+K search & quick actions
├── db/                     # Database schema & configuration
├── docs/                   # Design system & architecture notes
│   └── theme.md            # UI design system reference
├── lib/                    # Utilities and server-side helpers
├── proxy.ts                # Clerk middleware routing
├── drizzle.config.ts       # Drizzle Kit configuration
└── package.json
```

---

## 🚀 Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
Create a `.env` file — refer to `.env.example` for the full list:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Neon Database
DATABASE_URL=postgresql://user:password@host/db?sslmode=require

# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

### 3. Push the database schema
```bash
npm run db:push
```

### 4. Start the dev server
```bash
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🗄️ Database Commands

| Command | Description |
|---|---|
| `npm run db:push` | Push schema changes to Neon |
| `npm run db:generate` | Generate a SQL migration file |
| `npm run db:studio` | Open Drizzle Studio (visual DB inspector) |

---

## 🎨 Design System

Everyday uses a custom CSS design system with a **blue/red premium palette**:
- **Primary:** `#2563eb` — actions, active states, branding
- **Accent:** `#dc2626` — urgency, tasks, notifications
- **Surface:** Multi-layer white/light-blue backgrounds with intentional depth

See [`docs/theme.md`](docs/theme.md) for the full design token reference.

---

## 🔐 Authentication

User authentication is handled by **Clerk** with a webhook-free sync strategy — user profiles are written to the Neon database server-side during the layout render lifecycle, eliminating tunneling setup and webhook verification complexity.

---

*Built by Soham · 2025*
