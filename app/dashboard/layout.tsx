import Sidebar from "@/components/sidebar";
import { NotificationProvider } from "@/components/notifications/NotificationContext";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import { WorkspaceProvider } from "@/components/workspaces/WorkspaceProvider";
import { checkAndSyncUser } from "@/lib/user-sync";
import ThemeForcer from "@/components/dashboard/ThemeForcer";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await checkAndSyncUser();

  return (
    <NotificationProvider>
      <WorkspaceProvider>
        <ThemeForcer />
        <div className="et-app-shell">
          <Sidebar />
          <div className="et-main-content">
            {children}
          </div>
        </div>
        <NotificationCenter />
      </WorkspaceProvider>
    </NotificationProvider>
  );
}
