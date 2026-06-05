/**
 * Converts TipTap JSON node structure to clean Markdown format
 */
export function convertTiptapToMarkdown(node: any): string {
  if (!node) return "";
  if (node.type === "text") {
    let text = node.text || "";
    if (node.marks) {
      for (const mark of node.marks) {
        if (mark.type === "bold") text = `**${text}**`;
        if (mark.type === "italic") text = `*${text}*`;
        if (mark.type === "underline") text = `<u>${text}</u>`;
        if (mark.type === "strike") text = `~~${text}~~`;
        if (mark.type === "code") text = `\`${text}\``;
      }
    }
    return text;
  }

  const childrenText = (node.content || [])
    .map((child: any) => convertTiptapToMarkdown(child))
    .join("");

  switch (node.type) {
    case "doc":
      return childrenText;
    case "paragraph":
      return `${childrenText}\n\n`;
    case "heading":
      const level = node.attrs?.level || 1;
      return `${"#".repeat(level)} ${childrenText}\n\n`;
    case "bulletList":
      return (node.content || [])
        .map((item: any) => `* ${convertTiptapToMarkdown(item).trim()}\n`)
        .join("") + "\n";
    case "orderedList":
      return (node.content || [])
        .map((item: any, idx: number) => `${idx + 1}. ${convertTiptapToMarkdown(item).trim()}\n`)
        .join("") + "\n";
    case "listItem":
      return childrenText;
    case "taskList":
      return childrenText + "\n";
    case "taskItem":
      const checked = node.attrs?.checked ? "[x]" : "[ ]";
      return `- ${checked} ${childrenText}\n`;
    case "blockquote":
      return `> ${childrenText.trim().replace(/\n/g, "\n> ")}\n\n`;
    case "codeBlock":
      const language = node.attrs?.language || "";
      return `\`\`\`${language}\n${childrenText}\n\`\`\`\n\n`;
    case "horizontalRule":
      return "---\n\n";
    default:
      return childrenText;
  }
}
