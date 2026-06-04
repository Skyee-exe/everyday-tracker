"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import BoardSidebar from "./BoardSidebar";
import BoardArea from "./BoardArea";
import CreateBoardDialog from "./CreateBoardDialog";
import TaskDrawer from "./TaskDrawer";
import {
  getColumns,
  getTasks,
  createBoard,
  deleteBoard,
  createTask as createTaskAction,
  updateTask as updateTaskAction,
  deleteTask as deleteTaskAction,
  updateTaskPositions,
  updateColumnPositions,
  createColumn,
  updateColumn,
  deleteColumn as deleteColumnAction,
  getMyRoleForBoard,
  getBoardAccess,
} from "@/app/dashboard/tasks/actions";
import type { KanbanBoard, KanbanColumn, KanbanTask } from "@/db/schema";
import { meetsRole, type CollabRole } from "@/lib/collab/permissions";

export default function KanbanWorkspace({
  initialBoards,
}: {
  initialBoards: KanbanBoard[];
}) {
  const [boards, setBoards] = useState<KanbanBoard[]>(initialBoards);
  const [activeBoardId, setActiveBoardId] = useState<number | null>(
    initialBoards[0]?.id ?? null
  );
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateBoard, setShowCreateBoard] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<KanbanTask | null>(null);
  const [drawerColumnId, setDrawerColumnId] = useState<number | null>(null);
  const [myRole, setMyRole] = useState<CollabRole | null>(null);
  const [totalCollaborators, setTotalCollaborators] = useState<number>(0);
  const { user } = useUser();

  /* ── Filters & Search ── */
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterSpecial, setFilterSpecial] = useState<string | null>(null);

  const activeBoard = boards.find((b) => b.id === activeBoardId) ?? null;
  const canEdit = myRole !== null && meetsRole(myRole, "editor");
  const currentUserEmail = user?.emailAddresses?.[0]?.emailAddress ?? null;

  /* ── Load columns + tasks when board changes ── */
  const loadBoardData = useCallback(async (boardId: number) => {
    setLoading(true);
    try {
      const [cols, tsks, access] = await Promise.all([
        getColumns(boardId),
        getTasks(boardId),
        getBoardAccess(boardId),
      ]);
      setColumns(cols);
      setTasks(tsks);
      setMyRole(access.role);
      setTotalCollaborators(access.totalCollaborators);
    } catch (e) {
      console.error("Failed to load board data", e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (activeBoardId) loadBoardData(activeBoardId);
  }, [activeBoardId, loadBoardData]);

  /* ── Board CRUD ── */
  const handleCreateBoard = async (data: {
    name: string;
    color: string;
    template: string;
  }) => {
    const board = await createBoard(data);
    setBoards((prev) => [board, ...prev]);
    setActiveBoardId(board.id);
    setShowCreateBoard(false);
  };

  const handleDeleteBoard = async (id: number) => {
    await deleteBoard(id);
    setBoards((prev) => prev.filter((b) => b.id !== id));
    if (activeBoardId === id) {
      const remaining = boards.filter((b) => b.id !== id);
      setActiveBoardId(remaining[0]?.id ?? null);
    }
  };

  /* ── Column CRUD ── */
  const handleAddColumn = async (name: string) => {
    if (!activeBoardId) return;
    const col = await createColumn(activeBoardId, name);
    setColumns((prev) => [...prev, col]);
  };

  const handleRenameColumn = async (id: number, name: string) => {
    await updateColumn(id, { name });
    setColumns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name } : c))
    );
  };

  const handleDeleteColumn = async (id: number) => {
    await deleteColumnAction(id);
    setColumns((prev) => prev.filter((c) => c.id !== id));
    setTasks((prev) => prev.filter((t) => t.columnId !== id));
  };

  const handleReorderColumns = async (newColumns: KanbanColumn[]) => {
    setColumns(newColumns);
    await updateColumnPositions(
      newColumns.map((c, i) => ({ id: c.id, position: i }))
    );
  };

  /* ── Task CRUD ── */
  const handleCreateTask = async (data: {
    title: string;
    description?: string;
    priority?: string;
    category?: string;
    dueDate?: Date | null;
    estimatedDuration?: number;
    syncCalendar?: boolean;
    columnId: number;
  }) => {
    if (!activeBoardId) return;
    const task = await createTaskAction({
      boardId: activeBoardId,
      columnId: data.columnId,
      title: data.title,
      description: data.description,
      priority: data.priority,
      category: data.category,
      dueDate: data.dueDate,
      estimatedDuration: data.estimatedDuration,
      syncCalendar: data.syncCalendar,
    });
    setTasks((prev) => [...prev, task]);
    setDrawerOpen(false);
    setEditingTask(null);
  };

  const handleUpdateTask = async (
    id: number,
    data: Partial<{
      title: string;
      description: string | null;
      priority: string;
      category: string;
      dueDate: Date | null;
      estimatedDuration: number;
      completed: boolean;
    }>
  ) => {
    const task = await updateTaskAction(id, data);
    setTasks((prev) => prev.map((t) => (t.id === id ? task : t)));
    setDrawerOpen(false);
    setEditingTask(null);
  };

  const handleDeleteTask = async (id: number) => {
    await deleteTaskAction(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleMoveTask = async (
    updates: { id: number; columnId: number; position: number }[]
  ) => {
    // Optimistic update
    setTasks((prev) => {
      const copy = [...prev];
      for (const u of updates) {
        const idx = copy.findIndex((t) => t.id === u.id);
        if (idx !== -1) {
          copy[idx] = { ...copy[idx], columnId: u.columnId, position: u.position };
        }
      }
      return copy;
    });
    await updateTaskPositions(updates);
  };

  const openDrawer = (columnId?: number, task?: KanbanTask) => {
    setDrawerColumnId(columnId ?? columns[0]?.id ?? null);
    setEditingTask(task ?? null);
    setDrawerOpen(true);
  };

  /* ── Filter tasks ── */
  const filteredTasks = tasks.filter((t) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !t.title.toLowerCase().includes(q) &&
        !(t.description ?? "").toLowerCase().includes(q) &&
        !(t.category ?? "").toLowerCase().includes(q)
      )
        return false;
    }
    if (filterPriority && t.priority !== filterPriority) return false;
    if (filterCategory && t.category !== filterCategory) return false;
    if (filterSpecial === "due-today") {
      if (!t.dueDate) return false;
      const today = new Date();
      const due = new Date(t.dueDate);
      if (
        due.getFullYear() !== today.getFullYear() ||
        due.getMonth() !== today.getMonth() ||
        due.getDate() !== today.getDate()
      )
        return false;
    }
    if (filterSpecial === "overdue") {
      if (!t.dueDate) return false;
      if (new Date(t.dueDate) >= new Date()) return false;
    }
    if (filterSpecial === "completed" && !t.completed) return false;
    if (filterSpecial === "calendar-linked" && !t.linkedCalendarTaskId) return false;
    if (filterSpecial === "note-linked" && !t.linkedNoteId) return false;
    return true;
  });

  /* ── Board insights ── */
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const now = new Date();
  const overdueTasks = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < now && !t.completed
  ).length;
  const dueTodayTasks = tasks.filter((t) => {
    if (!t.dueDate) return false;
    const d = new Date(t.dueDate);
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  }).length;
  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="kb-workspace">
      <BoardSidebar
        boards={boards}
        activeBoardId={activeBoardId}
        tasks={tasks}
        onSelectBoard={setActiveBoardId}
        onCreateBoard={() => setShowCreateBoard(true)}
        onDeleteBoard={handleDeleteBoard}
      />

      <div className="kb-main">
        {activeBoard ? (
          <BoardArea
            board={activeBoard}
            columns={columns}
            tasks={filteredTasks}
            allTasks={tasks}
            loading={loading}
            insights={{ totalTasks, completedTasks, overdueTasks, dueTodayTasks, completionRate }}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filterPriority={filterPriority}
            onFilterPriorityChange={setFilterPriority}
            filterCategory={filterCategory}
            onFilterCategoryChange={setFilterCategory}
            filterSpecial={filterSpecial}
            onFilterSpecialChange={setFilterSpecial}
            onAddColumn={handleAddColumn}
            onRenameColumn={handleRenameColumn}
            onDeleteColumn={handleDeleteColumn}
            onReorderColumns={handleReorderColumns}
            onOpenDrawer={openDrawer}
            onMoveTask={handleMoveTask}
            onToggleComplete={(id, completed) =>
              handleUpdateTask(id, { completed })
            }
            onDeleteTask={handleDeleteTask}
            myRole={myRole}
            totalCollaborators={totalCollaborators}
            canEdit={canEdit}
          />
        ) : (
          <div className="kb-empty-state">
            <div className="kb-empty-icon">
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                <rect x="4" y="12" width="16" height="40" rx="4" fill="rgba(37,99,235,0.12)" stroke="rgba(37,99,235,0.3)" strokeWidth="1.5"/>
                <rect x="24" y="8" width="16" height="48" rx="4" fill="rgba(37,99,235,0.08)" stroke="rgba(37,99,235,0.2)" strokeWidth="1.5"/>
                <rect x="44" y="16" width="16" height="32" rx="4" fill="rgba(37,99,235,0.05)" stroke="rgba(37,99,235,0.15)" strokeWidth="1.5"/>
              </svg>
            </div>
            <h2 className="kb-empty-title">No boards yet</h2>
            <p className="kb-empty-desc">
              Create your first board to start organizing your tasks<br/>
              or ask AI to generate a board structure.
            </p>
            <button
              className="kb-btn kb-btn--primary"
              onClick={() => setShowCreateBoard(true)}
            >
              Create Your First Board
            </button>
          </div>
        )}
      </div>

      {showCreateBoard && (
        <CreateBoardDialog
          onClose={() => setShowCreateBoard(false)}
          onCreate={handleCreateBoard}
        />
      )}

      {drawerOpen && activeBoardId && (
        <TaskDrawer
          columns={columns}
          columnId={drawerColumnId}
          task={editingTask}
          onClose={() => {
            setDrawerOpen(false);
            setEditingTask(null);
          }}
          onCreate={handleCreateTask}
          onUpdate={handleUpdateTask}
          canEdit={canEdit}
        />
      )}
    </div>
  );
}
