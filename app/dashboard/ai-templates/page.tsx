import AiTemplateBuilder from "./template-builder";
import { getGeneratedApps } from "./actions";
import { getActiveWorkspacePlan } from "@/app/dashboard/workspaces/actions";
import { auth } from "@clerk/nextjs/server";

export const metadata = {
  title: "AI Template Builder - Everyday Workspace",
  description: "Generate and save single-page productivity apps with AI",
};

export default async function AiTemplatesPage({
  searchParams,
}: {
  searchParams?: Promise<{ app?: string }>;
}) {
  const { userId } = await auth();
  const plan = userId ? await getActiveWorkspacePlan(userId) : "Free";
  const apps = await getGeneratedApps();
  const params = searchParams ? await searchParams : {};
  return (
    <AiTemplateBuilder
      initialApps={apps}
      initialAppId={params.app ? Number(params.app) : null}
      plan={plan}
    />
  );
}
