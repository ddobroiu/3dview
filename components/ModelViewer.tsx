"use client";

import { useEffect, useRef } from "react";

type Props = { url?: string; height?: number };

export default function ModelViewer({ url = "", height = 360 }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    // creeăm elementul doar pe client
    const el = document.createElement("model-viewer");
    el.setAttribute("src", url);
    el.setAttribute("camera-controls", "");
    el.setAttribute("shadow-intensity", "1");
    el.style.width = "100%";
    el.style.height = `${height}px`;

    host.appendChild(el);

    return () => {
      if (host && host.contains(el)) {
        host.removeChild(el);
      }
    };
  }, [url, height]);

  return (
    <div
      ref={hostRef}
      style={{
        width: "100%",
        height,
        borderRadius: 12,
        overflow: "hidden",
        background: "rgba(255,255,255,0.06)",
      }}
    />
  );
}