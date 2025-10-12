"use client";

export default function ModelViewer({ url }: { url: string }) {
  if (!url) return null;
  // placeholder simplu: arată linkul către modelul 3D (îl îmbunătățim ulterior)
  return (
    <div className="rounded-xl border p-4">
      <p className="mb-2 text-sm opacity-80">Model 3D generat:</p>
      <a href={url} target="_blank" rel="noreferrer" className="underline">
        Deschide modelul 3D
      </a>
    </div>
  );
}
