"use client";

import React, { useState, useEffect } from "react";
import Head from "next/head";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ImageUploader from "../components/ImageUploader";
import dynamic from "next/dynamic";
import { 
  FaCoins, 
  FaHistory, 
  FaCreditCard, 
  FaCog, 
  FaDownload, 
  FaEye, 
  FaSpinner,
  FaCheck,
  FaTimes
} from "react-icons/fa";

const ModelViewer = dynamic(() => import("../components/ModelViewer"), { ssr: false });

interface UserData {
  credits: number;
  totalUsed: number;
  subscriptionTier: string;
  history: Array<{
    id: string;
    amount: number;
    type: string;
    description: string;
    createdAt: string;
  }>;
}

interface Generation {
  id: string;
  originalImageUrl: string;
  prompt?: string;
  videoUrl?: string;
  modelUrl?: string;
  status: string;
  creditsCost: number;
  quality: string;
  createdAt: string;
  completedAt?: string;
  processingTime?: number;
}

export default function Dashboard() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState<'STANDARD' | 'HIGH' | 'ULTRA'>('STANDARD');
  const [selectedProvider, setSelectedProvider] = useState<'meshy' | 'luma' | 'tripo' | 'stability'>('meshy');
  const [prompt, setPrompt] = useState('');
  const [activeTab, setActiveTab] = useState<'upload' | 'history' | 'credits'>('upload');
  const [modalModel, setModalModel] = useState<string | null>(null);

  const glass = "bg-white/80 dark:bg-[#151a23]/70 backdrop-blur-xl";
  const border = "border border-slate-200 dark:border-[#23263a]";
  const rounded = "rounded-2xl";

  const aiProviders = {
    meshy: { name: 'Meshy AI', description: 'Rapid și accesibil', logo: '🎯' },
    luma: { name: 'Luma AI', description: 'Calitate premium', logo: '⭐' },
    tripo: { name: 'Tripo AI', description: 'Cel mai rapid', logo: '⚡' },
    stability: { name: 'Stability AI', description: 'Enterprise grade', logo: '🏢' }
  };

  const getQualityOptions = (provider: string) => {
    const costs = {
      meshy: { STANDARD: 1, HIGH: 2, ULTRA: 3 },
      luma: { STANDARD: 1, HIGH: 3, ULTRA: 5 },
      tripo: { STANDARD: 1, HIGH: 2, ULTRA: 3 },
      stability: { STANDARD: 2, HIGH: 3, ULTRA: 4 }
    };
    
    const times = {
      meshy: { STANDARD: '~2-4min', HIGH: '~4-6min', ULTRA: '~6-10min' },
      luma: { STANDARD: '~3-5min', HIGH: '~5-8min', ULTRA: '~8-12min' },
      tripo: { STANDARD: '~30-60s', HIGH: '~1-2min', ULTRA: '~2-3min' },
      stability: { STANDARD: '~2-3min', HIGH: '~4-6min', ULTRA: '~6-8min' }
    };

    const providerCosts = costs[provider as keyof typeof costs] || costs.meshy;
    const providerTimes = times[provider as keyof typeof times] || times.meshy;

    return {
      STANDARD: { 
        name: 'Standard', 
        credits: providerCosts.STANDARD, 
        time: providerTimes.STANDARD, 
        description: 'Calitate bună pentru previzualizare' 
      },
      HIGH: { 
        name: 'High Quality', 
        credits: providerCosts.HIGH, 
        time: providerTimes.HIGH, 
        description: 'Calitate superioară pentru rezultate profesionale' 
      },
      ULTRA: { 
        name: 'Ultra Quality', 
        credits: providerCosts.ULTRA, 
        time: providerTimes.ULTRA, 
        description: 'Cea mai înaltă calitate disponibilă' 
      },
    };
  };

  useEffect(() => {
    fetchUserData();
    fetchGenerations();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user/credits');
      if (response.ok) {
        const data = await response.json();
        setUserData(data);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGenerations = async () => {
    try {
      const response = await fetch('/api/user/generations');
      if (response.ok) {
        const data = await response.json();
        setGenerations(data.generations);
      }
    } catch (error) {
      console.error('Error fetching generations:', error);
    }
  };

  const handleGenerate = async () => {
    const qualityOptions = getQualityOptions(selectedProvider);
    if (!selectedImage || !userData || userData.credits < qualityOptions[selectedQuality].credits) {
      return;
    }

    setGenerating(true);
    
    try {
      // Upload image first
      const formData = new FormData();
      formData.append('image', selectedImage);
      
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image');
      }
      
      const { imageUrl } = await uploadResponse.json();

      // Generate 3D model
      const response = await fetch('/api/generate-3d-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl,
          prompt,
          quality: selectedQuality,
          provider: selectedProvider,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Generation failed');
      }

      const result = await response.json();
      
      // Refresh data
      await fetchUserData();
      await fetchGenerations();
      
      // Reset form
      setSelectedImage(null);
      setImagePreview(null);
      setPrompt('');
      
      alert(`Generare completă! Credite rămase: ${result.remainingCredits}`);

    } catch (error) {
      console.error('Generation error:', error);
      alert(error instanceof Error ? error.message : 'Eroare în timpul generării');
    } finally {
      setGenerating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <FaCheck className="text-green-500" />;
      case 'FAILED': return <FaTimes className="text-red-500" />;
      case 'PROCESSING': return <FaSpinner className="text-blue-500 animate-spin" />;
      default: return <FaSpinner className="text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FaSpinner className="text-4xl animate-spin text-blue-500" />
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Nu sunteți autentificat</h2>
          <a href="/login" className="text-blue-600 hover:text-blue-700">
            Faceți login pentru a continua
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Dashboard - 3D Generator</title>
        <meta name="description" content="Generați modele 3D din imagini folosind AI" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-100 dark:from-[#0a0b14] dark:via-[#151a23] dark:to-[#1a1625] text-slate-900 dark:text-white">
        <Header />
        
        <main className="container mx-auto px-4 py-8">
          {/* Header Stats */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`${glass} ${border} ${rounded} p-6`}>
                <div className="flex items-center space-x-3">
                  <FaCoins className="text-2xl text-yellow-500" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Credite disponibile</p>
                    <p className="text-2xl font-bold">{userData.credits}</p>
                  </div>
                </div>
              </div>
              
              <div className={`${glass} ${border} ${rounded} p-6`}>
                <div className="flex items-center space-x-3">
                  <FaHistory className="text-2xl text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total folosite</p>
                    <p className="text-2xl font-bold">{userData.totalUsed}</p>
                  </div>
                </div>
              </div>
              
              <div className={`${glass} ${border} ${rounded} p-6`}>
                <div className="flex items-center space-x-3">
                  <FaCog className="text-2xl text-purple-500" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Plan</p>
                    <p className="text-xl font-bold">{userData.subscriptionTier}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mb-8">
            <div className={`${glass} ${border} ${rounded} p-2 inline-flex`}>
              <button
                onClick={() => setActiveTab('upload')}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'upload' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                Generează 3D
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'history' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                Istoric generări
              </button>
              <button
                onClick={() => setActiveTab('credits')}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'credits' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                Istoric credite
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'upload' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <ImageUploader
                  onImageSelect={(file, preview) => {
                    setSelectedImage(file);
                    setImagePreview(preview);
                  }}
                  onImageRemove={() => {
                    setSelectedImage(null);
                    setImagePreview(null);
                  }}
                  selectedImage={selectedImage}
                  imagePreview={imagePreview}
                  credits={userData.credits}
                  isProcessing={generating}
                />

                {selectedImage && (
                  <div className={`${glass} ${border} ${rounded} p-6 mt-6`}>
                    <h3 className="text-lg font-semibold mb-4">Setări generare</h3>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">
                        Prompt (opțional)
                      </label>
                      <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Descrieți modelul 3D dorit..."
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50"
                        rows={3}
                        disabled={generating}
                      />
                    </div>

                    <div className="mb-6">
                      <label className="block text-sm font-medium mb-2">
                        AI Provider
                      </label>
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        {Object.entries(aiProviders).map(([key, provider]) => (
                          <label key={key} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                            <input
                              type="radio"
                              name="provider"
                              value={key}
                              checked={selectedProvider === key}
                              onChange={(e) => setSelectedProvider(e.target.value as any)}
                              disabled={generating}
                              className="text-blue-600"
                            />
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="text-lg">{provider.logo}</span>
                                <span className="font-medium">{provider.name}</span>
                              </div>
                              <p className="text-xs text-gray-500">{provider.description}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="mb-6">
                      <label className="block text-sm font-medium mb-2">
                        Calitate
                      </label>
                      <div className="space-y-2">
                        {Object.entries(getQualityOptions(selectedProvider)).map(([key, option]) => (
                          <label key={key} className="flex items-center space-x-3">
                            <input
                              type="radio"
                              name="quality"
                              value={key}
                              checked={selectedQuality === key}
                              onChange={(e) => setSelectedQuality(e.target.value as any)}
                              disabled={generating || userData.credits < option.credits}
                              className="text-blue-600"
                            />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{option.name}</span>
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm text-gray-500">{option.time}</span>
                                  <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs font-medium">
                                    {option.credits} {option.credits === 1 ? 'credit' : 'credite'}
                                  </span>
                                </div>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {option.description}
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={handleGenerate}
                      disabled={
                        generating || 
                        !selectedImage || 
                        userData.credits < getQualityOptions(selectedProvider)[selectedQuality].credits
                      }
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200"
                    >
                      {generating ? (
                        <div className="flex items-center justify-center space-x-2">
                          <FaSpinner className="animate-spin" />
                          <span>Generez model 3D...</span>
                        </div>
                      ) : (
                        `Generează pentru ${getQualityOptions(selectedProvider)[selectedQuality].credits} ${getQualityOptions(selectedProvider)[selectedQuality].credits === 1 ? 'credit' : 'credite'}`
                      )}
                    </button>
                  </div>
                )}
              </div>

              <div>
                <div className={`${glass} ${border} ${rounded} p-6`}>
                  <h3 className="text-lg font-semibold mb-4">Generări recente</h3>
                  {generations.slice(0, 3).map((gen) => (
                    <div key={gen.id} className="flex items-center space-x-3 p-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                      {getStatusIcon(gen.status)}
                      <img 
                        src={gen.originalImageUrl} 
                        alt="Original" 
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{gen.quality} Quality</p>
                        <p className="text-sm text-gray-500">
                          {new Date(gen.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-1">
                        {gen.videoUrl && (
                          <button className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-lg">
                            <FaEye />
                          </button>
                        )}
                        {gen.modelUrl && (
                          <button 
                            onClick={() => setModalModel(gen.modelUrl!)}
                            className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900 rounded-lg"
                          >
                            <FaDownload />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className={`${glass} ${border} ${rounded} p-6`}>
              <h3 className="text-xl font-semibold mb-6">Istoric generări</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {generations.map((gen) => (
                  <div key={gen.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      {getStatusIcon(gen.status)}
                      <span className="text-sm text-gray-500">
                        {gen.quality} • {gen.creditsCost} {gen.creditsCost === 1 ? 'credit' : 'credite'}
                      </span>
                    </div>
                    <img 
                      src={gen.originalImageUrl} 
                      alt="Original" 
                      className="w-full h-32 object-cover rounded-lg mb-3"
                    />
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {new Date(gen.createdAt).toLocaleDateString('ro-RO')}
                    </p>
                    {gen.prompt && (
                      <p className="text-sm mb-2 line-clamp-2">{gen.prompt}</p>
                    )}
                    <div className="flex space-x-2">
                      {gen.videoUrl && (
                        <a 
                          href={gen.videoUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-3 rounded text-sm transition-colors"
                        >
                          Video
                        </a>
                      )}
                      {gen.modelUrl && (
                        <button 
                          onClick={() => setModalModel(gen.modelUrl!)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded text-sm transition-colors"
                        >
                          Model 3D
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'credits' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className={`${glass} ${border} ${rounded} p-6`}>
                <h3 className="text-xl font-semibold mb-6">Cumpără credite</h3>
                <div className="space-y-4">
                  {[
                    { name: 'Starter Pack', credits: 50, price: 19.99, bonus: 5 },
                    { name: 'Popular Pack', credits: 150, price: 49.99, bonus: 25, popular: true },
                    { name: 'Pro Pack', credits: 500, price: 149.99, bonus: 100 },
                    { name: 'Ultimate Pack', credits: 1500, price: 399.99, bonus: 500 },
                  ].map((pack) => (
                    <div 
                      key={pack.name} 
                      className={`border rounded-lg p-4 ${pack.popular ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{pack.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {pack.credits} credite + {pack.bonus} bonus
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">{pack.price} RON</p>
                          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm transition-colors">
                            Cumpără
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`${glass} ${border} ${rounded} p-6`}>
                <h3 className="text-xl font-semibold mb-6">Istoric tranzacții</h3>
                <div className="space-y-3">
                  {userData.history.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(transaction.createdAt).toLocaleDateString('ro-RO')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.amount >= 0 ? '+' : ''}{transaction.amount}
                        </p>
                        <p className="text-xs text-gray-500">{transaction.type}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Model Viewer Modal */}
        {modalModel && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Model 3D</h3>
                <button 
                  onClick={() => setModalModel(null)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <FaTimes size={24} />
                </button>
              </div>
              <div className="h-96">
                <ModelViewer modelUrl={modalModel} />
              </div>
              <div className="mt-4 flex space-x-4">
                <a 
                  href={modalModel} 
                  download
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  <FaDownload className="inline mr-2" />
                  Descarcă modelul
                </a>
              </div>
            </div>
          </div>
        )}

        <Footer />
      </div>
    </>
  );
}