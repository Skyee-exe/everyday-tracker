import { ClerkProvider } from "@clerk/nextjs";
import "@liveblocks/react-ui/styles.css";
import "@excalidraw/excalidraw/index.css";
import "./globals.css";
import type { Metadata } from "next";
import { ThemeProvider } from "@/components/landing/theme-context";

export const metadata: Metadata = {
  title: "Everyday Tracker - Your Modern Workspace",
  description:
    "A powerful productivity workspace combining notes, kanban, whiteboard, calendar, and AI in one focused app.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap"
            rel="stylesheet"
          />
        </head>
        <body style={{ margin: 0, padding: 0 }}>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
