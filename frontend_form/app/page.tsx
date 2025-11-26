'use client';

import { useState } from 'react';
import axios from 'axios';
import { put } from '@vercel/blob';

interface PredictionResult {
  label: 'nsfw' | 'normal';
  score: number;
}

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);

    try {
      // Send file to backend for analysis first
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await axios.post<PredictionResult>(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/api/predict`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      // Only upload to Vercel Blob if the image is NOT NSFW (normal content)
      if (response.data && response.data.label === 'normal') {
        await put(`uploads/${Date.now()}-${selectedFile.name}`, selectedFile, {
          access: 'public',
          token: process.env.NEXT_PUBLIC_BLOB_READ_WRITE_TOKEN,
        });
      }

      setResult(response.data);
    } catch (err) {
      setError('Terjadi error pada server. Coba lagi.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white sm:items-start">
        <div className="w-full">
          <h1 className="text-3xl font-semibold text-center mb-8 text-black">
            NSFW Image Detection
          </h1>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pilih Gambar
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {preview && (
            <div className="mb-6 relative">
              <img
                src={preview}
                alt="Preview"
                className={`max-w-full h-auto max-h-64 mx-auto border rounded ${
                  result?.label === 'nsfw' ? 'blur-sm filter' : ''
                }`}
              />
              {result?.label === 'nsfw' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold text-lg shadow-lg">
                    ⚠️ KONTEN NSFW TERDETEKSI
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!selectedFile || loading}
            className="w-full bg-blue-500 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded mb-4"
          >
            {loading ? 'Mengirim gambar...' : 'Cek NSFW'}
          </button>

          {error && (
            <p className="text-red-500 text-center mb-4">{error}</p>
          )}

          {result?.label === 'nsfw' && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Peringatan Konten NSFW
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>Gambar ini terdeteksi mengandung konten yang tidak pantas. Gambar telah di-blur untuk melindungi pengguna.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {result && (
            <div className={`p-4 rounded text-center ${result.label === 'nsfw' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
              <p className="text-lg font-semibold">
                Label: {result.label.toUpperCase()}
              </p>
              <p className="text-md">
                Skor Confidence: {(result.score * 100).toFixed(1)}%
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
