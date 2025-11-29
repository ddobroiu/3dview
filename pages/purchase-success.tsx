"use client";

import React, { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { FaCheck, FaSpinner, FaTimes, FaCoins } from "react-icons/fa";

export default function PurchaseSuccess() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [purchaseDetails, setPurchaseDetails] = useState<{
    credits: number;
    amount: number;
    currency: string;
  } | null>(null);

  const glass = "bg-white/80 dark:bg-[#151a23]/70 backdrop-blur-xl";
  const border = "border border-slate-200 dark:border-[#23263a]";
  const rounded = "rounded-2xl";

  useEffect(() => {
    const { session_id } = router.query;
    
    if (session_id) {
      // Verify purchase
      fetch('/api/payments/verify-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId: session_id }),
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          setStatus('success');
          setPurchaseDetails(data.purchase);
        } else {
          setStatus('error');
        }
      })
      .catch(() => {
        setStatus('error');
      });
    }
  }, [router.query]);

  const getIcon = () => {
    switch (status) {
      case 'success':
        return <FaCheck className="text-6xl text-green-500 mb-4" />;
      case 'error':
        return <FaTimes className="text-6xl text-red-500 mb-4" />;
      default:
        return <FaSpinner className="text-6xl text-blue-500 animate-spin mb-4" />;
    }
  };

  const getTitle = () => {
    switch (status) {
      case 'success':
        return 'Plata a fost procesată cu succes!';
      case 'error':
        return 'A apărut o problemă cu plata';
      default:
        return 'Verificăm plata...';
    }
  };

  const getMessage = () => {
    switch (status) {
      case 'success':
        return 'Creditele au fost adăugate în contul dumneavoastră și puteți începe să generați modele 3D.';
      case 'error':
        return 'Nu am putut verifica plata. Dacă ați fost facturat, vă rugăm să ne contactați.';
      default:
        return 'Vă rugăm să așteptați în timp ce verificăm plata cu Stripe...';
    }
  };

  return (
    <>
      <Head>
        <title>Confirmare plată - 3D Generator</title>
        <meta name="description" content="Confirmarea plății pentru credite" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-100 dark:from-[#0a0b14] dark:via-[#151a23] dark:to-[#1a1625] text-slate-900 dark:text-white">
        <Header />
        
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto">
            <div className={`${glass} ${border} ${rounded} p-12 text-center`}>
              {getIcon()}
              
              <h1 className="text-3xl font-bold mb-4">{getTitle()}</h1>
              <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
                {getMessage()}
              </p>

              {status === 'success' && purchaseDetails && (
                <div className="mb-8 p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <FaCoins className="text-yellow-500" />
                    <span className="font-semibold text-lg">
                      {purchaseDetails.credits} credite adăugate
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Plată procesată: {purchaseDetails.amount} {purchaseDetails.currency}
                  </p>
                </div>
              )}

              <div className="space-y-4">
                {status === 'success' && (
                  <>
                    <button
                      onClick={() => router.push('/dashboard')}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200"
                    >
                      Începe să generezi modele 3D
                    </button>
                    <button
                      onClick={() => router.push('/dashboard?tab=credits')}
                      className="w-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 py-3 px-6 rounded-xl font-medium transition-colors"
                    >
                      Vezi istoricul creditelor
                    </button>
                  </>
                )}

                {status === 'error' && (
                  <>
                    <button
                      onClick={() => router.push('/dashboard?tab=credits')}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-xl font-semibold transition-colors"
                    >
                      Încearcă din nou
                    </button>
                    <a
                      href="mailto:support@3dgen.com"
                      className="block w-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 py-3 px-6 rounded-xl font-medium text-center transition-colors"
                    >
                      Contactează suportul
                    </a>
                  </>
                )}

                {status === 'loading' && (
                  <div className="text-gray-500">
                    Nu închideți această pagină până la finalizarea verificării...
                  </div>
                )}
              </div>
            </div>

            {/* Additional Info */}
            <div className={`${glass} ${border} ${rounded} p-6 mt-8`}>
              <h3 className="font-semibold mb-3">Ce urmează?</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Creditele sunt disponibile imediat în contul dumneavoastră</li>
                <li>• Fiecare generare standard costă 1 credit</li>
                <li>• Generările de înaltă calitate costă 2-5 credite</li>
                <li>• Creditele nu expiră niciodată</li>
                <li>• Primiți credite bonus zilnic în funcție de planul ales</li>
              </ul>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}