"use client";

import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import dynamic from "next/dynamic";
import { FaDownload, FaExclamationTriangle, FaImage, FaTimes } from "react-icons/fa";

// ✅ ModelViewer este în pages/components/
const ModelViewer = dynamic(() => import("./components/ModelViewer"), { ssr: false });

function Page() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [history, setHistory] = useState<
    { image: string; video?: string | null; model?: string | null; date: string }[]
  >([]);
  const [modalModel, setModalModel] = useState<string | null>(null);

  // Before/After slider (fără librărie, deci zero probleme la hidratare)
  const [reveal, setReveal] = useState(50); // procent din lățime
  const containerRef = useRef<HTMLDivElement | null>(null);

  const glass = "bg-white/80 dark:bg-[#151a23]/70 backdrop-blur-xl";
  const border = "border border-slate-200 dark:border-[#23263a]";
  const rounded = "rounded-2xl";
  const gradientBtn =
    "bg-gradient-to-r from-blue-600 via-blue-500 to-purple-700 hover:from-blue-700 hover:to-purple-800 shadow-xl transition";

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) {
      showError("Încarcă o imagine înainte de generare.");
      return;
    }

    setErrorMsg(null);
    setLoading(true);
    setVideoUrl(null);
    setModelUrl(null);

    const localUrl = URL.createObjectURL(imageFile);
    setOriginalPreview(localUrl);

    try {
      const formData = new FormData();
      formData.append("image", imageFile);

      const res = await fetch("/api/generate-3d-image", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok || (!data.video && !data.model)) {
        throw new Error(data.error || "Modelul nu a returnat video sau fișier 3D.");
      }

      setVideoUrl(data.video || null);
      setModelUrl(data.model || null);

      const date = new Date().toLocaleString();
      const record = { image: localUrl, video: data.video || null, model: data.model || null, date };
      setHistory((prev) => [record, ...prev].slice(0, 5));

      // opțional: salvează în backend
      fetch("/api/history/save", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ record }),
      }).catch(() => {});
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      showError(message || "Eroare necunoscută.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (index: number) => {
    const toDelete = history[index];
    setHistory((prev) => prev.filter((_, i) => i !== index));
    fetch("/api/history/delete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ image: toDelete.image }),
    }).catch(() => {});
  };

  // Drag pe container pentru slider (opțional, pe lângă input range)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onDown = (_e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const move = (ev: PointerEvent) => {
        const x = Math.min(Math.max(ev.clientX - rect.left, 0), rect.width);
        setReveal(Math.round((x / rect.width) * 100));
      };
      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    };

    el.addEventListener("pointerdown", onDown);
    return () => el.removeEventListener("pointerdown", onDown);
  }, []);

  return (
    <>
      <Head>
        <title>Randări 3D AI | Imagine ➜ Model 3D + Video</title>
        <meta
          name="description"
          content="Generează model 3D și video dintr-o imagine. Previzualizare, slider, istoric și descărcare."
        />
      </Head>

      <main className="min-h-screen py-10 px-3 sm:px-6 md:px-12 bg-[#0b0f19] text-white font-sans">
        {/* Alertă eroare */}
        {errorMsg && (
          <div className="max-w-3xl mx-auto mb-5 flex items-center justify-center gap-2 bg-red-900/70 text-red-200 border border-red-800 px-6 py-3 rounded-xl shadow-md">
            <FaExclamationTriangle /> {errorMsg}
          </div>
        )}

        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
          {/* FORMULAR */}
          <form onSubmit={handleSubmit} className={`${glass} ${border} ${rounded} p-8 shadow-2xl flex flex-col gap-6`} noValidate>
            <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-blue-400 via-purple-400 to-purple-700 bg-clip-text text-transparent">
              Imagine ➔ Model 3D + Video
            </h1>

            <label
              htmlFor="upload-image"
              className={`group flex flex-col items-center justify-center min-h-[120px] border-2 border-dashed border-slate-300 dark:border-[#37405a] ${rounded} cursor-pointer hover:border-blue-5[...]
            >
              <FaImage size={34} className="text-blue-500 group-hover:scale-110 transition mb-2" />
              <span className="text-sm text-slate-300">Trage o imagine aici sau apasă pentru a încărca</span>
              <input
                id="upload-image"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  setImageFile(e.target.files?.[0] || null);
                  setOriginalPreview(e.target.files?.[0] ? URL.createObjectURL(e.target.files[0]) : null);
                }}
                className="hidden"
              />
              {originalPreview && (
                <img
                  src={originalPreview}
                  alt="Previzualizare"
                  className="absolute w-24 h-16 rounded-md shadow top-3 right-3 object-cover border-2 border-white"
                />
              )}
            </label>

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center items-center gap-2 py-3 text-base font-semibold ${gradientBtn} ${rounded} hover:scale-105`}
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>Generează 3D + Video</>
              )}
            </button>
          </form>

          {/* PREVIZUALIZARE */}
          <section className={`${glass} ${border} ${rounded} p-8 shadow-2xl flex flex-col gap-6 min-h-[500px] relative`}>
            <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-blue-400 via-purple-400 to-purple-700 bg-clip-text text-transparent">
              Previzualizare
            </h2>

            {loading && <div className="text-center text-lg animate-pulse">⏳ Se generează rezultatul...</div>}

            {/* Before/After custom (fără librărie) */}
            {!loading && originalPreview && videoUrl && (
              <div
                className="relative w-full max-w-full mx-auto rounded-xl overflow-hidden shadow-lg select-none"
                style={{ height: 300 }}
                ref={containerRef}
              >
                {/* baza = imaginea inițială */}
                <img
                  src={originalPreview}
                  alt="Inițial"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {/* overlay = video generat, decupat pe lățime */}
                <div className="absolute inset-0 overflow-hidden" style={{ width: `${reveal}%` }}>
                  <video
                    src={videoUrl}
                    controls
                    className="w-full h-full object-cover"
                    poster={originalPreview || undefined}
                  />
                </div>

                {/* mâner + input range */}
                <div
                  className="absolute top-0 bottom-0 border-l-2 border-white/70"
                  style={{ left: `calc(${reveal}% - 1px)` }}
                />
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={reveal}
                  onChange={(e) => setReveal(Number(e.target.value))}
                  className="absolute left-0 right-0 bottom-2 mx-4"
                  aria-label="Compară înainte/după"
                />
              </div>
            )}

            {!loading && !videoUrl && originalPreview && (
              <img
                src={originalPreview}
                alt="Imagine încărcată"
                className="w-full rounded-lg shadow-lg object-contain max-h-[480px]"
              />
            )}

            {videoUrl && (
              <button
                onClick={() => window.open(videoUrl, "_blank", "noopener,noreferrer")}
                className="absolute top-6 right-10 z-20 flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-full shadow-lg transition"
                title="Descarcă video"
              >
                <FaDownload /> Descarcă video
              </button>
            )}

            {!loading && modelUrl && (
              <div className="mt-6">
                <ModelViewer url={modelUrl} />
              </div>
            )}
          </section>
        </div>

        {/* ISTORIC */}
        {history.length > 0 && (
          <section className={`${glass} ${border} ${rounded} max-w-6xl mx-auto mt-12 p-7 shadow-2xl`}>
            <h2 className="text-xl font-bold text-center bg-gradient-to-r from-blue-400 via-purple-400 to-purple-700 bg-clip-text text-transparent mb-6">
              Istoric generări
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {history.map((item, i) => (
                <div key={i} className="group bg-white/80 dark:bg-[#161b27]/80 rounded-xl p-4 shadow-lg hover:scale-105 transition relative">
                  {item.video ? (
                    <video
                      src={item.video}
                      controls
                      className="w-full rounded-lg"
                      onClick={() => setModalModel(item.video!)}
                      style={{ cursor: "pointer" }}
                    />
                  ) : item.model ? (
                    <ModelViewer url={item.model!} />
                  ) : (
                    <img
                      src={item.image}
                      alt="Imagine"
                      className="w-full rounded-lg object-contain max-h-48"
                      onClick={() => setModalModel(item.image!)}
                      style={{ cursor: "pointer" }}
                    />
                  )}
                  <div className="text-xs text-slate-300 mt-2">{item.date}</div>

                  <div className="absolute flex gap-1 left-2 right-2 -bottom-3 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => window.open(item.video || item.model || item.image, "_blank", "noopener,noreferrer")}
                      className="flex-1 bg-purple-700 hover:bg-purple-800 px-2 py-1 rounded-lg text-white text-xs flex items-center justify-center gap-1"
                    >
                      <FaDownload /> Descarcă
                    </button>
                    <button
                      onClick={() => handleDelete(i)}
                      className="flex-1 bg-red-600 hover:bg-red-700 px-2 py-1 rounded-lg text-white text-xs flex items-center justify-center gap-1"
                    >
                      Șterge
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* MODAL media */}
        {modalModel && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100]" onClick={() => setModalModel(null)}>
            <div className="relative max-w-3xl w-full p-5">
              <button
                onClick={() => setModalModel(null)}
                className="absolute top-3 right-3 bg-slate-900/90 text-white rounded-full p-2 shadow-lg hover:bg-slate-800 transition"
                aria-label="Închide"
              >
                <FaTimes size={20} />
              </button>

              {modalModel.endsWith(".mp4") ? (
                <video src={modalModel} controls className="max-h-[70vh] max-w-full mx-auto rounded-xl shadow-2xl border-4 border-white dark:border-[#23263a]" />
              ) : (
                <img src={modalModel} alt="Previzualizare" className="max-h-[70vh] max-w-full mx-auto rounded-xl shadow-2xl border-4 border-white dark:border-[#23263a]" />
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
}

// ⛑️ Forțăm întreaga pagină să fie client-only (fără SSR/hidratare)
export default dynamic(() => Promise.resolve(Page), { ssr: false });