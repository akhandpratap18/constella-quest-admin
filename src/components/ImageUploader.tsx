'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, Sparkles, X, Loader2 } from 'lucide-react';

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
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#6B7280]">
          Cover Artwork
        </label>
        {defaultFallbackUrl && defaultFallbackUrl !== currentImageUrl && (
          <button
            type="button"
            onClick={() => onImageChange(defaultFallbackUrl)}
            className="btn-glass px-2.5 py-0.5 text-[11px] font-mono text-[#5B8CFF] hover:text-white flex items-center space-x-1"
          >
            <Sparkles className="w-3 h-3 text-[#5B8CFF]" />
            <span>Official Artwork</span>
          </button>
        )}
      </div>

      {currentImageUrl ? (
        <div className="relative rounded-2xl overflow-hidden border border-white/[0.08] bg-black/60 group">
          <div className="aspect-[16/9] w-full relative overflow-hidden flex items-center justify-center bg-black">
            <img
              src={currentImageUrl}
              alt="Quest Cover"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
          </div>

          <div className="absolute bottom-2.5 right-2.5 flex items-center space-x-1.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn-glass px-2.5 py-1 text-xs font-mono text-[#9CA3AF] hover:text-white"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={() => onImageChange('')}
              className="btn-glass p-1.5 text-[#6B7280] hover:text-rose-400 hover:border-rose-500/30 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
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
          className={`border border-dashed rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${
            dragOver
              ? 'border-[#5B8CFF] bg-[#2F5BFF]/10 shadow-[0_0_24px_rgba(47,91,255,0.25)]'
              : 'border-white/[0.08] bg-black/40 hover:border-white/[0.16] hover:bg-white/[0.02]'
          }`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center space-y-2">
              <Loader2 className="w-6 h-6 text-[#5B8CFF] animate-spin" />
              <p className="text-xs text-[#9CA3AF] font-mono">Uploading to Supabase...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[#5B8CFF]">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-white">
                  Drop artwork here, or <span className="text-[#5B8CFF] underline">browse</span>
                </p>
                <p className="text-[10px] text-[#6B7280] font-mono mt-0.5">PNG, JPG, or WebP</p>
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
