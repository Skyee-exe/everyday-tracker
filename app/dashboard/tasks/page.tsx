import { getBoards } from "./actions";
import KanbanWorkspace from "@/components/kanban/KanbanWorkspace";

export const metadata = {
  title: "Tasks & Kanban – Everyday Workspace",
  description: "Manage your tasks with a premium Kanban board experience",
};

export default async function TasksPage() {
  const boards = await getBoards();

  return <KanbanWorkspace initialBoards={boards} />;
}
