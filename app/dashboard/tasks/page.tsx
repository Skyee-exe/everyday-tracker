import { getBoards, getTasksCategories } from "./actions";
import KanbanWorkspace from "@/components/kanban/KanbanWorkspace";

export const metadata = {
  title: "Tasks & Kanban – Everyday Workspace",
  description: "Manage your tasks with a premium Kanban board experience",
};

export default async function TasksPage() {
  const [boards, categories] = await Promise.all([getBoards(), getTasksCategories()]);

  return <KanbanWorkspace initialBoards={boards} initialCategories={categories} />;
}
