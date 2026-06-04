import { ClerkProvider } from '@clerk/nextjs';
import { checkAndSyncUser } from "@/lib/user-sync";
import "@liveblocks/react-ui/styles.css";
import "@excalidraw/excalidraw/index.css";
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Everyday Tracker — Your Modern Workspace",
  description:
    "A powerful productivity workspace combining notes, kanban, whiteboard, calendar, and AI — all in one cozy, modern app.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Sync the authenticated user details with the Neon database if logged in
  await checkAndSyncUser();

  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap"
            rel="stylesheet"
          />
        </head>
        <body style={{ margin: 0, padding: 0 }}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
