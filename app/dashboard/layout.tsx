import Sidebar from "@/components/sidebar";
import { NotificationProvider } from "@/components/notifications/NotificationContext";
import NotificationCenter from "@/components/notifications/NotificationCenter";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NotificationProvider>
      <div className="et-app-shell">
        <Sidebar />
        <div className="et-main-content">
          {children}
        </div>
      </div>
      <NotificationCenter />
    </NotificationProvider>
  );
}
