"use client";

import React, { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { CREDIT_PACKAGES } from "../lib/credit-packages";
import { FaCheck, FaCrown, FaRocket, FaSpinner, FaArrowLeft } from "react-icons/fa";

interface User {
  id: string;
  username: string;
  email: string;
  credits: number;
}

export default function PurchaseCredits() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/auth/me', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        // Redirect to login if not authenticated
        router.push('/login?redirect=/purchase-credits');
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      router.push('/login?redirect=/purchase-credits');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (packageId: string) => {
    if (!user || purchasing) return;

    setPurchasing(packageId);

    try {
      const response = await fetch('/api/payments/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          packageId,
          successUrl: `${window.location.origin}/purchase-success`,
          cancelUrl: `${window.location.origin}/purchase-credits`,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          throw new Error('No checkout URL received');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      alert('Eroare la procesarea plății. Te rugăm să încerci din nou.');
    } finally {
      setPurchasing(null);
    }
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>Cumpără Credite | 3DView.ai</title>
        </Head>
        <Header />
        <main className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black flex items-center justify-center">
          <div className="flex items-center gap-3 text-white">
            <FaSpinner className="animate-spin text-2xl text-blue-400" />
            <span className="text-xl">Se încarcă...</span>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Cumpără Credite | 3DView.ai</title>
        <meta name="description" content="Cumpără credite pentru a genera modele 3D uimitoare cu AI. Pachete flexibile pentru toate nevoile." />
      </Head>

      <Header />

      <main className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white pt-24 pb-12">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl animate-pulse" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4">
          {/* Header Section */}
          <div className="text-center mb-16">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
            >
              <FaArrowLeft /> Înapoi
            </button>

            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full border border-white/10 mb-8">
              <FaRocket className="text-blue-400" />
              <span className="text-sm">Credite pentru generări AI</span>
            </div>

            <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Cumpără Credite
              </span>
            </h1>

            <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-8">
              Alege pachetul perfect pentru nevoile tale. Fără abonamente, plătești doar pentru ce folosești.
            </p>

            {user && (
              <div className="inline-flex items-center gap-4 px-6 py-3 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
                <div>
                  <span className="text-sm text-gray-400">Credite curente:</span>
                  <span className="text-2xl font-bold text-blue-400 ml-2">{user.credits}</span>
                </div>
              </div>
            )}
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {CREDIT_PACKAGES.map((pkg, index) => {
              const isPurchasing = purchasing === pkg.id;
              
              return (
                <div 
                  key={pkg.id}
                  className={`relative group ${pkg.popular ? 'md:scale-105' : ''}`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                      <div className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-sm font-bold flex items-center gap-2">
                        <FaCrown /> Cel mai popular
                      </div>
                    </div>
                  )}

                  <div className={`h-full p-8 bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-xl border rounded-3xl transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
                    pkg.popular 
                      ? 'border-2 border-purple-500/50 shadow-2xl shadow-purple-500/20' 
                      : 'border-white/10 hover:border-white/20'
                  }`}>
                    
                    {/* Package Icon */}
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${
                      pkg.popular 
                        ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20' 
                        : 'bg-gradient-to-br from-blue-500/20 to-blue-600/20'
                    }`}>
                      {pkg.id === 'ultimate' ? (
                        <FaCrown className={`text-3xl ${pkg.popular ? 'text-purple-400' : 'text-blue-400'}`} />
                      ) : (
                        <FaRocket className={`text-3xl ${pkg.popular ? 'text-purple-400' : 'text-blue-400'}`} />
                      )}
                    </div>

                    {/* Package Info */}
                    <h3 className="text-2xl font-bold text-white mb-2">{pkg.name}</h3>
                    
                    <div className="mb-6">
                      <div className={`text-4xl font-bold mb-2 ${
                        pkg.popular ? 'text-purple-400' : 'text-blue-400'
                      }`}>
                        ${pkg.price}
                      </div>
                      <div className="text-lg text-gray-400">
                        {pkg.credits} credite
                        {pkg.bonus && (
                          <span className="text-green-400 block">+ {pkg.bonus} bonus</span>
                        )}
                      </div>
                    </div>

                    {/* Features */}
                    <ul className="space-y-3 mb-8 flex-1">
                      {pkg.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-3 text-gray-300">
                          <FaCheck className="text-green-400 text-sm flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Purchase Button */}
                    <button
                      onClick={() => handlePurchase(pkg.id)}
                      disabled={isPurchasing}
                      className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3 ${
                        pkg.popular
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-purple-500/25'
                          : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-blue-500/25'
                      } ${isPurchasing ? 'opacity-75 cursor-not-allowed' : 'hover:scale-105'}`}
                    >
                      {isPurchasing ? (
                        <>
                          <FaSpinner className="animate-spin" />
                          Procesez...
                        </>
                      ) : (
                        <>
                          <FaRocket />
                          Cumpără Acum
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* FAQ or Additional Info */}
          <div className="mt-20 text-center">
            <h2 className="text-3xl font-bold mb-8">Întrebări Frecvente</h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="p-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
                <h3 className="text-xl font-semibold mb-3">Creditele expiră?</h3>
                <p className="text-gray-400">Nu, creditele tale nu expiră niciodată. Le poți folosi oricând vrei.</p>
              </div>
              <div className="p-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
                <h3 className="text-xl font-semibold mb-3">Pot să returnez creditele?</h3>
                <p className="text-gray-400">Creditele nefolosite pot fi returnate în termen de 30 de zile.</p>
              </div>
              <div className="p-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
                <h3 className="text-xl font-semibold mb-3">Sunt securizate plățile?</h3>
                <p className="text-gray-400">Da, folosim Stripe pentru procesarea securizată a plăților.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}