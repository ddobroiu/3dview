"use client";

import { useEffect, useRef } from "react";

type Props = { url?: string; height?: number };

export default function ModelViewer({ url = "", height = 360 }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hostRef.current) return;

    // ❗️creeăm elementul DOAR pe client
    const el = document.createElement("model-viewer");
    el.setAttribute("src", url);
    el.setAttribute("camera-controls", "");
    el.setAttribute("shadow-intensity", "1");
    el.style.width = "100%";
    el.style.height = `${height}px`;

    // atașăm
    hostRef.current.appendChild(el);

    // cleanup SIGUR (nu mai dă removeChild pe nod greșit)
    return () => {
      if (hostRef.current && el.parentNode === hostRef.current) {
        hostRef.current.removeChild(el);
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
