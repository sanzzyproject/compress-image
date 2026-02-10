'use client';

import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, Image as ImageIcon, Download, X, Settings2, FileBarChart, CheckCircle2, AlertCircle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility untuk merging class tailwind
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Format bytes ke ukuran yang mudah dibaca
const formatBytes = (bytes, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export default function Home() {
  const [file, setFile] = useState(null);
  const [previewOriginal, setPreviewOriginal] = useState(null);
  const [previewCompressed, setPreviewCompressed] = useState(null);
  const [compressedBlob, setCompressedBlob] = useState(null);
  
  const [quality, setQuality] = useState(70);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ original: 0, compressed: 0, saved: 0 });

  // Handle Drag & Drop
  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    validateAndSetFile(droppedFile);
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    validateAndSetFile(selectedFile);
  };

  const validateAndSetFile = (selectedFile) => {
    setError(null);
    if (!selectedFile) return;

    // Validasi Ukuran (20MB)
    if (selectedFile.size > 20 * 1024 * 1024) {
      setError('Ukuran file melebihi 20MB.');
      return;
    }

    // Validasi Tipe
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(selectedFile.type)) {
      setError('Format tidak didukung. Gunakan JPG, PNG, atau WEBP.');
      return;
    }

    // Reset State
    setFile(selectedFile);
    setPreviewCompressed(null);
    setCompressedBlob(null);
    setStats({ original: selectedFile.size, compressed: 0, saved: 0 });
    
    // Create Preview URL
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewOriginal(objectUrl);
  };

  // Fungsi Compress
  const handleCompress = async () => {
    if (!file) return;
    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('quality', quality);

    try {
      const response = await fetch('/api/compress', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Gagal mengompres gambar.');
      }

      const blob = await response.blob();
      const compressedUrl = URL.createObjectURL(blob);
      
      setCompressedBlob(blob);
      setPreviewCompressed(compressedUrl);

      // Hitung Statistik
      const originalSize = file.size;
      const compressedSize = blob.size;
      const saved = ((originalSize - compressedSize) / originalSize) * 100;

      setStats({
        original: originalSize,
        compressed: compressedSize,
        saved: saved > 0 ? saved.toFixed(1) : 0,
      });

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto Download Trigger (Optional, but user friendly manual download is better)
  const downloadImage = () => {
    if (!compressedBlob) return;
    const link = document.createElement('a');
    link.href = previewCompressed;
    link.download = `compressed_${file.name}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Cleanup memory
  useEffect(() => {
    return () => {
      if (previewOriginal) URL.revokeObjectURL(previewOriginal);
      if (previewCompressed) URL.revokeObjectURL(previewCompressed);
    };
  }, [previewOriginal, previewCompressed]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans text-slate-800 pb-20">
      {/* --- HEADER --- */}
      <header className="sticky top-0 z-50 w-full border-b border-white/20 bg-white/80 backdrop-blur-md shadow-sm transition-all">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <ImageIcon className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-900">SANN<span className="text-blue-600">COMPRESS</span></span>
          </div>
          <a href="#" className="hidden sm:block text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">
            Versi 1.0 (Beta)
          </a>
        </div>
      </header>

      <main className="container mx-auto px-4 pt-10 md:pt-16 max-w-5xl">
        
        {/* --- HERO / EXPLAINER --- */}
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            Optimalkan Gambar <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
              Tanpa Mengorbankan Kualitas
            </span>
          </h1>
          <p className="text-slate-500 max-w-2xl mx-auto text-lg leading-relaxed">
            Web ini digunakan untuk mengompres gambar secara online menggunakan teknologi serverless. 
            Semua file diproses sementara dan tidak disimpan demi menjaga privasi pengguna.
          </p>
        </div>

        {/* --- UPLOAD AREA --- */}
        {!file && (
          <div 
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="group relative border-2 border-dashed border-slate-300 hover:border-blue-500 bg-white rounded-3xl p-10 md:p-16 transition-all duration-300 ease-out cursor-pointer shadow-sm hover:shadow-xl hover:shadow-blue-500/10"
          >
            <input 
              type="file" 
              accept="image/png, image/jpeg, image/webp" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileSelect}
            />
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-10 h-10" />
              </div>
              <div>
                <p className="text-xl font-semibold text-slate-900">Drag & Drop gambar di sini</p>
                <p className="text-slate-500 mt-2">atau klik untuk memilih file</p>
              </div>
              <div className="flex gap-3 text-xs font-medium text-slate-400 uppercase tracking-wider mt-4">
                <span className="bg-slate-100 px-3 py-1 rounded-full">JPG</span>
                <span className="bg-slate-100 px-3 py-1 rounded-full">PNG</span>
                <span className="bg-slate-100 px-3 py-1 rounded-full">WEBP</span>
                <span className="bg-slate-100 px-3 py-1 rounded-full">Max 20MB</span>
              </div>
            </div>
          </div>
        )}

        {/* --- ERROR MESSAGE --- */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
            <button onClick={() => setError(null)} className="ml-auto hover:bg-red-100 p-1 rounded-full"><X className="w-4 h-4"/></button>
          </div>
        )}

        {/* --- WORKSPACE (When File Loaded) --- */}
        {file && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Control Bar */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
              
              <div className="flex items-center gap-4 w-full md:w-auto">
                <button 
                  onClick={() => setFile(null)} 
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-red-500 transition-colors"
                  title="Batalkan"
                >
                  <X className="w-6 h-6" />
                </button>
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-900 truncate max-w-[200px]">{file.name}</span>
                  <span className="text-sm text-slate-500">{formatBytes(file.size)}</span>
                </div>
              </div>

              {/* Slider Quality */}
              <div className="flex-1 w-full max-w-md px-4">
                <div className="flex justify-between text-sm font-medium mb-2">
                  <span className="text-slate-500 flex items-center gap-2"><Settings2 className="w-4 h-4"/> Kualitas Kompresi</span>
                  <span className="text-blue-600">{quality}%</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="100" 
                  value={quality} 
                  onChange={(e) => setQuality(e.target.value)}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* Action Button */}
              <button 
                onClick={handleCompress}
                disabled={isLoading}
                className={cn(
                  "w-full md:w-auto px-8 py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-2",
                  isLoading 
                    ? "bg-slate-100 text-slate-400 cursor-wait" 
                    : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-600/30"
                )}
              >
                {isLoading ? (
                  <>Memproses...</>
                ) : (
                  <>Compress Image</>
                )}
              </button>
            </div>

            {/* Comparison Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Original */}
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <div className="mb-3 flex justify-between items-center">
                  <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-bold uppercase">Original</span>
                  <span className="text-sm text-slate-400">{formatBytes(file.size)}</span>
                </div>
                <div className="relative aspect-video bg-[url('https://www.transparenttextures.com/patterns/checkerboard.png')] rounded-xl overflow-hidden border border-slate-100">
                  {previewOriginal && (
                    <img src={previewOriginal} alt="Original" className="object-contain w-full h-full" />
                  )}
                </div>
              </div>

              {/* Result */}
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 relative">
                 {/* Loading Overlay */}
                 {isLoading && (
                  <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl">
                    <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3"></div>
                    <p className="text-sm font-medium text-blue-600">Mengompres gambar...</p>
                  </div>
                )}

                <div className="mb-3 flex justify-between items-center">
                  <span className={cn(
                    "px-3 py-1 rounded-lg text-xs font-bold uppercase transition-colors",
                    compressedBlob ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-400"
                  )}>
                    Hasil
                  </span>
                  {compressedBlob ? (
                    <div className="flex gap-2 items-center">
                       <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-md">-{stats.saved}%</span>
                       <span className="text-sm font-medium text-slate-900">{formatBytes(stats.compressed)}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-slate-400">-- MB</span>
                  )}
                </div>

                <div className="relative aspect-video bg-[url('https://www.transparenttextures.com/patterns/checkerboard.png')] rounded-xl overflow-hidden border border-slate-100 flex items-center justify-center">
                  {previewCompressed ? (
                    <img src={previewCompressed} alt="Compressed" className="object-contain w-full h-full" />
                  ) : (
                    <div className="text-slate-300 text-sm flex flex-col items-center">
                      <FileBarChart className="w-8 h-8 mb-2 opacity-50"/>
                      Menunggu proses
                    </div>
                  )}
                </div>
                
                {compressedBlob && (
                  <button 
                    onClick={downloadImage}
                    className="w-full mt-4 bg-slate-900 text-white py-3 rounded-xl font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10"
                  >
                    <Download className="w-4 h-4" /> Download Hasil
                  </button>
                )}
              </div>
            </div>

          </div>
        )}

        {/* --- FEATURES SECTION --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20 mb-20">
            {[
                { title: "Super Cepat", desc: "Proses serverless kilat" },
                { title: "Privasi Aman", desc: "File auto-hapus" },
                { title: "Tanpa Login", desc: "Langsung pakai" },
                { title: "Mobile Friendly", desc: "Desain responsif" },
            ].map((feature, idx) => (
                <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mx-auto mb-3"></div>
                    <h3 className="font-bold text-slate-900">{feature.title}</h3>
                    <p className="text-sm text-slate-500 mt-1">{feature.desc}</p>
                </div>
            ))}
        </div>

      </main>

      {/* --- FOOTER --- */}
      <footer className="border-t border-slate-200 bg-white mt-auto py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-slate-500 font-medium">
            © 2026 SANN404 FORUM
          </p>
          <p className="text-xs text-slate-400 mt-2">
            Dibangun dengan Next.js, Tailwind CSS & Vercel Serverless
          </p>
        </div>
      </footer>
    </div>
  );
}
