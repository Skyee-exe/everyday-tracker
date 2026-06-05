"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

export default function ThemeForcer() {
  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme("light");
  }, [setTheme]);

  return null;
}
