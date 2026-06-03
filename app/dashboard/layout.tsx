import Sidebar from "@/components/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="et-app-shell">
      <Sidebar />
      <div className="et-main-content">
        {children}
      </div>
    </div>
  );
}
