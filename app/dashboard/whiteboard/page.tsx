import WhiteboardWrapper from "@/components/whiteboard/WhiteboardWrapper";
import { getWhiteboards } from "./actions";

export const metadata = {
  title: "Whiteboard - Everyday Workspace",
  description: "Draw, ideate, and generate editable diagrams with AI",
};

export default async function WhiteboardPage() {
  const boards = await getWhiteboards();

  return <WhiteboardWrapper initialBoards={boards} />;
}
