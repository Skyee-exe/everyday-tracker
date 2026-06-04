"use client";

import { useEffect, useState, type ReactNode } from "react";

export function LazyOnVisible({
  children,
  fallback = null,
  rootMargin = "200px",
}: {
  children: ReactNode;
  fallback?: ReactNode;
  rootMargin?: string;
}) {
  const [visible, setVisible] = useState(false);
  const [el, setEl] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!el) return;
    if (visible) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true);
            obs.disconnect();
            break;
          }
        }
      },
      { rootMargin }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [el, rootMargin, visible]);

  return (
    <div ref={setEl} style={{ display: "contents" }}>
      {visible ? children : fallback}
    </div>
  );
}
