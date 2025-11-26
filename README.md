# NSFW Image Detection Web App

Aplikasi web sederhana untuk moderasi gambar menggunakan model Falconsai/nsfw_image_detection.

## Arsitektur

- **Frontend**: Next.js dengan TypeScript dan Tailwind CSS
- **Backend**: Python dengan FastAPI
- **Storage**: Vercel Blob untuk menyimpan gambar normal (tidak NSFW)
- **Model**: Falconsai/nsfw_image_detection dari Hugging Face (jalan lokal)

Alur: Browser → Next.js → Kirim file ke REST API (FastAPI) → Analisis gambar dengan model lokal → Response JSON → **Hanya upload gambar normal ke Vercel Blob** → Tampilan hasil.

## Struktur Folder

- `/frontend_form` → Proyek Next.js
- `/backend_nsfw` → Server Python FastAPI

## Backend Python

### Dependensi

Install dengan: `pip install -r requirements.txt`

requirements.txt:
```
transformers>=4.21.0
torch>=1.12.0
Pillow>=9.0.0
fastapi>=0.85.0
uvicorn[standard]>=0.18.0
python-multipart>=0.0.5
```

### Kode Utama (main.py)

Memuat model, endpoint POST /api/predict menerima file gambar, analisis dengan model lokal, mengembalikan JSON {"label": "nsfw/normal", "score": 0.987}.

### Menjalankan Backend

```bash
cd backend_nsfw
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Frontend Next.js

### Inisialisasi

Sudah ada, tambahkan dependencies: `npm install axios @vercel/blob`

### Halaman Utama (app/page.tsx)

Form upload gambar → kirim file ke backend untuk analisis → dapat hasil → **hanya upload gambar normal ke Vercel Blob** → tampilan hasil dengan warna (merah NSFW, hijau normal).

**Fitur NSFW Protection:**
- **Blur Effect**: Gambar NSFW otomatis di-blur dengan efek visual
- **Warning Overlay**: Overlay peringatan merah di atas gambar NSFW
- **Alert Component**: Komponen alert merah dengan ikon peringatan dan pesan keamanan

### Konfigurasi Environment

Buat `.env.local`:
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_BLOB_READ_WRITE_TOKEN=your_vercel_blob_token_here
```

**PENTING**: Jangan commit file `.env.local` ke GitHub. Token Vercel Blob dapat didapat dari dashboard Vercel → Storage → Blob → Tokens.

## Integrasi Frontend & Backend

- Backend jalan di http://localhost:8000
- Frontend jalan di http://localhost:3000
- CORS diaktifkan di backend untuk localhost:3000
- Frontend panggil /api/predict dengan axios, kirim FormData

## Petunjuk Menjalankan

1. Setup backend:
   ```bash
   cd backend_nsfw
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```

2. Setup frontend (terminal baru):
   ```bash
   cd frontend_form
   npm install
   npm run dev
   ```

3. Buka http://localhost:3000, upload gambar, lihat hasil.

4. Uji dengan gambar NSFW dan normal. **Catatan: Gambar NSFW tidak akan disimpan ke Vercel Blob, hanya hasil analisis yang ditampilkan.**

## Catatan Performa

- Model cukup berat (~1-2GB RAM), gunakan CPU.
- Batasi ukuran file <5MB, resize gambar sebelum inferensi.
- Untuk laptop standar, inferensi ~5-10 detik tergantung hardware.