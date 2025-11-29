"use client";

import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import dynamic from "next/dynamic";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { FaDownload, FaExclamationTriangle, FaImage, FaTimes, FaRocket, FaCube, FaCog } from "react-icons/fa";
import { CREDIT_PACKAGES } from "../lib/credit-packages";

// ModelViewer moved to components/
const ModelViewer = dynamic(() => import("../components/ModelViewer"), { ssr: false });

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

  // Before/After slider
  const [reveal, setReveal] = useState(50);
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
        <meta name="description" content="Generează model 3D și video dintr-o imagine. Previzualizare, slider, istoric și descărcare." />
      </Head>

      <Header />

      <main className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white overflow-hidden">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 px-4">
          {/* Animated Background */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 left-1/4 w-72 h-72 bg-blue-500/30 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl animate-pulse" />
          </div>

          <div className="relative max-w-7xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full border border-white/10 mb-8">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm text-gray-300">🚀 AI-Powered 3D Generation</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Transform
              </span>
              <br />
              <span className="text-white">
                Images to 3D
              </span>
            </h1>
            
            <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed">
              Upload any image and watch our AI create stunning 3D models and videos in seconds. 
              No technical skills required – just pure creative magic.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <button 
                onClick={() => document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="group px-8 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105 flex items-center gap-3"
              >
                <FaRocket className="group-hover:animate-bounce" />
                Start Creating Now
              </button>
              <button className="px-8 py-4 border border-white/20 rounded-2xl font-semibold hover:bg-white/5 transition-all duration-300 flex items-center gap-3">
                <FaImage />
                View Examples
              </button>
            </div>
          </div>
        </section>

        {/* Generator Section */}
        <section id="upload-section" className="py-20 px-4">
          {errorMsg && (
            <div className="max-w-4xl mx-auto mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3">
              <FaExclamationTriangle className="text-red-400" />
              <span className="text-red-300">{errorMsg}</span>
            </div>
          )}

          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12">
            {/* Upload Form */}
            <div className="space-y-8">
              <div className="text-center lg:text-left">
                <h2 className="text-4xl font-bold mb-4">
                  <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Create Your 3D Magic
                  </span>
                </h2>
                <p className="text-gray-400 text-lg">
                  Drop your image below and let our AI work its magic
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6" noValidate>

                <div className="relative">
                  <label
                    htmlFor="upload-image"
                    className="group relative block w-full h-64 border-2 border-dashed border-white/20 rounded-3xl cursor-pointer transition-all duration-300 hover:border-blue-500/50 hover:bg-blue-500/5"
                  >
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      {originalPreview ? (
                        <div className="relative">
                          <img src={originalPreview} alt="Preview" className="w-48 h-32 object-cover rounded-2xl shadow-2xl" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-2xl" />
                          <div className="absolute bottom-3 left-3 right-3 text-center">
                            <p className="text-white text-sm font-medium">Click to change image</p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <FaImage className="text-3xl text-blue-400" />
                          </div>
                          <h3 className="text-xl font-semibold text-white mb-2">Drop your image here</h3>
                          <p className="text-gray-400 text-center max-w-xs">
                            or click to browse • Supports JPG, PNG, WEBP up to 10MB
                          </p>
                        </>
                      )}
                    </div>
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
                  </label>
                </div>

                <button 
                  type="submit" 
                  disabled={loading || !imageFile}
                  className="group relative w-full py-4 px-8 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative flex items-center justify-center gap-3">
                    {loading ? (
                      <>
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Generating Magic...</span>
                      </>
                    ) : (
                      <>
                        <FaRocket className="group-hover:animate-bounce" />
                        <span>Generate 3D Model</span>
                      </>
                    )}
                  </div>
                </button>
              </form>
            </div>

            {/* Preview Section */}
            <div className="space-y-8">
              <div className="text-center lg:text-left">
                <h2 className="text-4xl font-bold mb-4">
                  <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Live Preview
                  </span>
                </h2>
                <p className="text-gray-400 text-lg">
                  Watch your creation come to life in real-time
                </p>
              </div>

              <div className="relative bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 min-h-[500px]">
                {loading && (
                  <div className="flex flex-col items-center justify-center h-full py-20">
                    <div className="w-20 h-20 rounded-full border-4 border-blue-500/30 border-t-blue-500 animate-spin mb-6" />
                    <h3 className="text-2xl font-bold text-white mb-2">Creating Magic</h3>
                    <p className="text-gray-400">Our AI is transforming your image...</p>
                    <div className="flex items-center gap-2 mt-4">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                )}

                {!loading && originalPreview && videoUrl && (
                  <div className="space-y-6">
                    <div className="relative w-full h-80 rounded-2xl overflow-hidden shadow-2xl" ref={containerRef}>
                      <img src={originalPreview} alt="Original" className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0 overflow-hidden transition-all duration-300" style={{ width: `${reveal}%` }}>
                        <video src={videoUrl} controls className="w-full h-full object-cover" poster={originalPreview || undefined} />
                      </div>
                      <div className="absolute top-0 bottom-0 w-1 bg-white/80 shadow-lg" style={{ left: `calc(${reveal}% - 2px)` }} />
                      <input 
                        type="range" 
                        min={0} 
                        max={100} 
                        value={reveal} 
                        onChange={(e) => setReveal(Number(e.target.value))} 
                        className="absolute bottom-4 left-4 right-4 h-2 bg-white/20 rounded-full appearance-none cursor-pointer"
                      />
                    </div>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => window.open(videoUrl, "_blank")} 
                        className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                      >
                        <FaDownload /> Download Video
                      </button>
                      {modelUrl && (
                        <button 
                          onClick={() => window.open(modelUrl, "_blank")} 
                          className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                        >
                          <FaDownload /> Download 3D Model
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {!loading && !videoUrl && originalPreview && (
                  <div className="flex flex-col items-center justify-center h-full py-20">
                    <img src={originalPreview} alt="Uploaded" className="w-64 h-48 object-cover rounded-2xl shadow-2xl mb-6" />
                    <h3 className="text-xl font-semibold text-white mb-2">Ready for Generation</h3>
                    <p className="text-gray-400">Click the generate button to create your 3D model</p>
                  </div>
                )}

                {!loading && !originalPreview && (
                  <div className="flex flex-col items-center justify-center h-full py-20">
                    <div className="w-24 h-24 rounded-full border-4 border-dashed border-gray-600 flex items-center justify-center mb-6">
                      <FaImage className="text-4xl text-gray-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Upload an Image</h3>
                    <p className="text-gray-400">Your generated content will appear here</p>
                  </div>
                )}

                {!loading && modelUrl && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-white mb-4">3D Model Preview</h3>
                    <div className="bg-black/30 rounded-2xl overflow-hidden">
                      <ModelViewer url={modelUrl} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 px-4 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent" />
          <div className="relative max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-5xl font-bold mb-6">
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Powerful Features
                </span>
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                Everything you need to create stunning 3D content from simple images
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="group p-8 bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-xl border border-white/10 rounded-3xl hover:border-blue-500/30 transition-all duration-300 hover:scale-105">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <FaRocket className="text-3xl text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Lightning Fast</h3>
                <p className="text-gray-400 leading-relaxed">Generate 3D models and videos in under 60 seconds with our optimized AI pipeline.</p>
              </div>
              
              <div className="group p-8 bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-xl border border-white/10 rounded-3xl hover:border-purple-500/30 transition-all duration-300 hover:scale-105">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <FaCube className="text-3xl text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">High Quality</h3>
                <p className="text-gray-400 leading-relaxed">State-of-the-art AI models ensure photorealistic 3D outputs with incredible detail.</p>
              </div>
              
              <div className="group p-8 bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-xl border border-white/10 rounded-3xl hover:border-pink-500/30 transition-all duration-300 hover:scale-105">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500/20 to-pink-600/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <FaCog className="text-3xl text-pink-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Easy to Use</h3>
                <p className="text-gray-400 leading-relaxed">No technical skills required. Just upload, click generate, and watch the magic happen.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-5xl font-bold mb-6">
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Simple Pricing
                </span>
              </h2>
              <p className="text-xl text-gray-400">
                Pay only for what you create. No monthly fees.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {CREDIT_PACKAGES.filter(pkg => pkg.id !== 'ultimate').map((pkg, index) => {
                const colors = [
                  { bg: 'from-gray-900/30 to-black/30', text: 'text-blue-400', button: 'bg-blue-600 hover:bg-blue-700' },
                  { bg: 'from-purple-900/50 to-pink-900/30', text: 'text-purple-400', button: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700' },
                  { bg: 'from-gray-900/30 to-black/30', text: 'text-pink-400', button: 'bg-pink-600 hover:bg-pink-700' }
                ];
                const color = colors[index] || colors[0];
                
                return (
                  <div 
                    key={pkg.id} 
                    className={`relative p-8 bg-gradient-to-br ${color.bg} backdrop-blur-xl border ${pkg.popular ? 'border-2 border-purple-500/50 transform scale-105' : 'border-white/10'} rounded-3xl`}
                  >
                    {pkg.popular && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-sm font-bold">
                        Most Popular
                      </div>
                    )}
                    <h3 className="text-2xl font-bold text-white mb-2">{pkg.name}</h3>
                    <div className={`text-4xl font-bold ${color.text} mb-6`}>
                      ${pkg.price} <span className="text-lg text-gray-400">/ {pkg.credits} credits</span>
                      {pkg.bonus && <div className="text-lg text-green-400">+ {pkg.bonus} bonus</div>}
                    </div>
                    <ul className="space-y-3 text-gray-300 mb-8">
                      {pkg.features.map((feature, idx) => (
                        <li key={idx}>✓ {feature}</li>
                      ))}
                    </ul>
                    <a 
                      href="/purchase-credits" 
                      className={`block w-full py-3 px-6 ${color.button} rounded-xl font-semibold transition-all text-center text-white`}
                    >
                      {pkg.id === 'starter' ? 'Get Started' : pkg.id === 'professional' ? 'Choose Pro' : 'Go Enterprise'}
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {history.length > 0 && (
          <section className={`${glass} ${border} ${rounded} max-w-6xl mx-auto mt-12 p-7 shadow-2xl`} id="istoric">
            <h2 className="text-xl font-bold text-center bg-gradient-to-r from-blue-400 via-purple-400 to-purple-700 bg-clip-text text-transparent mb-6">Istoric generări</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {history.map((item, i) => (
                <div key={i} className="group bg-white/80 dark:bg-[#161b27]/80 rounded-xl p-4 shadow-lg hover:scale-105 transition relative">
                  {item.video ? (
                    <video src={item.video} controls className="w-full rounded-lg" onClick={() => setModalModel(item.video!)} style={{ cursor: "pointer" }} />
                  ) : item.model ? (
                    <ModelViewer url={item.model!} />
                  ) : (
                    <img src={item.image} alt="Imagine" className="w-full rounded-lg object-contain max-h-48" onClick={() => setModalModel(item.image!)} style={{ cursor: "pointer" }} />
                  )}
                  <div className="text-xs text-slate-300 mt-2">{item.date}</div>

                  <div className="absolute flex gap-1 left-2 right-2 -bottom-3 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => window.open(item.video || item.model || item.image, "_blank", "noopener,noreferrer")} className="flex-1 bg-purple-700 hover:bg-purple-800 px-2 py-1 rounded-lg text-white text-xs flex items-center justify-center gap-1">
                      <FaDownload /> Descarcă
                    </button>
                    <button onClick={() => handleDelete(i)} className="flex-1 bg-red-600 hover:bg-red-700 px-2 py-1 rounded-lg text-white text-xs flex items-center justify-center gap-1">
                      Șterge
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {modalModel && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100]" onClick={() => setModalModel(null)}>
            <div className="relative max-w-3xl w-full p-5">
              <button onClick={() => setModalModel(null)} className="absolute top-3 right-3 bg-slate-900/90 text-white rounded-full p-2 shadow-lg hover:bg-slate-800 transition" aria-label="Închide">
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

      <Footer />
    </>
  );
}

export default dynamic(() => Promise.resolve(Page), { ssr: false });