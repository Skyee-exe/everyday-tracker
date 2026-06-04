import PagesWorkspace from "./pages-workspace";
import { getSpaces } from "./actions";

export const metadata = {
  title: "Pages & Spaces - Everyday Workspace",
  description: "Organize spaces and pages inside Everyday Workspace",
};

export default async function PagesPage() {
  const spaces = await getSpaces();
  return <PagesWorkspace initialSpaces={spaces} />;
}
