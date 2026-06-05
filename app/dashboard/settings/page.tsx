import { currentUser } from "@clerk/nextjs/server";
import SettingsWorkspace from "./settings-workspace";
import { getSettingsData } from "./actions";

export const metadata = {
  title: "Settings - Everyday Workspace",
  description: "Manage account, subscription, categories, AI, and app preferences",
};

export default async function SettingsPage() {
  const [user, data] = await Promise.all([currentUser(), getSettingsData()]);

  return (
    <SettingsWorkspace
      profile={{
        name: user?.fullName || user?.username || "Everyday user",
        email: user?.primaryEmailAddress?.emailAddress || "",
        imageUrl: user?.imageUrl || "",
      }}
      initialSettings={data.settings}
      initialCategories={data.categories}
      initialUsage={data.usage}
    />
  );
}
