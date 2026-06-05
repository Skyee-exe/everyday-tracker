import { getDashboardData } from "./actions";
import DashboardWorkspace from "@/components/dashboard/DashboardWorkspace";
import { CollabRoom } from "@/lib/collab/RoomProvider";

export const metadata = {
  title: "Dashboard – Everyday Workspace",
  description: "Your modern productivity dashboard and workspace command center.",
};

export default async function DashboardPage() {
  const data = await getDashboardData();
  return (
    <CollabRoom roomId="workspace_global">
      <DashboardWorkspace initialData={data} />
    </CollabRoom>
  );
}
