"use client";

import { useState, useRef, useCallback } from "react";
import { FaUpload, FaImage, FaTimes, FaCoins, FaCreditCard } from "react-icons/fa";

interface ImageUploaderProps {
  onImageSelect: (file: File, preview: string) => void;
  onImageRemove: () => void;
  selectedImage: File | null;
  imagePreview: string | null;
  credits?: number;
  isProcessing?: boolean;
}

export default function ImageUploader({
  onImageSelect,
  onImageRemove,
  selectedImage,
  imagePreview,
  credits = 0,
  isProcessing = false
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      handleFileSelect(imageFile);
    }
  }, []);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Vă rugăm selectați doar fișiere imagine.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      alert('Imaginea este prea mare. Mărimea maximă este 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = e.target?.result as string;
      onImageSelect(file, preview);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemoveImage = () => {
    onImageRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const glass = "bg-white/80 dark:bg-[#151a23]/70 backdrop-blur-xl";
  const border = "border border-slate-200 dark:border-[#23263a]";
  const rounded = "rounded-2xl";

  return (
    <div className="space-y-4">
      {/* Credits Display */}
      <div className={`${glass} ${border} ${rounded} p-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FaCoins className="text-yellow-500" />
            <span className="font-medium">Credite disponibile: {credits}</span>
          </div>
          <button 
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
            onClick={() => window.location.href = '/purchase-credits'}
          >
            <FaCreditCard size={16} />
            <span className="text-sm">Cumpără credite</span>
          </button>
        </div>
        {credits < 1 && (
          <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg">
            <p className="text-red-700 dark:text-red-300 text-sm">
              Nu aveți suficiente credite pentru a genera modele 3D.
            </p>
          </div>
        )}
      </div>

      {/* Image Upload Area */}
      <div
        className={`${glass} ${border} ${rounded} p-8 transition-all duration-300 ${
          isDragging 
            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20' 
            : 'hover:border-blue-300 dark:hover:border-blue-600'
        } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {!selectedImage ? (
          <div className="text-center">
            <div className="mx-auto w-16 h-16 mb-4 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <FaUpload className="text-2xl text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Încarcă o imagine</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Trage și plasează imaginea aici sau fă clic pentru a selecta
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={credits < 1 || isProcessing}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-medium transition-colors"
            >
              Selectează imaginea
            </button>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
              Formate acceptate: JPG, PNG, WebP • Mărime max: 10MB
            </p>
          </div>
        ) : (
          <div className="relative">
            <div className="relative group">
              <img
                src={imagePreview!}
                alt="Preview"
                className="w-full h-64 object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center">
                <button
                  onClick={handleRemoveImage}
                  disabled={isProcessing}
                  className="bg-red-500 hover:bg-red-600 disabled:bg-gray-500 text-white p-2 rounded-full transition-colors"
                >
                  <FaTimes />
                </button>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FaImage className="text-green-500" />
                <span className="font-medium">{selectedImage.name}</span>
                <span className="text-sm text-gray-500">
                  ({(selectedImage.size / (1024 * 1024)).toFixed(2)} MB)
                </span>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="text-blue-600 hover:text-blue-700 disabled:text-gray-400 text-sm font-medium transition-colors"
              >
                Schimbă imaginea
              </button>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>

      {/* Generation Cost Info */}
      {selectedImage && (
        <div className={`${glass} ${border} ${rounded} p-4`}>
          <h4 className="font-medium mb-2">Cost generare:</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Standard (1 credit)</span>
              <span className="text-gray-500">~30 secunde</span>
            </div>
            <div className="flex justify-between">
              <span>High Quality (2 credite)</span>
              <span className="text-gray-500">~60 secunde</span>
            </div>
            <div className="flex justify-between">
              <span>Ultra Quality (5 credite)</span>
              <span className="text-gray-500">~120 secunde</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}