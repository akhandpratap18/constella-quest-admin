'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, Check, Loader2, Sparkles, X } from 'lucide-react';

interface ImageUploaderProps {
  currentImageUrl: string;
  defaultFallbackUrl?: string;
  onImageChange: (url: string) => void;
}

export default function ImageUploader({
  currentImageUrl,
  defaultFallbackUrl,
  onImageChange,
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      onImageChange(data.url);
    } catch (err: any) {
      setError(err.message || 'Failed to upload image.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-blue-400 font-mono">
          Quest Cover Artwork
        </label>
        {defaultFallbackUrl && defaultFallbackUrl !== currentImageUrl && (
          <button
            type="button"
            onClick={() => onImageChange(defaultFallbackUrl)}
            className="flex items-center space-x-1 text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Use Official Artwork</span>
          </button>
        )}
      </div>

      {currentImageUrl ? (
        <div className="relative rounded-2xl overflow-hidden border border-white/[0.08] bg-black/60 shadow-glass-card group">
          <div className="aspect-[16/9] sm:aspect-[21/9] w-full relative overflow-hidden flex items-center justify-center bg-black">
            <img
              src={currentImageUrl}
              alt="Quest Cover"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
          </div>

          <div className="absolute bottom-3 right-3 flex items-center space-x-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg bg-black/80 hover:bg-black/95 backdrop-blur-md border border-blue-500/40 text-blue-300 text-xs font-medium transition-all shadow-md"
            >
              Replace Image
            </button>
            <button
              type="button"
              onClick={() => onImageChange('')}
              className="p-1.5 rounded-lg bg-black/80 hover:bg-rose-500/20 backdrop-blur-md border border-white/10 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 text-xs transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
            dragOver
              ? 'border-blue-400 bg-blue-500/10 shadow-[0_0_25px_rgba(37,99,235,0.25)]'
              : 'border-white/[0.08] bg-black/30 hover:border-blue-500/40 hover:bg-blue-950/20'
          }`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center space-y-2">
              <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
              <p className="text-xs text-blue-300 font-mono">Uploading to Supabase Storage...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-inner">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  Drop quest cover image here, or <span className="text-blue-400 underline">browse</span>
                </p>
                <p className="text-xs text-slate-400 mt-0.5">High-res PNG, JPG, or WebP (16:9 recommended)</p>
              </div>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-xs text-rose-400 font-mono">{error}</p>}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileUpload(e.target.files[0]);
          }
        }}
      />
    </div>
  );
}
