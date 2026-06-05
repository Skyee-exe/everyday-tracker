import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { db, generatedApps } from "@/db";
import { GeneratedAppPreview } from "../template-builder";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Live Preview - AI Workspace App",
  description: "View and interact with your AI generated templates",
};

export default async function StandaloneAppPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const appId = Number(id);
  if (isNaN(appId)) notFound();

  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [app] = await db
    .select()
    .from(generatedApps)
    .where(and(eq(generatedApps.id, appId), eq(generatedApps.clerkUserId, userId)));

  if (!app) notFound();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Premium Nav Bar */}
      <header className="border-b border-border bg-card h-14 px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <Link
          href="/dashboard/ai-templates"
          className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to Builder</span>
        </Link>
        <span className="text-xs text-muted-foreground font-medium">Standalone View</span>
      </header>

      {/* Main content wrapper */}
      <div className="flex-1 p-6 md:p-8 max-w-[1400px] w-full mx-auto">
        <GeneratedAppPreview app={app as any} isStandalone={true} />
      </div>
    </div>
  );
}
